import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import crypto from 'crypto';

/**
 * Compara dois segredos em tempo constante para prevenir ataques de timing (Timing Attacks).
 */
function constantTimeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Endpoint seguro para Invalidação de Cache On-Demand.
 * Apenas método POST é aceito.
 * O segredo DEVE ser enviado via cabeçalho Authorization: Bearer <secret> ou no corpo JSON {"secret": "..."}.
 * Passagem de segredo via query string é estritamente proibida (evita vazamento em logs e histórico).
 */
export async function POST(request: NextRequest) {
  try {
    const validSecret = process.env.SANITY_REVALIDATE_SECRET;

    // Se o segredo não estiver configurado nas variáveis de ambiente, falha de forma segura
    // JAMAIS utilize strings de fallback hardcoded no código!
    if (!validSecret || !validSecret.trim()) {
      console.error('[/api/revalidate] ERRO CRÍTICO: SANITY_REVALIDATE_SECRET não configurado no servidor.');
      return NextResponse.json(
        { error: 'Erro de configuração do servidor. Revalidação desabilitada por segurança.' },
        { status: 500 }
      );
    }

    // 1. Extração do segredo (Prioridade 1: Header Authorization Bearer; Prioridade 2: JSON Body)
    let suppliedSecret: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      suppliedSecret = authHeader.slice(7).trim();
    }

    let body: any = {};
    try {
      body = await request.json();
      if (!suppliedSecret && body && typeof body.secret === 'string') {
        suppliedSecret = body.secret.trim();
      }
    } catch {
      // Body vazio ou não-JSON
    }

    // 2. Validação estrita do segredo via comparação em tempo constante
    if (!suppliedSecret || !constantTimeCompare(suppliedSecret, validSecret.trim())) {
      return NextResponse.json(
        { error: 'Não autorizado. Token de revalidação inválido ou ausente.' },
        { status: 401 }
      );
    }

    // 3. Extração segura de tags e paths exclusivamente do corpo JSON
    const rawTags = Array.isArray(body?.tags) ? body.tags : [];
    const rawPaths = Array.isArray(body?.paths) ? body.paths : [];

    // Fallback padrão seguro se nenhum for fornecido
    const tags: string[] = rawTags.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0);
    const paths: string[] = rawPaths.filter((p: unknown): p is string => typeof p === 'string' && p.trim().length > 0);

    if (tags.length === 0 && paths.length === 0) {
      tags.push('posts');
    }

    const revalidatedTags: string[] = [];
    const revalidatedPaths: string[] = [];

    // Invalida as tags de cache
    for (const tag of tags) {
      try {
        revalidateTag(tag);
        revalidatedTags.push(tag);
      } catch (tagErr) {
        console.warn(`[/api/revalidate] Falha ao revalidar tag '${tag}':`, tagErr);
      }
    }

    // Invalida os paths especificados
    for (const p of paths) {
      try {
        revalidatePath(p);
        revalidatedPaths.push(p);
      } catch (pathErr) {
        console.warn(`[/api/revalidate] Falha ao revalidar path '${p}':`, pathErr);
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
    console.error('[/api/revalidate] Erro interno:', err);
    return NextResponse.json(
      { error: 'Erro interno ao revalidar cache' },
      { status: 500 }
    );
  }
}

/**
 * Bloqueia expressamente requisições GET (operações de mutação não devem ser acionadas via GET).
 */
export function GET() {
  return NextResponse.json(
    { error: 'Método não permitido. Mutações de cache devem ser enviadas exclusivamente via POST.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
