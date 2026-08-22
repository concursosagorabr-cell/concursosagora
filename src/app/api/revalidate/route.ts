import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Endpoint seguro para Invalidação de Cache On-Demand (Webhooks Sanity / Agentes de Automação)
 * POST /api/revalidate?secret=...
 * ou com payload JSON:
 * {
 *   "secret": "...",
 *   "tags": ["posts", "categories", "post:slug-do-artigo"],
 *   "paths": ["/", "/post/slug-do-artigo"]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body pode estar vazio se enviado via GET/query
    }

    const secret = body.secret || querySecret;
    const validSecret = process.env.SANITY_REVALIDATE_SECRET || 'concursos-agora-secret-token-2026';

    if (!secret || secret !== validSecret) {
      return NextResponse.json(
        { error: 'Não autorizado. Token de revalidação inválido ou ausente.' },
        { status: 401 }
      );
    }

    const tags: string[] = body.tags || (searchParams.get('tag') ? [searchParams.get('tag')!] : ['posts']);
    const paths: string[] = body.paths || (searchParams.get('path') ? [searchParams.get('path')!] : []);

    const revalidatedTags: string[] = [];
    const revalidatedPaths: string[] = [];

    // Invalida as tags de cache
    for (const tag of tags) {
      if (tag && typeof tag === 'string') {
        revalidateTag(tag);
        revalidatedTags.push(tag);
      }
    }

    // Invalida os paths especificados
    for (const p of paths) {
      if (p && typeof p === 'string') {
        revalidatePath(p);
        revalidatedPaths.push(p);
      }
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      tags: revalidatedTags,
      paths: revalidatedPaths,
      message: `Cache invalidado com sucesso para ${revalidatedTags.length} tags e ${revalidatedPaths.length} caminhos.`,
    });
  } catch (err: any) {
    console.error('[/api/revalidate] Erro ao revalidar cache:', err);
    return NextResponse.json({ error: 'Erro interno ao revalidar cache', details: err?.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
