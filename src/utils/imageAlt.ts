import type { Post } from '../types';

/**
 * Gera um texto alternativo (alt) descritivo, rico e contextual para acessibilidade (WCAG) e SEO de imagens,
 * superando a prática deficiente de apenas replicar o título do artigo no alt.
 */
export function getDescriptiveImageAlt(post: Partial<Post>): string {
  // 1. Se a imagem no Sanity possui alt descritivo específico
  if (post.mainImage?.alt && post.mainImage.alt.trim() && post.mainImage.alt !== post.title) {
    return post.mainImage.alt;
  }

  // 2. Se possui legenda editorial (caption) jornalística
  if (post.mainImage?.caption && post.mainImage.caption.trim()) {
    return post.mainImage.caption;
  }

  // 3. Monta descrição estruturada com dados geográficos e institucionais do edital
  const title = post.title || 'Concurso Público';
  const statePart = post.stateUf && post.stateUf !== 'Nacional' ? ` no estado de ${post.stateUf}` : '';
  const cityPart = post.cityName ? ` no município de ${post.cityName}` : '';
  const bancaPart = post.banca ? ` com organização da banca ${post.banca}` : '';

  return `Foto ilustrativa para a notícia sobre o edital do ${title}${cityPart}${statePart}${bancaPart}`;
}
