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
  if (!source || !source.asset) {
    return '/placeholder.jpg';
  }

  let imgBuilder = urlFor(source)
    .width(width)
    .quality(quality)
    .auto('format');

  if (height) {
    imgBuilder = imgBuilder.height(height);
  }

  return imgBuilder.url();
}
