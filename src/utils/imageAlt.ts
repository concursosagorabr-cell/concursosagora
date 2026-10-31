import type { Post } from '../types';

/**
 * Gera um texto alternativo (alt) descritivo para acessibilidade (WCAG) e SEO de imagens.
 * Regra editorial: 80 a 125 caracteres, sem repetir o título completo nem empilhar palavras-chave.
 */
export function getDescriptiveImageAlt(post: Partial<Post>): string {
  const title = post.title || '';
  const entity = String(title).split(':')[0].replace(/^concurso\s+/i, '').trim();
  const uf =
    post.stateUf && post.stateUf !== 'Nacional' ? ` (${post.stateUf.toUpperCase()})` : '';
  const year = post.publishedAt
    ? new Date(post.publishedAt).getFullYear()
    : new Date().getFullYear();
  const context = `concurso público ${year}`;

  const explicit = post.mainImage?.alt?.trim();
  if (explicit && explicit !== title) {
    return clampAlt(explicit, context);
  }

  const caption = post.mainImage?.caption?.trim();
  if (caption && caption !== title) {
    return clampAlt(caption, context);
  }

  const base = entity
    ? `${entity}${uf}: imagem ilustrativa do ${context} com vagas, salários e edital publicado`
    : `Imagem ilustrativa do ${context} com vagas, salários e edital publicado`;

  return clampAlt(base, context);
}

function clampAlt(value: string, context: string): string {
  let alt = value.replace(/\s+/g, ' ').trim();
  if (alt.length < 80) {
    alt = `${alt} — ${context}`;
  }
  if (alt.length > 125) {
    alt = alt.slice(0, 125).replace(/\s+\S*$/, '');
  }
  return alt;
}
