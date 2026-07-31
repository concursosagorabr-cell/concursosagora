import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

/**
 * API Route: POST /api/categories/resolve
 *
 * Usada pela IA ou agentes externos na hora de criar um artigo.
 * Recebe o título e o conteúdo do artigo e devolve:
 *  - Lista de categorias existentes no Sanity que se encaixam no artigo
 *  - Sugestões de novas categorias a criar caso nenhuma existente seja adequada
 *
 * Body esperado (JSON):
 * {
 *   "title":   "Concurso SEFAZ-RJ 2025 abre inscrições para Auditor Fiscal",
 *   "content": "... texto completo ou resumo do artigo ...",
 *   "maxSuggestions": 3   // opcional, padrão = 3
 * }
 *
 * Resposta de sucesso:
 * {
 *   "matched": [
 *     { "_id": "abc", "title": "Fiscal & Contábil", "slug": "fiscal-contabil", "score": 0.9 }
 *   ],
 *   "suggested": [
 *     { "title": "Rio de Janeiro", "slug": "rio-de-janeiro", "reason": "Concurso estadual RJ" }
 *   ]
 * }
 */

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-07-25',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
});

/** Busca todas as categorias existentes no Sanity (com contagem de posts) */
const CATEGORIES_WITH_COUNT_QUERY = `
  *[_type == "category"] {
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    description,
    "postCount": count(*[_type == "post" && references(^._id)])
  } | order(postCount desc)
`;

/** Normaliza uma string para comparação */
function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Gera um slug limpo a partir de um título */
function toSlug(title: string) {
  return normalize(title).replace(/\s+/g, '-');
}

interface SanityCategory {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  postCount: number;
}

/**
 * Calcula um score de afinidade entre a categoria e o texto do artigo.
 * Score entre 0 e 1. Retorna 0 se não houver correspondência.
 */
function scoreMatch(category: SanityCategory, searchText: string): number {
  const normalizedCat  = normalize(category.title);
  const normalizedDesc = normalize(category.description || '');
  const normalizedText = normalize(searchText);

  const catWords  = normalizedCat.split(' ').filter(Boolean);
  const textWords = normalizedText.split(' ').filter(Boolean);

  let hits = 0;
  for (const word of catWords) {
    if (word.length < 3) continue; // ignora preposições/artigos curtos
    if (normalizedText.includes(word)) hits++;
  }

  // Bonus se a descrição da categoria também tiver palavras do texto
  const descWords = normalizedDesc.split(' ').filter((w) => w.length >= 3);
  let descHits = 0;
  for (const word of descWords) {
    if (normalizedText.includes(word)) descHits++;
  }

  const titleScore = catWords.length > 0 ? hits / catWords.length : 0;
  const descScore  = descWords.length > 0 ? descHits / descWords.length * 0.3 : 0;

  return Math.min(1, titleScore + descScore);
}

/**
 * Gera sugestões de novas categorias com base no texto do artigo,
 * descartando as que já existem no Sanity.
 */
function generateSuggestions(
  text: string,
  existingCategories: SanityCategory[],
  maxSuggestions: number,
): Array<{ title: string; slug: string; reason: string }> {
  const existingSlugs = new Set(existingCategories.map((c) => toSlug(c.title)));
  const suggestions: Array<{ title: string; slug: string; reason: string }> = [];

  // Detectores simples de padrões comuns em concursos públicos
  const patterns: Array<{ regex: RegExp; title: string; reason: string }> = [
    { regex: /\b(polic[ií]a|delegad[oa]|agente|perito|sesp|ssp)\b/i, title: 'Segurança Pública', reason: 'Cargo ou órgão de segurança pública detectado' },
    { regex: /\b(audit[oa][rn]|fiscal|receita|sefaz|sefat|srf)\b/i, title: 'Fiscal & Contábil', reason: 'Cargo ou órgão fiscal/tributário detectado' },
    { regex: /\b(tribunal|tj[a-z]+|trf|trt|minist[eé]rio p[uú]b|mp[a-z]*)\b/i, title: 'Tribunais & Jurídico', reason: 'Órgão do poder judiciário ou ministério público detectado' },
    { regex: /\b(professor|docente|educação|escola|universidade|federal|ensino)\b/i, title: 'Educação', reason: 'Cargo ou área de educação detectada' },
    { regex: /\b(enfermeir[oa]|médic[oa]|hospital|saúde|sus|assistente social|farmac[eê]utic)\b/i, title: 'Saúde', reason: 'Cargo ou área da saúde detectada' },
    { regex: /\b(banco|banco do brasil|caixa|bradesco|financ[eê]|bndes|bnb|banrisul)\b/i, title: 'Bancária & Financeira', reason: 'Instituição ou cargo bancário/financeiro detectado' },
    { regex: /\b(analista|administrativ[oa]|assistente|secretar[oi]a|técnic[oa])\b/i, title: 'Administrativa', reason: 'Cargo administrativo/técnico detectado' },
    { regex: /\b(federal|nacional|forças armadas|marinha|exercito|aeronáutica)\b/i, title: 'Federal & Nacional', reason: 'Concurso de âmbito federal detectado' },
    { regex: /\b(mu?nic[ií]pi[oa]|prefeitura|câmara municipal)\b/i, title: 'Municipal', reason: 'Concurso municipal detectado' },
    { regex: /\b(estadual|governo do estado|secretaria de estado)\b/i, title: 'Estadual', reason: 'Concurso estadual detectado' },
    // Regiões e Estados (siglas exatas do portal)
    { regex: /\b(são paulo|sp|campinas|santos|sorocaba)\b/i, title: 'SP', reason: 'Estado de São Paulo detectado' },
    { regex: /\b(rio de janeiro|rj|niteroi|duque de caxias)\b/i, title: 'RJ', reason: 'Estado do Rio de Janeiro detectado' },
    { regex: /\b(minas gerais|mg|belo horizonte|uberlandia)\b/i, title: 'MG', reason: 'Estado de Minas Gerais detectado' },
    { regex: /\b(pernambuco|pe|recife|olinda)\b/i, title: 'PE', reason: 'Estado de Pernambuco detectado' },
    { regex: /\b(bahia|ba|salvador|feira de santana)\b/i, title: 'BA', reason: 'Estado da Bahia detectado' },
    { regex: /\b(ceará|ceara|ce|fortaleza)\b/i, title: 'CE', reason: 'Estado do Ceará detectado' },
    { regex: /\b(distrito federal|df|brasília|brasilia)\b/i, title: 'DF', reason: 'Distrito Federal detectado' },
    { regex: /\b(paraná|parana|pr|curitiba|londrina)\b/i, title: 'PR', reason: 'Estado do Paraná detectado' },
    { regex: /\b(rio grande do sul|rs|porto alegre|caxias do sul)\b/i, title: 'RS', reason: 'Estado do Rio Grande do Sul detectado' },
    { regex: /\b(santa catarina|sc|florianópolis|florianopolis|blumenau)\b/i, title: 'SC', reason: 'Estado de Santa Catarina detectado' },
    { regex: /\b(goiás|goias|go|goiânia|goiania)\b/i, title: 'GO', reason: 'Estado de Goiás detectado' },
    { regex: /\b(amazonas|am|manaus)\b/i, title: 'AM', reason: 'Estado do Amazonas detectado' },
    { regex: /\b(piauí|piaui|pi|teresina)\b/i, title: 'PI', reason: 'Estado do Piauí detectado' },
    { regex: /\b(nordeste)\b/i, title: 'Nordeste', reason: 'Região Nordeste detectada' },
    { regex: /\b(sudeste)\b/i, title: 'Sudeste', reason: 'Região Sudeste detectada' },
    { regex: /\b(norte)\b/i, title: 'Norte', reason: 'Região Norte detectada' },
    { regex: /\b(sul)\b/i, title: 'Sul', reason: 'Região Sul detectada' },
    { regex: /\b(centro.?oeste)\b/i, title: 'Centro-Oeste', reason: 'Região Centro-Oeste detectada' },
    { regex: /\b(nacional|federal|uniao|união)\b/i, title: 'Nacional', reason: 'Âmbito Nacional / Federal detectado' },
  ];

  for (const p of patterns) {
    if (suggestions.length >= maxSuggestions) break;
    if (!p.regex.test(text)) continue;
    const slug = toSlug(p.title);
    if (existingSlugs.has(slug)) continue; // já existe no Sanity
    if (suggestions.some((s) => s.slug === slug)) continue; // já sugerido
    suggestions.push({ title: p.title, slug, reason: p.reason });
  }

  return suggestions.slice(0, maxSuggestions);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title = '', content = '', maxSuggestions = 3 } = body;

    if (!title && !content) {
      return NextResponse.json(
        { error: 'Informe ao menos o campo "title" ou "content".' },
        { status: 400 },
      );
    }

    const searchText = `${title} ${content}`;

    // 1. Busca todas as categorias existentes no Sanity
    const allCategories: SanityCategory[] = await client.fetch(CATEGORIES_WITH_COUNT_QUERY);

    // 2. Calcula score de afinidade para cada categoria
    const scored = allCategories
      .map((cat) => ({ ...cat, score: scoreMatch(cat, searchText) }))
      .filter((cat) => cat.score > 0.2) // threshold mínimo de relevância
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // top 5 mais relevantes

    // 3. Gera sugestões de novas categorias (só se score alto não foi encontrado)
    const hasStrongMatch = scored.some((c) => c.score >= 0.7);
    const suggested = hasStrongMatch
      ? [] // boas categorias encontradas, sem necessidade de sugerir novas
      : generateSuggestions(searchText, allCategories, maxSuggestions);

    return NextResponse.json({
      matched:   scored.map(({ _id, title, slug, postCount, score }) => ({ _id, title, slug, postCount, score: +score.toFixed(2) })),
      suggested,
      total_categories_in_sanity: allCategories.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[/api/categories/resolve]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Opcional: GET /api/categories/resolve — lista todas as categorias com contagem de posts */
export async function GET() {
  try {
    const categories: SanityCategory[] = await client.fetch(CATEGORIES_WITH_COUNT_QUERY);
    return NextResponse.json({ categories, total: categories.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
