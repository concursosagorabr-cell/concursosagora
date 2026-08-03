import { MetadataRoute } from 'next';
import { client } from '@/lib/sanity';
import { allPostSlugsQuery, allCategorySlugsQuery } from '@/lib/queries';
import { CONTENT_HUBS } from '@/utils/hubs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://concursosagora.com.br';

  let postSlugs: string[] = [];
  let categorySlugs: string[] = [];

  try {
    [postSlugs, categorySlugs] = await Promise.all([
      client.fetch(allPostSlugsQuery),
      client.fetch(allCategorySlugsQuery),
    ]);
  } catch (error) {
    console.error('Erro ao buscar slugs para sitemap:', error);
  }

  const postUrls: MetadataRoute.Sitemap = postSlugs.map((slug) => ({
    url: `${baseUrl}/post/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${baseUrl}/categoria/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const hubUrls: MetadataRoute.Sitemap = CONTENT_HUBS.map((hub) => ({
    url: `${baseUrl}/hub/${hub.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/hub`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...hubUrls,
    ...postUrls,
    ...categoryUrls,
  ];
}
