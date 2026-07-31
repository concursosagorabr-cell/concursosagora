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
    console.error('[newsletter] BREVO_API_KEY não configurada.');
    return NextResponse.json(
      { error: 'Serviço indisponível no momento.' },
      { status: 503 },
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
      updateEnabled: true, // se já existir, apenas atualiza sem erro
    };

    // Se BREVO_LIST_ID estiver configurado, adiciona à lista específica
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

    // 201 = criado, 204 = já existia (updateEnabled) — ambos são sucesso
    if (response.status === 201) {
      return NextResponse.json({ success: true, alreadySubscribed: false });
    }
    if (response.status === 204) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // Erro da Brevo
    const errorData = await response.json().catch(() => ({}));
    console.error('[newsletter] Brevo retornou erro:', response.status, errorData);

    return NextResponse.json(
      { error: 'Não foi possível completar o cadastro. Tente novamente.' },
      { status: 502 },
    );
  } catch (err) {
    console.error('[newsletter] Erro inesperado:', err);
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente em instantes.' },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({ error: 'Método não permitido.' }, { status: 405 });
}
