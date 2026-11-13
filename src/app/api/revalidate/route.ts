import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import crypto from 'crypto';
import {
  buildRevalidationPlan,
  enrichDocumentFromSanity,
  mergePlan,
  normalizeDocument,
  type RevalidationPlan,
} from '@/lib/revalidation';

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
 * Valida a assinatura enviada pelo Sanity em `sanity-webhook-signature`.
 * Formato compatível com Stripe: `t=<timestamp>,v1=<assinatura>`.
 * A assinatura é o HMAC-SHA256 de `<timestamp>.<corpo>` (aceita hex e base64).
 */
function verifySanitySignature(rawBody: string, header: string, secret: string): boolean {
  try {
    const parts: Record<string, string> = {};
    for (const segment of header.split(',')) {
      const separator = segment.indexOf('=');
      if (separator <= 0) continue;
      parts[segment.slice(0, separator).trim()] = segment.slice(separator + 1).trim();
    }

    const provided = parts.v1 || parts.v0;
    if (!provided) return false;

    const timestamp = parts.t;
    const payloads = timestamp ? [`${timestamp}.${rawBody}`, rawBody] : [rawBody];

    for (const payload of payloads) {
      const hex = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
      const base64 = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
      if (constantTimeCompare(provided, hex) || constantTimeCompare(provided, base64)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function readExplicitList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 200);
}

/**
 * Endpoint seguro de invalidação de cache (ISR + Data Cache) do portal.
 *
 * Aceita dois formatos:
 * 1. Webhook "cru" do Sanity — o documento em si (`_type`, `slug`, `categories`...).
 *    Nesse caso as tags e rotas afetadas são calculadas automaticamente
 *    (home, /noticias, /concursos, categorias, hubs, estado, banca, autor e a matéria).
 * 2. Publicações programáticas (pipeline/agente) — `{ tags, paths }` explícitos.
 *    Quando nada é informado, invalida o pacote completo de listagens.
 *
 * Autenticação (uma das opções):
 * - `Authorization: Bearer <SANITY_REVALIDATE_SECRET>`
 * - `x-revalidate-secret: <SANITY_REVALIDATE_SECRET>`
 * - assinatura `sanity-webhook-signature` gerada pelo Sanity com o mesmo segredo
 * - `{"secret": "..."}` no corpo JSON (mantido por compatibilidade)
 *
 * Segredo em query string é proibido (evita vazamento em logs e histórico).
 */
export async function POST(request: NextRequest) {
  try {
    const validSecret = (process.env.SANITY_REVALIDATE_SECRET || '').trim();

    // Falha de forma segura se o segredo não estiver configurado.
    // JAMAIS utilize strings de fallback hardcoded no código!
    if (!validSecret) {
      console.error('[/api/revalidate] ERRO CRÍTICO: SANITY_REVALIDATE_SECRET não configurado no servidor.');
      return NextResponse.json(
        { error: 'Erro de configuração do servidor. Revalidação desabilitada por segurança.' },
        { status: 500 }
      );
    }

    // O corpo precisa ser lido como texto para validar a assinatura HMAC do Sanity.
    const rawBody = await request.text();

    let body: any = {};
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      body = {};
    }

    // 1. Extração do segredo (header Authorization > header dedicado > assinatura)
    const authHeader = request.headers.get('authorization');
    let suppliedSecret: string | null =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!suppliedSecret) {
      const headerSecret = request.headers.get('x-revalidate-secret');
      if (headerSecret) suppliedSecret = headerSecret.trim();
    }

    const signatureHeader =
      request.headers.get('sanity-webhook-signature') ||
      request.headers.get('x-sanity-webhook-signature');
    const signatureValid = signatureHeader
      ? verifySanitySignature(rawBody, signatureHeader, validSecret)
      : false;

    // 2. Validação estrita do segredo via comparação em tempo constante
    const bearerValid = Boolean(suppliedSecret && constantTimeCompare(suppliedSecret, validSecret));
    const bodySecretValid = Boolean(
      body && typeof body.secret === 'string' && constantTimeCompare(body.secret.trim(), validSecret)
    );

    if (!signatureValid && !bearerValid && !bodySecretValid) {
      return NextResponse.json(
        { error: 'Não autorizado. Token de revalidação inválido ou ausente.' },
        { status: 401 }
      );
    }

    // 3. Webhook cru do Sanity (`{ _id, _type, slug, categories... }`) ou `{ document: {...} }`
    const rawDocument = body?.document ?? body;
    const document = normalizeDocument(rawDocument);

    // 4. Tags/paths explícitos (pipeline, scripts e webhooks com projection própria)
    const explicit: RevalidationPlan = {
      tags: readExplicitList(body?.tags),
      paths: readExplicitList(body?.paths),
    };

    let plan: RevalidationPlan;

    if (document) {
      // Resolve referências (categorias, autor) com uma leitura fresca do Sanity.
      const enriched = await enrichDocumentFromSanity(document);
      plan = mergePlan(buildRevalidationPlan(enriched || document), explicit);
    } else {
      // Sem documento: pacote completo de listagens + o que veio explícito.
      plan = mergePlan(buildRevalidationPlan(), explicit);
    }

    const revalidatedTags: string[] = [];
    const revalidatedPaths: string[] = [];

    for (const tag of plan.tags) {
      try {
        revalidateTag(tag);
        revalidatedTags.push(tag);
      } catch (tagErr) {
        console.warn(`[/api/revalidate] Falha ao revalidar tag '${tag}':`, tagErr);
      }
    }

    for (const path of plan.paths) {
      try {
        revalidatePath(path);
        revalidatedPaths.push(path);
      } catch (pathErr) {
        console.warn(`[/api/revalidate] Falha ao revalidar path '${path}':`, pathErr);
      }
    }

    // Categorias e autores aparecem no menu/rodapé (layout compartilhado).
    // Nesses casos vale invalidar o layout inteiro para o menu não ficar defasado.
    if (document && (document._type === 'category' || document._type === 'author')) {
      try {
        revalidatePath('/', 'layout');
        revalidatedPaths.push('/ (layout)');
      } catch (layoutErr) {
        console.warn('[/api/revalidate] Falha ao revalidar layout:', layoutErr);
      }
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      document: document
        ? {
            id: document._id || null,
            type: document._type || null,
            slug: document.slug || null,
          }
        : null,
      tags: revalidatedTags,
      paths: revalidatedPaths,
      message: `Cache invalidado com sucesso para ${revalidatedTags.length} tags e ${revalidatedPaths.length} caminhos.`,
    });
  } catch (err: any) {
    console.error('[/api/revalidate] Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno ao revalidar cache' }, { status: 500 });
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
