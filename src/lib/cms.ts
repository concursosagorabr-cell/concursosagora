import { sanityFetch } from './sanity'
import { tursoFetch } from './db/turso'
import { postBySlugQuery, postsByCategoryQuery, recentPostsQuery } from './queries'
import type { Post } from '@/types'

/**
 * Fonte de dados do site, escolhida EXPLICITAMENTE por variável de ambiente.
 *
 * - `CMS_SOURCE=sanity` (padrão): lê do Sanity.
 * - `CMS_SOURCE=turso`: lê do banco Turso/libSQL.
 *
 * Não existe fallback automático entre os bancos: cada deploy sabe de onde lê.
 * Os artigos novos são gravados no banco escolhido no painel do gerente.
 */
export const cmsSource: 'sanity' | 'turso' = process.env.CMS_SOURCE === 'turso' ? 'turso' : 'sanity'

/** Formato de post devolvido pela camada de CMS (idêntico ao do Sanity). */
export type CMSPost = Post

function fromCacheOptions(tags: string[], revalidate: number) {
  return { revalidate, tags }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (cmsSource === 'turso') {
    return tursoFetch<Post | null>(postBySlugQuery, { slug })
  }
  return sanityFetch<Post | null>(postBySlugQuery, { slug }, fromCacheOptions(['posts', `post:${slug}`], 1800))
}

export async function getRecentPosts(limit = 5): Promise<Post[]> {
  if (cmsSource === 'turso') {
    const posts = await tursoFetch<Post[]>(recentPostsQuery)
    return posts.slice(0, limit)
  }
  const posts = await sanityFetch<Post[]>(recentPostsQuery, {}, fromCacheOptions(['posts', 'recent-posts'], 180))
  return (posts || []).slice(0, limit)
}

export async function getPostsByCategory(categorySlug: string, limit = 20): Promise<Post[]> {
  if (cmsSource === 'turso') {
    const posts = await tursoFetch<Post[]>(postsByCategoryQuery, { categorySlug })
    return posts.slice(0, limit)
  }
  const posts = await sanityFetch<Post[]>(
    postsByCategoryQuery,
    { categorySlug },
    fromCacheOptions(['posts', `category:${categorySlug}`], 300)
  )
  return (posts || []).slice(0, limit)
}
