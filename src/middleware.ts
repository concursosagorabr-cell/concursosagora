import { NextRequest, NextResponse } from 'next/server';

/**
 * Canonicalização de host: o portal responde APENAS em
 * `www.concursosagora.com.br`. O apex (`concursosagora.com.br`) é
 * redirecionado com 308 antes de qualquer cache de página.
 *
 * Sem isso, apex e www podem servir snapshots ISR diferentes (dois caches,
 * duas datas no topo, links internos duplicados no Googlebot).
 */
const CANONICAL_HOST = 'www.concursosagora.com.br';
const APEX_HOST = 'concursosagora.com.br';

function readHost(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-host');
  const host = forwarded || request.headers.get('host') || request.nextUrl.host;
  return host.split(',')[0].trim().toLowerCase().split(':')[0];
}

export function middleware(request: NextRequest) {
  const host = readHost(request);

  if (host === APEX_HOST) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Ignora assets do Next para não adicionar latência no caminho crítico.
  matcher: ['/((?!_next/).*)'],
};
