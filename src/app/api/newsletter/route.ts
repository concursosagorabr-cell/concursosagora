import { NextRequest, NextResponse } from 'next/server';

// Rate limiting simples por IP (em memória por instância serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

// Domínios de e-mail descartáveis
const BLOCKED_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com',
  'throwam.com', 'yopmail.com', 'sharklasers.com',
  'trashmail.com', 'dispostable.com',
]);

export async function POST(request: NextRequest) {
  // ── Verificação de configuração ───────────────────────────────────────────
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('[newsletter] BREVO_API_KEY não configurada no ambiente.');
    return NextResponse.json(
      { error: 'Serviço de newsletter não configurado.' },
      { status: 503 },
    );
  }

  // Alerta caso o usuário tenha colado uma chave SMTP em vez de uma Chave API
  if (apiKey.startsWith('xsmtpsib-')) {
    console.error(
      '[newsletter] ERRO DE CONFIGURAÇÃO: A chave configurada (xsmtpsib-...) é uma Chave SMTP. A API da Brevo exige uma Chave API v3 (que começa com xkeysib-). Gerar em: Brevo -> SMTP & API -> Chaves API.',
    );
  }

  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' },
      { status: 429 },
    );
  }

  // ── Validação do body ────────────────────────────────────────────────────
  let email: string;
  try {
    const body = await request.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }

  // Validação de formato
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 422 });
  }

  // Bloqueia domínios descartáveis
  const domain = email.split('@')[1];
  if (BLOCKED_DOMAINS.has(domain)) {
    return NextResponse.json(
      { error: 'Use um e-mail válido para se cadastrar.' },
      { status: 422 },
    );
  }

  // ── Adicionar contato na Brevo ────────────────────────────────────────────
  try {
    const payload: Record<string, unknown> = {
      email,
      updateEnabled: true, // Se o contato já existir, atualiza sem dar erro
    };

    const listId = process.env.BREVO_LIST_ID;
    if (listId && !isNaN(Number(listId))) {
      payload.listIds = [Number(listId)];
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    // 201 = Criado, 204/200 = Sucesso ou Atualizado
    if (response.status === 201) {
      return NextResponse.json({ success: true, alreadySubscribed: false });
    }
    if (response.status === 204 || response.status === 200) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    const errorData = (await response.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };

    console.error('[newsletter] Brevo status:', response.status, errorData);

    // Trata caso a Brevo retorne erro de contato duplicado (HTTP 400)
    if (
      response.status === 400 &&
      (errorData.code === 'duplicate_parameter' ||
        errorData.message?.toLowerCase().includes('already exist'))
    ) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // Chave inválida / 401 / IP não autorizado
    if (response.status === 401) {
      if (errorData.message?.toLowerCase().includes('ip address')) {
        console.error('[newsletter] Brevo bloqueou por IP não autorizado:', errorData.message);
        return NextResponse.json(
          {
            error:
              'A Brevo bloqueou o acesso devido à restrição de IP. Acesse Configurações -> Segurança -> IPs Autorizados na Brevo e remova o bloqueio de IP para permitir a hospedagem em nuvem (Vercel).',
          },
          { status: 401 },
        );
      }
      return NextResponse.json(
        {
          error:
            'Erro de autenticação com a Brevo. Verifique se a chave cadastrada é uma Chave API (xkeysib-...) ativa.',
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: errorData.message || 'Não foi possível completar o cadastro. Tente novamente.' },
      { status: 400 },
    );
  } catch (err) {
    console.error('[newsletter] Erro de rede ou servidor:', err);
    return NextResponse.json(
      { error: 'Erro de conexão ao salvar e-mail. Tente novamente.' },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({ error: 'Método não permitido.' }, { status: 405 });
}
