import { client } from './sanity';
import { EXAM_BOARDS } from '../utils/bancas';
import { getCategoryAliases } from '../utils/categories';
import { getMatchingHubForPost } from '../utils/hubs';

/**
 * Planejamento de invalidação do cache (ISR + Data Cache) do frontend.
 *
 * A regra é simples: toda publicação/edição no Sanity precisa refrescar
 * (1) as listagens que dão links internos para a matéria e (2) a própria
 * matéria. Sem isso o leitor e o Googlebot continuam vendo um snapshot
 * antigo da home, de /noticias, das categorias e dos hubs.
 */

export interface RevalidationPlan {
  tags: string[];
  paths: string[];
}

export interface SanityRevalidationDocument {
  _id?: string;
  _type?: string;
  title?: string;
  slug?: string;
  stateUf?: string;
  region?: string;
  hubAreas?: string[];
  banca?: string;
  educationLevel?: string | string[];
  authorSlug?: string;
  authorId?: string;
  categories?: Array<{ slug?: string | null; title?: string | null }>;
}

/**
 * Tags compartilhadas por todas as listagens do portal.
 * Qualquer publicação altera contagem, ordem, sidebar, sitemap e feed.
 */
export const LISTING_TAGS = [
  'posts',
  'recent-posts',
  'top-posts',
  'directory-posts',
  'high-salary-posts',
  'sitemap',
  'sitemap-news',
  'feed',
] as const;

/**
 * Rotas de listagem de maior autoridade (home, arquivo geral, diretório e hubs).
 * São as páginas que distribuem links internos para as matérias novas.
 */
export const LISTING_PATHS = [
  '/',
  '/noticias',
  '/concursos',
  '/hub',
  '/concursos/salario-acima-de-10-mil',
  '/sitemap.xml',
  '/news-sitemap.xml',
  '/feed.xml',
] as const;

const EDUCATION_LEVEL_PATHS: Record<string, string> = {
  fundamental: 'nivel-fundamental',
  medio: 'nivel-medio',
  'médio': 'nivel-medio',
  superior: 'nivel-superior',
};

const EDUCATION_LEVEL_KEYS: Record<string, string> = {
  fundamental: 'fundamental',
  medio: 'medio',
  'médio': 'medio',
  superior: 'superior',
};

const MAX_ITEMS = 200;

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim())))).slice(
    0,
    MAX_ITEMS
  );
}

/** Converte "São Paulo" em "sao-paulo" (mesma normalização usada nas rotas). */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Extrai um slug de string, `{ current }`, `{ slug }` ou referência Sanity. */
function readSlug(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  return (
    readSlug(record.current) ||
    readSlug(record.slug) ||
    readSlug(record._id) ||
    readSlug(record._ref)
  );
}

/** Normaliza o payload do webhook do Sanity (documento bruto ou já projetado). */
export function normalizeDocument(input: unknown): SanityRevalidationDocument | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;

  const type = typeof raw._type === 'string' ? raw._type : undefined;
  const id = typeof raw._id === 'string' ? raw._id : undefined;
  if (!type && !id) return null;

  const categories = Array.isArray(raw.categories)
    ? raw.categories.map((category) => {
        if (typeof category === 'string') return { slug: category, title: null };
        if (!category || typeof category !== 'object') return { slug: null, title: null };
        const record = category as Record<string, unknown>;
        return {
          slug: readSlug(record.slug) || readSlug(record._ref) || readSlug(record._id),
          title: typeof record.title === 'string' ? record.title : null,
        };
      })
    : [];

  return {
    _id: id,
    _type: type,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    slug: readSlug(raw.slug) || (typeof raw.slug === 'string' ? raw.slug : undefined) || undefined,
    stateUf: typeof raw.stateUf === 'string' ? raw.stateUf : undefined,
    region: typeof raw.region === 'string' ? raw.region : undefined,
    hubAreas: Array.isArray(raw.hubAreas)
      ? raw.hubAreas.filter((hub): hub is string => typeof hub === 'string' && hub.trim().length > 0)
      : undefined,
    banca: typeof raw.banca === 'string' ? raw.banca : undefined,
    educationLevel: Array.isArray(raw.educationLevel)
      ? raw.educationLevel.filter((level): level is string => typeof level === 'string')
      : typeof raw.educationLevel === 'string'
        ? [raw.educationLevel]
        : undefined,
    authorSlug: readSlug(raw.authorSlug) || undefined,
    authorId: typeof raw.authorId === 'string' ? raw.authorId : readSlug(raw.author) || undefined,
    categories,
  };
}

/**
 * Monta a lista de tags e caminhos afetados por um documento do Sanity.
 * Quando o documento não é informado (ex.: publicação em lote pelo pipeline),
 * devolve o pacote completo de listagens — nunca deixa a home de fora.
 */
export function buildRevalidationPlan(document?: SanityRevalidationDocument | null): RevalidationPlan {
  const tags: Array<string | null | undefined> = [...LISTING_TAGS];
  const paths: Array<string | null | undefined> = [...LISTING_PATHS];

  if (!document) {
    return { tags: unique(tags), paths: unique(paths) };
  }

  const type = document._type;
  const slug = document.slug ? document.slug.trim() : null;

  if (type === 'post') {
    if (slug) {
      tags.push(`post:${slug}`);
      paths.push(`/post/${slug}`);
    }

    // Categorias do post (com sinônimos usados pela página /categoria/[slug])
    for (const category of document.categories || []) {
      const categorySlug = category.slug ? category.slug.trim() : null;
      if (!categorySlug) continue;
      for (const alias of getCategoryAliases(categorySlug)) {
        tags.push(`category:${alias}`);
        paths.push(`/categoria/${alias}`);
      }
      paths.push(`/categoria/${categorySlug}`);
      if (category.title) {
        const titleSlug = slugify(category.title);
        if (titleSlug) paths.push(`/categoria/${titleSlug}`);
      }
    }

    // Hubs editoriais explícitos (Área/Silo) + fallback por palavras-chave
    for (const hubArea of document.hubAreas || []) {
      tags.push(`hub:${hubArea}`);
      paths.push(`/hub/${hubArea}`);
    }
    if (!document.hubAreas || document.hubAreas.length === 0) {
      const categoryLabels = (document.categories || [])
        .flatMap((category) => [category.slug || '', category.title || ''])
        .filter(Boolean);
      const hub = getMatchingHubForPost(document.title || '', categoryLabels);
      if (hub) {
        tags.push(`hub:${hub.slug}`);
        paths.push(`/hub/${hub.slug}`);
      }
    }

    // Região: a página /categoria/sul (e equivalentes) também precisa refrescar
    if (document.region && document.region.toLowerCase() !== 'nacional') {
      const regionSlug = slugify(document.region);
      if (regionSlug) {
        tags.push(`category:${regionSlug}`);
        paths.push(`/categoria/${regionSlug}`);
      }
    }

    // Estado / UF: categorias estaduais e páginas programáticas
    if (document.stateUf && document.stateUf.trim().toLowerCase() !== 'nacional') {
      const uf = document.stateUf.trim().toLowerCase();
      const stateSlug = uf === 'al' ? 'alagoas' : uf;
      tags.push(`state:${uf}`);
      paths.push(`/categoria/${stateSlug}`);
      paths.push(`/concursos-abertos/${uf}`);
      for (const level of document.educationLevel || []) {
        const normalizedLevel = level.trim().toLowerCase();
        const niveau = EDUCATION_LEVEL_PATHS[normalizedLevel];
        if (niveau) paths.push(`/concursos/${niveau}/${uf}`);
        const educationKey = EDUCATION_LEVEL_KEYS[normalizedLevel];
        if (educationKey) tags.push(`edu-state:${educationKey}:${uf}`);
      }
    }

    // Banca organizadora: guias /banca/[slug]
    if (document.banca) {
      const bancaText = document.banca.toLowerCase();
      for (const board of Object.values(EXAM_BOARDS)) {
        if (
          bancaText.includes(board.slug) ||
          bancaText.includes(board.shortName.toLowerCase()) ||
          bancaText.includes(board.name.toLowerCase())
        ) {
          tags.push(`banca:${board.slug}`);
          paths.push(`/banca/${board.slug}`);
          break;
        }
      }
    }

    // Página do autor (contagem de matérias muda a cada publicação)
    if (document.authorId) {
      tags.push(`author:${document.authorId}`);
    }
    if (document.authorSlug) {
      paths.push(`/autor/${document.authorSlug}`);
    }
  }

  if (type === 'category') {
    tags.push('categories');
    if (slug) {
      for (const alias of getCategoryAliases(slug)) {
        tags.push(`category:${alias}`);
        paths.push(`/categoria/${alias}`);
      }
      paths.push(`/categoria/${slug}`);
    }
    if (document.title) {
      const titleSlug = slugify(document.title);
      if (titleSlug) paths.push(`/categoria/${titleSlug}`);
    }
  }

  if (type === 'author') {
    tags.push('authors');
    if (slug) {
      tags.push(`author:${slug}`);
      paths.push(`/autor/${slug}`);
    }
  }

  return { tags: unique(tags), paths: unique(paths) };
}

/** Mescla um plano calculado com tags/paths explícitos enviados no corpo. */
export function mergePlan(plan: RevalidationPlan, explicit?: RevalidationPlan): RevalidationPlan {
  if (!explicit) return plan;
  return {
    tags: unique([...plan.tags, ...explicit.tags]),
    paths: unique([...plan.paths, ...explicit.paths]),
  };
}

const ENRICH_QUERY = `*[_id in $ids][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  stateUf,
  region,
  hubAreas,
  banca,
  educationLevel,
  "authorSlug": author->slug.current,
  "authorId": author->_id,
  "categories": coalesce(categories[]->{ "slug": coalesce(slug.current, _id), title }, [])
}`;

/**
 * Busca o documento publicado no Sanity para resolver referências de categoria,
 * autor e estado. Rascunhos (`drafts.*`) são resolvidos para o documento publicado.
 * Em caso de falha, o webhook segue com o payload recebido.
 */
export async function enrichDocumentFromSanity(
  document: SanityRevalidationDocument
): Promise<SanityRevalidationDocument | null> {
  const id = document._id;
  if (!id) return null;

  const ids = Array.from(new Set([id.replace(/^drafts\./, ''), id]));

  try {
    const raw = await client
      .withConfig({ useCdn: false })
      .fetch<Record<string, unknown> | null>(ENRICH_QUERY, { ids }, { cache: 'no-store' });
    return raw ? normalizeDocument(raw) : null;
  } catch (error) {
    console.warn('[/api/revalidate] Não foi possível enriquecer o documento no Sanity:', error);
    return null;
  }
}
