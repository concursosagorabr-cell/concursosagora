import imageUrlBuilder, { createImageUrlBuilder } from '@sanity/image-url';
import { client } from './sanity';

const builder = (createImageUrlBuilder || imageUrlBuilder)(client as any);

export function urlFor(source: any) {
  return builder.image(source);
}

export function getImageUrl(
  source: any,
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

  // Se o asset tiver uma URL direta (ex: { asset: { url: "https://..." } })
  if (source.asset && typeof source.asset.url === 'string') {
    return source.asset.url;
  }

  // Se não houver referência válida do Sanity (_ref ou _id)
  const assetRef = source.asset?._ref || source.asset?._id;
  if (!assetRef || typeof assetRef !== 'string') {
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
