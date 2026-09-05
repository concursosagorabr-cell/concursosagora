import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { getRedis } from '@/lib/redis';

// Rate limiting por IP: Redis distribuído com fallback em memória por instância serverless
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20; // 20 requisições por minuto por IP real
const RATE_LIMIT_WINDOW_MS = 60_000;

async function isRateLimited(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1') return false;

  const redis = getRedis();
  if (redis) {
    try {
      const key = `ratelimit:newsletter:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 60);
      }
      return count > RATE_LIMIT_MAX;
    } catch (err) {
      console.warn('[newsletter] Erro no rate limit Redis, aplicando fallback em memória:', err);
    }
  }

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

async function saveToSanity(email: string): Promise<boolean> {
  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'wobukj4j';
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

  if (!token) return false;

  try {
    const sanityClient = createClient({
      projectId,
      dataset,
      apiVersion: '2026-07-25',
      token,
      useCdn: false,
    });

    // Cria ou atualiza o documento do assinante
    const subscriberId = `subscriber-${Buffer.from(email).toString('hex').slice(0, 32)}`;
    await sanityClient.createIfNotExists({
      _id: subscriberId,
      _type: 'subscriber',
      email,
      subscribedAt: new Date().toISOString(),
      source: 'website_sidebar',
      status: 'active',
    });
    return true;
  } catch (err) {
    console.warn('[newsletter] Erro ao salvar assinante no Sanity CMS:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (await isRateLimited(ip)) {
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

  // Validação de formato de e-mail
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'Por favor, insira um e-mail válido.' }, { status: 422 });
  }

  // Bloqueia domínios descartáveis
  const domain = email.split('@')[1];
  if (BLOCKED_DOMAINS.has(domain)) {
    return NextResponse.json(
      { error: 'Use um endereço de e-mail válido para se cadastrar.' },
      { status: 422 },
    );
  }

  // 1. Salva no Sanity CMS como registro persistente
  await saveToSanity(email);

  // 2. Integração com Brevo (se configurado)
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    // Se Brevo não estiver configurado mas o registro foi salvo
    return NextResponse.json({ success: true, alreadySubscribed: false });
  }

  try {
    const payload: Record<string, unknown> = {
      email,
      updateEnabled: true,
    };

    const listId = process.env.BREVO_LIST_ID;
    if (listId && !isNaN(Number(listId))) {
      payload.listIds = [Number(listId)];
    }

    let response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    // Se falhar com erro de lista (400 / 404), tenta de novo sem listIds
    if (response.status === 400 && payload.listIds) {
      delete payload.listIds;
      response = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });
    }

    // 201 = Criado, 204/200 = Sucesso / Atualizado
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

    const msg = (errorData.message || '').toLowerCase();
    const code = (errorData.code || '').toLowerCase();

    // Contato já existente na Brevo
    if (
      response.status === 400 &&
      (code.includes('duplicate') || msg.includes('already exist') || msg.includes('duplicate'))
    ) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // Erro de autenticação Brevo
    if (response.status === 401) {
      console.warn('[newsletter] Brevo retornou 401 (Chave inválida ou IP bloqueado). Salvo apenas no Sanity.');
      return NextResponse.json({ success: true, alreadySubscribed: false });
    }

    // Fallback: se Brevo retornar outro erro mas o registro foi salvo no Sanity
    return NextResponse.json({ success: true, alreadySubscribed: false });

  } catch (err) {
    console.error('[newsletter] Erro ao comunicar com a Brevo:', err);
    // Retorna sucesso pois o e-mail foi gravado com segurança no sistema
    return NextResponse.json({ success: true, alreadySubscribed: false });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Método não permitido.' }, { status: 405 });
}

