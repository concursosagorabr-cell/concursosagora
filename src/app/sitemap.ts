import { MetadataRoute } from 'next';
import { getCachedAllPostSlugs, getCachedAllCategorySlugs } from '@/lib/sanity';
import { CONTENT_HUBS } from '@/utils/hubs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://concursosagora.com.br';

  let postSlugs: string[] = [];
  let categorySlugs: string[] = [];

  try {
    [postSlugs, categorySlugs] = await Promise.all([
      getCachedAllPostSlugs(),
      getCachedAllCategorySlugs(),
    ]);
  } catch (error) {
    console.error('Erro ao buscar slugs para sitemap:', error);
  }

  const cleanPostSlugs = (postSlugs || [])
    .map((item: any) => (typeof item === 'string' ? item : item?.slug || item?._id))
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

  const cleanCategorySlugs = (categorySlugs || [])
    .map((item: any) => (typeof item === 'string' ? item : item?.slug || item?._id))
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

  const postUrls: MetadataRoute.Sitemap = cleanPostSlugs.map((slug) => ({
    url: `${baseUrl}/post/${encodeURIComponent(slug)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = cleanCategorySlugs.map((slug) => ({
    url: `${baseUrl}/categoria/${encodeURIComponent(slug)}`,
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

  const stateUfs = [
    'ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma',
    'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn',
    'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to',
  ];

  const stateUrls: MetadataRoute.Sitemap = stateUfs.map((uf) => ({
    url: `${baseUrl}/concursos-abertos/${uf}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/noticias`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.95,
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
    {
      url: `${baseUrl}/sobre-nos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/politica-de-privacidade`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/aviso-legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    ...hubUrls,
    ...stateUrls,
    ...postUrls,
    ...categoryUrls,
  ];
}
