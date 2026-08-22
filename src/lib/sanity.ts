import { createClient, type QueryParams } from '@sanity/client';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import {
  allCategoriesQuery,
  categoryBySlugQuery,
  recentPostsQuery,
  postsPaginatedQuery,
  postsCountQuery,
  postBySlugQuery,
  relatedPostsQuery,
  relatedPostsFallbackQuery,
  postsByCategoryPaginatedQuery,
  postsByCategoryCountQuery,
  statePostsQuery,
  postsByKeywordsPaginatedQuery,
  postsByKeywordsCountQuery,
  searchPostsQuery,
  allPostSlugsQuery,
  allCategorySlugsQuery,
} from './queries';
import { Category, Post } from '@/types';

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'wobukj4j';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-07-25';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

/**
 * Wrapper genérico com Next.js Data Cache (unstable_cache) + React.cache()
 * Garante:
 * 1. Memoization no mesmo request (generateMetadata + Page)
 * 2. Cache persistente multi-usuário e multi-instância no servidor/Edge
 * 3. Invalidação seletiva via tags (revalidateTag)
 */
export const sanityFetch = cache(
  async <T = any>(
    query: string,
    params: QueryParams = {},
    options?: { revalidate?: number; tags?: string[] }
  ): Promise<T> => {
    const revalidate = options?.revalidate ?? 300;
    const tags = options?.tags ?? ['sanity'];
    const cacheKey = ['sanity', query, JSON.stringify(params)];

    return unstable_cache(
      async () => {
        return client.fetch<T>(query, params, {
          next: { revalidate, tags },
        });
      },
      cacheKey,
      { revalidate, tags }
    )();
  }
);

// ─── Métodos de Consulta Centralizados e Tipados ─────────────────────────────

/**
 * 1. Todas as categorias (TTL: 1 hora / 3600s, Tag: 'categories')
 */
export const getCachedCategories = cache((): Promise<Category[]> => {
  return unstable_cache(
    async () => (await client.fetch<Category[]>(allCategoriesQuery, {}, { next: { tags: ['categories'] } })) || [],
    ['sanity', 'all-categories'],
    { revalidate: 3600, tags: ['categories'] }
  )();
});

/**
 * 2. Categoria individual por slug (TTL: 1 hora / 3600s, Tags: 'categories', 'category:[slug]')
 */
export const getCachedCategoryBySlug = cache((slug: string): Promise<Category | null> => {
  return unstable_cache(
    async () => client.fetch<Category | null>(categoryBySlugQuery, { slug }, { next: { tags: ['categories', `category:${slug}`] } }),
    ['sanity', 'category', slug],
    { revalidate: 3600, tags: ['categories', `category:${slug}`] }
  )();
});

/**
 * 3. Posts recentes para Home, Sidebar e Carrossel (TTL: 3 minutos / 180s, Tag: 'posts')
 */
export const getCachedRecentPosts = cache((): Promise<Post[]> => {
  return unstable_cache(
    async () => (await client.fetch<Post[]>(recentPostsQuery, {}, { next: { tags: ['posts', 'recent-posts'] } })) || [],
    ['sanity', 'recent-posts'],
    { revalidate: 180, tags: ['posts', 'recent-posts'] }
  )();
});

/**
 * 4. Posts paginados da Home (TTL: 3 minutos / 180s, Tag: 'posts')
 */
export const getCachedPostsPaginated = cache((start: number, end: number): Promise<Post[]> => {
  return unstable_cache(
    async () => (await client.fetch<Post[]>(postsPaginatedQuery, { start, end }, { next: { tags: ['posts'] } })) || [],
    ['sanity', 'posts-paginated', String(start), String(end)],
    { revalidate: 180, tags: ['posts'] }
  )();
});

/**
 * 5. Contagem total de posts (TTL: 5 minutos / 300s, Tag: 'posts')
 */
export const getCachedPostsCount = cache((): Promise<number> => {
  return unstable_cache(
    async () => (await client.fetch<number>(postsCountQuery, {}, { next: { tags: ['posts'] } })) || 0,
    ['sanity', 'posts-count'],
    { revalidate: 300, tags: ['posts'] }
  )();
});

/**
 * 6. Post individual completo por Slug (TTL: 30 minutos / 1800s, Tags: 'posts', 'post:[slug]')
 */
export const getCachedPostBySlug = cache((slug: string): Promise<Post | null> => {
  return unstable_cache(
    async () => client.fetch<Post | null>(postBySlugQuery, { slug }, { next: { tags: ['posts', `post:${slug}`] } }),
    ['sanity', 'post', slug],
    { revalidate: 1800, tags: ['posts', `post:${slug}`] }
  )();
});

/**
 * 7. Posts relacionados por categoria (TTL: 10 minutos / 600s, Tag: 'posts')
 */
export const getCachedRelatedPosts = cache((currentId: string, categoryIds: string[]): Promise<Post[]> => {
  const sortedCatIds = [...categoryIds].sort().join(',');
  return unstable_cache(
    async () => (await client.fetch<Post[]>(relatedPostsQuery, { currentId, categoryIds }, { next: { tags: ['posts'] } })) || [],
    ['sanity', 'related-posts', currentId, sortedCatIds],
    { revalidate: 600, tags: ['posts'] }
  )();
});

/**
 * 7b. Fallback de posts relacionados (TTL: 10 minutos / 600s, Tag: 'posts')
 */
export const getCachedRelatedPostsFallback = cache((currentId: string, excludeIds: string[]): Promise<Post[]> => {
  const sortedExcludeIds = [...excludeIds].sort().join(',');
  return unstable_cache(
    async () => (await client.fetch<Post[]>(relatedPostsFallbackQuery, { currentId, excludeIds }, { next: { tags: ['posts'] } })) || [],
    ['sanity', 'related-fallback', currentId, sortedExcludeIds],
    { revalidate: 600, tags: ['posts'] }
  )();
});

/**
 * 8. Posts por categoria paginados (TTL: 5 minutos / 300s, Tags: 'posts', 'category:[categorySlug]')
 */
export const getCachedPostsByCategory = cache(
  (categorySlug: string, categorySlugs: string[], start: number, end: number): Promise<Post[]> => {
    const slugKey = categorySlugs.join(',');
    return unstable_cache(
      async () =>
        (await client.fetch<Post[]>(
          postsByCategoryPaginatedQuery,
          { categorySlug, categorySlugs, start, end },
          { next: { tags: ['posts', `category:${categorySlug}`] } }
        )) || [],
      ['sanity', 'posts-by-category', categorySlug, slugKey, String(start), String(end)],
      { revalidate: 300, tags: ['posts', `category:${categorySlug}`] }
    )();
  }
);

/**
 * 8b. Contagem de posts por categoria (TTL: 10 minutos / 600s, Tags: 'posts', 'category:[categorySlug]')
 */
export const getCachedPostsByCategoryCount = cache(
  (categorySlug: string, categorySlugs: string[]): Promise<number> => {
    const slugKey = categorySlugs.join(',');
    return unstable_cache(
      async () =>
        (await client.fetch<number>(
          postsByCategoryCountQuery,
          { categorySlug, categorySlugs },
          { next: { tags: ['posts', `category:${categorySlug}`] } }
        )) || 0,
      ['sanity', 'posts-by-category-count', categorySlug, slugKey],
      { revalidate: 600, tags: ['posts', `category:${categorySlug}`] }
    )();
  }
);

/**
 * 9. Posts por Estado / UF (TTL: 10 minutos / 600s, Tags: 'posts', 'state:[ufLower]')
 */
export const getCachedStatePosts = cache(
  (ufLower: string, ufUpper: string, stateName: string): Promise<Post[]> => {
    return unstable_cache(
      async () =>
        (await client.fetch<Post[]>(
          statePostsQuery,
          { ufLower, ufUpper, stateName },
          { next: { tags: ['posts', `state:${ufLower}`] } }
        )) || [],
      ['sanity', 'state-posts', ufLower],
      { revalidate: 600, tags: ['posts', `state:${ufLower}`] }
    )();
  }
);

/**
 * 10. Posts por Hub de Conteúdo / Silos (TTL: 10 minutos / 600s, Tags: 'posts', 'hub:[mainKeyword]')
 */
export const getCachedHubPosts = cache(
  (keywords: string[], mainKeyword: string, start: number, end: number): Promise<Post[]> => {
    const kwKey = keywords.join(',');
    return unstable_cache(
      async () =>
        (await client.fetch<Post[]>(
          postsByKeywordsPaginatedQuery,
          { keywords, mainKeyword, start, end },
          { next: { tags: ['posts', `hub:${mainKeyword}`] } }
        )) || [],
      ['sanity', 'hub-posts', mainKeyword, kwKey, String(start), String(end)],
      { revalidate: 600, tags: ['posts', `hub:${mainKeyword}`] }
    )();
  }
);

/**
 * 10b. Contagem de posts por Hub de Conteúdo (TTL: 10 minutos / 600s, Tags: 'posts', 'hub:[mainKeyword]')
 */
export const getCachedHubPostsCount = cache(
  (keywords: string[], mainKeyword: string): Promise<number> => {
    const kwKey = keywords.join(',');
    return unstable_cache(
      async () =>
        (await client.fetch<number>(
          postsByKeywordsCountQuery,
          { keywords, mainKeyword },
          { next: { tags: ['posts', `hub:${mainKeyword}`] } }
        )) || 0,
      ['sanity', 'hub-posts-count', mainKeyword, kwKey],
      { revalidate: 600, tags: ['posts', `hub:${mainKeyword}`] }
    )();
  }
);

/**
 * 11. Busca por termo (TTL: 3 minutos / 180s, Tag: 'posts')
 */
export const getCachedSearchPosts = cache((searchTerm: string): Promise<Post[]> => {
  const cleanTerm = searchTerm.trim().toLowerCase();
  return unstable_cache(
    async () =>
      (await client.fetch<Post[]>(
        searchPostsQuery,
        { searchTerm: cleanTerm },
        { next: { tags: ['posts'] } }
      )) || [],
    ['sanity', 'search', cleanTerm],
    { revalidate: 180, tags: ['posts'] }
  )();
});

/**
 * 12. Slugs de todos os posts para Sitemap e generateStaticParams (TTL: 30 minutos / 1800s, Tags: 'posts', 'sitemap')
 */
export const getCachedAllPostSlugs = cache((): Promise<string[]> => {
  return unstable_cache(
    async () => (await client.fetch<string[]>(allPostSlugsQuery, {}, { next: { tags: ['posts', 'sitemap'] } })) || [],
    ['sanity', 'all-post-slugs'],
    { revalidate: 1800, tags: ['posts', 'sitemap'] }
  )();
});

/**
 * 13. Slugs de todas as categorias para Sitemap (TTL: 1 hora / 3600s, Tags: 'categories', 'sitemap')
 */
export const getCachedAllCategorySlugs = cache((): Promise<string[]> => {
  return unstable_cache(
    async () => (await client.fetch<string[]>(allCategorySlugsQuery, {}, { next: { tags: ['categories', 'sitemap'] } })) || [],
    ['sanity', 'all-category-slugs'],
    { revalidate: 3600, tags: ['categories', 'sitemap'] }
  )();
});

/**
 * 14. Posts para o Google News Sitemap (últimas 48h) (TTL: 5 minutos / 300s, Tags: 'posts', 'sitemap-news')
 */
export const getCachedNewsSitemapPosts = cache((twoDaysAgo: string): Promise<any[]> => {
  const query = `*[_type == "post" && (publishedAt >= $twoDaysAgo || _createdAt >= $twoDaysAgo)] | order(publishedAt desc)[0..1000] {
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    publishedAt,
    _createdAt
  }`;
  return unstable_cache(
    async () => {
      let posts = await client.fetch<any[]>(query, { twoDaysAgo }, { next: { tags: ['posts', 'sitemap-news'] } });
      if (!posts || posts.length === 0) {
        posts = await client.fetch<any[]>(
          `*[_type == "post"] | order(publishedAt desc)[0..10] {
            _id,
            title,
            "slug": coalesce(slug.current, _id),
            publishedAt,
            _createdAt
          }`,
          {},
          { next: { tags: ['posts', 'sitemap-news'] } }
        );
      }
      return posts || [];
    },
    ['sanity', 'sitemap-news-posts'],
    { revalidate: 300, tags: ['posts', 'sitemap-news'] }
  )();
});

/**
 * 15. Posts para o RSS Feed (TTL: 5 minutos / 300s, Tags: 'posts', 'feed')
 */
export const getCachedRssFeedPosts = cache((): Promise<any[]> => {
  const query = `*[_type == "post"] | order(publishedAt desc)[0..30] {
    _id,
    title,
    "slug": coalesce(slug.current, _id),
    publishedAt,
    _createdAt,
    mainImage,
    "excerpt": coalesce(excerpt, ""),
    "authorName": coalesce(author->name, "Redação Concursos Agora")
  }`;
  return unstable_cache(
    async () => (await client.fetch<any[]>(query, {}, { next: { tags: ['posts', 'feed'] } })) || [],
    ['sanity', 'rss-feed-posts'],
    { revalidate: 300, tags: ['posts', 'feed'] }
  )();
});

