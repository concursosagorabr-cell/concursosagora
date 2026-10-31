import type { Author, Post } from '@/types';
import { SITE_URL } from './constants';
import { getDescriptiveImageAlt } from '@/utils/imageAlt';
import { urlFor } from './image';

const TZ = 'America/Sao_Paulo';

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function getPostSlug(post: Pick<Post, 'slug' | '_id'>): string {
  return typeof post.slug === 'string' ? post.slug : (post.slug as any)?.current || post._id;
}

export function getAuthorUrl(author?: Author | null): string | null {
  if (!author) return null;
  const slug = author.slug || author._id;
  return `${SITE_URL}/autor/${slug}`;
}

function titlePrefix(title?: string): string {
  return String(title || '').split(':')[0].trim();
}

export function getEntityName(post: Pick<Post, 'title'>): string {
  return titlePrefix(post.title).replace(/^concurso\s+/i, '').trim();
}

function postYear(post: Pick<Post, 'publishedAt'>): number {
  const date = post.publishedAt ? new Date(post.publishedAt) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

function ufPart(post: Pick<Post, 'stateUf'>, entity: string): string {
  const uf = String(post.stateUf || '').trim().toUpperCase();
  if (!uf || uf === 'NACIONAL') return '';
  if (stripAccents(entity).toLowerCase().split(/[^a-z0-9]+/).includes(uf.toLowerCase())) return '';
  return ` (${uf})`;
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function spDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
  });
}

function enrollmentPhrase(post: Post): string {
  const now = Date.now();
  const start = post.enrollmentStartDate ? new Date(post.enrollmentStartDate).getTime() : null;
  const end = post.enrollmentEndDate ? new Date(post.enrollmentEndDate).getTime() : null;
  const startStr = spDate(post.enrollmentStartDate);
  const endStr = spDate(post.enrollmentEndDate);

  if (start && start > now && startStr) return `Inscrições a partir de ${startStr}`;
  if (end && endStr) return `Inscrições até ${endStr}`;
  if (post.status === 'previsto') return 'Edital previsto';
  if (post.status === 'encerrado') return 'Inscrições encerradas';
  return 'Inscrições abertas';
}

function bancaLabel(banca?: string): string {
  const raw = String(banca || '').trim();
  if (!raw || /a definir/i.test(raw)) return '';
  const acronym =
    raw.match(/\(([A-Z0-9/.-]{2,12})\)/) || raw.match(/[–-]\s*([A-Z0-9/.-]{2,12})\s*$/);
  if (acronym) return acronym[1];
  return raw.replace(/^Instituto\s+(?=[A-Za-zÀ-ÿ])/i, '').trim();
}

/**
 * Título curto para a tag <title>. O H1 continua usando o título editorial completo.
 * Usa o campo SEO do CMS quando preenchido; caso contrário, deriva dos dados do concurso.
 */
export function getPostSeoTitle(post: Post): string {
  if (post.seo?.metaTitle?.trim()) return post.seo.metaTitle.trim();

  const entity = getEntityName(post);
  const year = postYear(post);
  const vagas = post.vacanciesTotal ? `${post.vacanciesTotal} vagas` : 'edital publicado';
  const shortEntity = entity.replace(
    /^(Prefeitura|Câmara|Camara)\s+(Municipal\s+)?(de|do|da)\s+/i,
    ''
  );

  const variants = [
    `Concurso ${entity} ${year}: ${vagas}`,
    `Concurso ${shortEntity} ${year}: ${vagas}`,
    `Concurso ${shortEntity}: ${vagas}`,
  ];
  return variants.find((v) => v.length <= 62) || variants[variants.length - 1].slice(0, 62).trim();
}

/**
 * Meta description com números. Usa o campo SEO do CMS; se vazio, monta a partir
 * de vagas, salário, prazo e banca.
 */
export function getPostMetaDescription(post: Post): string {
  if (post.seo?.metaDescription?.trim()) return post.seo.metaDescription.trim();
  if (post.excerpt?.trim()) return post.excerpt.trim();

  const entity = getEntityName(post);
  const uf = ufPart(post, entity);
  const vagas = post.vacanciesTotal ? `${post.vacanciesTotal} vagas` : 'vagas';
  const salary = post.salaryMax ? ` com salário até R$ ${brl(post.salaryMax)}` : '';
  const prazo = enrollmentPhrase(post);
  const banca = bancaLabel(post.banca);
  const bancaPart = banca ? ` Banca ${banca}.` : '';

  const full = `${entity}${uf} abre ${vagas}${salary}. ${prazo}.${bancaPart}`;
  if (full.length <= 155) return full;

  const noBanca = `${entity}${uf} abre ${vagas}${salary}. ${prazo}.`;
  if (noBanca.length <= 155) return noBanca;

  const shortEntity = entity.replace(
    /^(Prefeitura|Câmara|Camara)\s+(Municipal\s+)?(de|do|da)\s+/i,
    ''
  );
  return `${shortEntity}${uf} abre ${vagas}${salary}. ${prazo}.`.slice(0, 155).trim();
}

export interface OgImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Imagem de compartilhamento 1200x630.
 * Usa a imagem editorial apenas quando ela tem largura suficiente e não é GIF.
 * Caso contrário, gera um card de marca em /api/og (evita upscale borrado no Discover).
 */
export function getPostOgImage(post: Post): OgImage {
  const dims = post.mainImage?.asset?.metadata?.dimensions;
  const mime = post.mainImage?.asset?.mimeType;
  const alt = post.mainImage?.alt?.trim() || getDescriptiveImageAlt(post);

  if (post.mainImage && dims && dims.width >= 1200 && mime !== 'image/gif') {
    try {
      const url = urlFor(post.mainImage)
        .width(1200)
        .height(630)
        .fit('crop')
        .auto('format')
        .quality(85)
        .url();
      return { url, width: 1200, height: 630, alt };
    } catch {
      // cai no card gerado
    }
  }

  const title = getPostSeoTitle(post);
  const eyebrow =
    [post.cityName, post.stateUf].filter(Boolean).join(' • ') || 'Concurso público';
  const url = `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&eyebrow=${encodeURIComponent(eyebrow)}`;

  return { url, width: 1200, height: 630, alt };
}

export function getPostCanonical(post: Post): string {
  return `${SITE_URL}/post/${getPostSlug(post)}`;
}
