import { createImageUrlBuilder } from '@sanity/image-url';
import { projectId, dataset } from './sanity';
import type { SanityImage } from '@/types';

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: any) {
  return builder.image(source);
}

export function getImageUrl(
  source: SanityImage | string | null | undefined,
  width: number = 800,
  height?: number,
  quality: number = 85
): string {
  if (!source) {
    return '/placeholder.jpg';
  }

  // Se o source for uma URL direta string (ex: https://...)
  if (typeof source === 'string') {
    return source.startsWith('http') ? source : '/placeholder.jpg';
  }

  // Se não houver referência válida do Sanity (_ref ou _id)
  const assetRef = source.asset?._ref || source.asset?._id;
  if (!assetRef || typeof assetRef !== 'string') {
    // Se o asset tiver uma URL direta, aplicar redimensionamento via CDN quando possível
    if (source.asset && typeof (source.asset as Record<string, unknown>).url === 'string') {
      const rawUrl = (source.asset as Record<string, unknown>).url as string;
      // URLs do CDN da Sanity suportam query params de transformação
      if (rawUrl.includes('cdn.sanity.io')) {
        const separator = rawUrl.includes('?') ? '&' : '?';
        const heightParam = height ? `&h=${height}` : '';
        return `${rawUrl}${separator}w=${width}${heightParam}&q=${quality}&auto=format`;
      }
      return rawUrl;
    }
    return '/placeholder.jpg';
  }

  try {
    let imgBuilder = urlFor(source)
      .width(width)
      .quality(quality)
      .auto('format');

    if (height) {
      imgBuilder = imgBuilder.height(height);
    }

    return imgBuilder.url();
  } catch (err) {
    console.warn('Erro ao gerar URL da imagem Sanity:', err);
    return '/placeholder.jpg';
  }
}
