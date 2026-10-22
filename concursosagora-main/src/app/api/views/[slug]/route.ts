import { NextRequest, NextResponse } from 'next/server';
import { getRedis, REDIS_KEYS } from '@/lib/redis';

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

const BOT_USER_AGENTS = /bot|spider|crawl|slurp|facebookexternalhit|whatsapp|preview|headless/i;

// Rate limiting por IP: Redis distribuído com fallback em memória por instância serverless
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // Máximo 60 visualizações por minuto por IP real
const RATE_LIMIT_WINDOW_MS = 60_000;

async function isRateLimited(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1') return false;

  const redis = getRedis();
  if (redis) {
    try {
      const key = `ratelimit:views:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 60);
      }
      return count > RATE_LIMIT_MAX;
    } catch (err) {
      console.warn('[views] Erro no rate limit Redis, aplicando fallback em memória:', err);
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

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ip =
      req.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente mais tarde.', rateLimited: true },
        { status: 429 }
      );
    }

    const { slug } = await context.params;

    if (!slug || typeof slug !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
    }

    // Evita contabilizar robôs, spiders e scrapers
    const userAgent = req.headers.get('user-agent') || '';
    if (BOT_USER_AGENTS.test(userAgent)) {
      return NextResponse.json({ success: true, ignored: 'bot' });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ success: true, fallback: true, views: 0 });
    }

    // Incrementa no ranking global (Sorted Set) e na chave individual
    const [viewsScore] = await Promise.all([
      redis.zincrby(REDIS_KEYS.POSTS_VIEWS_ALL, 1, slug),
      redis.incr(`${REDIS_KEYS.POST_VIEW_PREFIX}${slug}`),
    ]);

    return NextResponse.json({
      success: true,
      slug,
      views: typeof viewsScore === 'number' ? viewsScore : parseFloat(String(viewsScore)),
    });
  } catch (error) {
    console.error('[API Views POST] Erro ao incrementar visualização:', error);
    return NextResponse.json({ error: 'Erro interno ao processar visualização' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ slug, views: 0 });
    }

    const views = await redis.get<number>(`${REDIS_KEYS.POST_VIEW_PREFIX}${slug}`);

    return NextResponse.json({
      slug,
      views: views || 0,
    });
  } catch (error) {
    console.error('[API Views GET] Erro ao buscar visualizações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
