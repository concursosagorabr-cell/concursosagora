import { turso, tursoConfigured } from './index'
import type { Author, Category, Post } from '@/types'
import {
  allCategoriesQuery,
  allAuthorSlugsQuery,
  allCategorySlugsQuery,
  allPostSlugsQuery,
  allPostsQuery,
  authorBySlugQuery,
  bancaPostsQuery,
  categoryBySlugQuery,
  directoryPostsQuery,
  educationAndStatePostsQuery,
  highSalaryPostsQuery,
  postBySlugHistoryQuery,
  postBySlugQuery,
  postsByAuthorCountQuery,
  postsByAuthorPaginatedQuery,
  postsByCategoryCountQuery,
  postsByCategoryPaginatedQuery,
  postsByCategoryQuery,
  postsByKeywordsCountQuery,
  postsByKeywordsPaginatedQuery,
  postsBySlugsQuery,
  postsCountQuery,
  postsPaginatedQuery,
  recentPostsQuery,
  relatedPostsByBancaQuery,
  relatedPostsByStateQuery,
  relatedPostsFallbackQuery,
  relatedPostsQuery,
  searchPostsQuery,
  statePostsQuery,
} from '../queries'

/**
 * Leitor do Turso com a mesma superfície do cliente do Sanity.
 *
 * `tursoFetch(query, params)` recebe a MESMA string GROQ usada pelo site e
 * devolve as mesmas projeções. Cada post é gravado com o documento completo no
 * formato que o frontend consome (`data`), então a renderização é idêntica,
 * independentemente do banco de origem.
 */

const ACTIVE_STATUS = new Set(['aberto', 'previsto', 'em_andamento'])

type Params = Record<string, unknown>

interface CacheEntry {
  at: number
  posts: Post[]
}

let cachePosts: CacheEntry | null = null
const TTL_MS = 30_000

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function postSlug(post: Post): string {
  return typeof post.slug === 'string' ? post.slug : String((post.slug as unknown as { current?: string })?.current ?? post._id)
}

function publishedTime(post: Post): number {
  const raw = post.publishedAt || post._createdAt
  const time = raw ? new Date(raw).getTime() : 0
  return Number.isFinite(time) ? time : 0
}

function sortByPublished(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => publishedTime(b) - publishedTime(a))
}

function isActive(post: Post): boolean {
  return ACTIVE_STATUS.has(String(post.status || ''))
}

function categorySlugs(post: Post): string[] {
  return asArray<Category>(post.categories).map((category) => normalize(category.slug))
}

function categoryTitles(post: Post): string[] {
  return asArray<Category>(post.categories).map((category) => normalize(category.title))
}

function categoryIds(post: Post): string[] {
  return asArray<Category>(post.categories).map((category) => String(category._id || ''))
}

function matchesCategory(post: Post, wanted: unknown, extra: unknown = []): boolean {
  const targets = [wanted, ...asArray<unknown>(extra)].map(normalize).filter(Boolean)
  if (!targets.length) return false
  const slugs = categorySlugs(post)
  const titles = categoryTitles(post)
  const ids = categoryIds(post).map(normalize)
  return targets.some((target) => slugs.includes(target) || titles.includes(target) || ids.includes(target))
}

function textOf(post: Post): string {
  return normalize(`${post.title || ''} ${post.excerpt || ''}`)
}

async function loadPosts(): Promise<Post[]> {
  if (!tursoConfigured || !turso) return []
  if (cachePosts && Date.now() - cachePosts.at < TTL_MS) return cachePosts.posts
  const result = await turso.execute(
    `SELECT data FROM posts WHERE review_status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT 2000`
  )
  const posts: Post[] = []
  for (const row of result.rows) {
    try {
      const raw = row.data
      if (typeof raw !== 'string') continue
      const parsed = JSON.parse(raw) as Post
      if (parsed && parsed.title) posts.push(parsed)
    } catch {
      // Documento corrompido não derruba a listagem inteira.
    }
  }
  cachePosts = { at: Date.now(), posts }
  return posts
}

async function loadCategories(): Promise<Category[]> {
  if (!tursoConfigured || !turso) return []
  const result = await turso.execute(
    `SELECT id, slug, title, description, group_name FROM categories ORDER BY title ASC`
  )
  return result.rows.map(
    (row): Category => ({
      _id: String(row.id),
      title: String(row.title),
      slug: String(row.slug),
      description: row.description ? String(row.description) : undefined,
      group: (row.group_name ? String(row.group_name) : undefined) as Category['group'],
    })
  )
}

async function loadAuthors(): Promise<Author[]> {
  if (!tursoConfigured || !turso) return []
  const result = await turso.execute(`SELECT id, slug, name, image, bio FROM authors ORDER BY name ASC`)
  return result.rows.map(
    (row): Author => ({
      _id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      bio: row.bio ? String(row.bio) : undefined,
      image: row.image ? (safeJson(row.image) as Author['image']) : undefined,
    })
  )
}

function safeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function slice<T>(items: T[], start: unknown, end: unknown): T[] {
  const from = Math.max(0, Number(start) || 0)
  const to = Number.isFinite(Number(end)) ? Number(end) : items.length - 1
  return items.slice(from, to + 1)
}

function stateMatches(post: Post, params: Params): boolean {
  const ufUpper = normalize(params.ufUpper)
  const ufLower = normalize(params.ufLower)
  const stateName = normalize(params.stateName)
  const postState = normalize(post.stateUf)
  const location = (post as Post & { location?: string }).location || ''
  const haystack = normalize(`${post.title} ${post.excerpt} ${location}`)
  if (ufUpper && postState === ufUpper) return true
  if (stateName && postState === stateName) return true
  const slugs = categorySlugs(post)
  const titles = categoryTitles(post)
  if (ufLower && slugs.includes(ufLower)) return true
  if (ufUpper && titles.includes(ufUpper)) return true
  if (stateName && titles.includes(stateName)) return true
  if (ufUpper && haystack.includes(ufUpper)) return true
  if (stateName && haystack.includes(stateName)) return true
  return false
}

function hubMatches(post: Post, params: Params): boolean {
  const hubSlug = normalize(params.hubSlug)
  const mainKeyword = normalize(params.mainKeyword)
  const keywords = asArray<unknown>(params.keywords).map(normalize).filter(Boolean)
  const hubs = asArray<unknown>(post.hubAreas).map(normalize)
  if (hubSlug && hubs.includes(hubSlug)) return true
  if (hubs.length) return false
  if (keywords.length && matchesCategory(post, keywords[0], keywords.slice(1))) return true
  if (mainKeyword) {
    if (categorySlugs(post).includes(mainKeyword)) return true
    if (categoryTitles(post).includes(mainKeyword)) return true
    if (textOf(post).includes(mainKeyword)) return true
  }
  return false
}

/** Executa a consulta equivalente no Turso. */
export async function tursoFetch<T = unknown>(query: string, params: Params = {}): Promise<T> {
  if (typeof window !== 'undefined' || !tursoConfigured || !turso) {
    throw new Error('tursoFetch só pode ser executado no servidor com TURSO_DATABASE_URL configurado')
  }
  const q = query.trim()

  if (q === allPostsQuery.trim()) {
    return sortByPublished((await loadPosts()).filter(isActive)) as T
  }
  if (q === postsPaginatedQuery.trim()) {
    const active = sortByPublished((await loadPosts()).filter(isActive))
    return slice(active, params.start, params.end) as T
  }
  if (q === postsCountQuery.trim()) {
    return (await loadPosts()).filter(isActive).length as T
  }
  if (q === postBySlugQuery.trim()) {
    const slug = normalize(params.slug)
    const found = (await loadPosts()).find(
      (post) => normalize(postSlug(post)) === slug || normalize(post._id) === slug
    )
    return (found || null) as T
  }
  if (q === relatedPostsQuery.trim()) {
    const currentId = String(params.currentId || '')
    const categoryIdsWanted = asArray<unknown>(params.categoryIds).map(normalize)
    const related = sortByPublished(
      (await loadPosts()).filter(
        (post) =>
          post._id !== currentId &&
          isActive(post) &&
          categoryIds(post).some((id) => categoryIdsWanted.includes(normalize(id)))
      )
    )
    return related.slice(0, 3) as T
  }
  if (q === relatedPostsFallbackQuery.trim()) {
    const currentId = String(params.currentId || '')
    const excluded = asArray<unknown>(params.excludeIds).map(String)
    const fallback = sortByPublished(
      (await loadPosts()).filter(
        (post) => post._id !== currentId && !excluded.includes(post._id) && isActive(post)
      )
    )
    return fallback.slice(0, 3) as T
  }
  if (q === recentPostsQuery.trim()) {
    return sortByPublished((await loadPosts()).filter(isActive)).slice(0, 5) as T
  }
  if (q === postsBySlugsQuery.trim()) {
    const wanted = asArray<unknown>(params.slugs).map(normalize)
    const posts = (await loadPosts()).filter(
      (post) => wanted.includes(normalize(postSlug(post))) || wanted.includes(normalize(post._id))
    )
    return posts as T
  }
  if (q === allCategoriesQuery.trim()) {
    return (await loadCategories()) as T
  }
  if (q === categoryBySlugQuery.trim()) {
    const slug = normalize(params.slug)
    const found = (await loadCategories()).find(
      (category) => normalize(category.slug) === slug || normalize(category._id) === slug
    )
    return (found || null) as T
  }
  if (q === postsByCategoryQuery.trim()) {
    const posts = sortByPublished(
      (await loadPosts()).filter((post) => matchesCategory(post, params.categorySlug))
    )
    return posts as T
  }
  if (q === postsByCategoryPaginatedQuery.trim() || q === postsByCategoryCountQuery.trim()) {
    const uf = params.uf ? normalize(params.uf) : ''
    const region = params.region ? normalize(params.region) : ''
    const regionUfs = asArray<unknown>(params.regionUfs).map(normalize)
    const filtered = sortByPublished(
      (await loadPosts()).filter((post) => {
        if (!isActive(post)) return false
        const postState = normalize(post.stateUf)
        const postRegion = normalize(post.region)
        const byScope =
          (uf && postState === uf) ||
          (region && (postRegion === region || regionUfs.includes(postState)))
        return Boolean(byScope) || matchesCategory(post, params.categorySlug, params.categorySlugs)
      })
    )
    if (q === postsByCategoryCountQuery.trim()) return filtered.length as T
    return slice(filtered, params.start, params.end) as T
  }
  if (q === statePostsQuery.trim()) {
    const posts = sortByPublished(
      (await loadPosts()).filter((post) => isActive(post) && stateMatches(post, params))
    )
    return posts.slice(0, 31) as T
  }
  if (q === searchPostsQuery.trim()) {
    const term = normalize(params.searchTerm)
    const posts = sortByPublished(
      (await loadPosts()).filter((post) => {
        if (!isActive(post)) return false
        if (!term) return false
        return (
          textOf(post).includes(term) ||
          categorySlugs(post).some((slug) => slug.includes(term)) ||
          categoryTitles(post).some((title) => title.includes(term))
        )
      })
    )
    return posts as T
  }
  if (q === postsByKeywordsPaginatedQuery.trim() || q === postsByKeywordsCountQuery.trim()) {
    const filtered = sortByPublished(
      (await loadPosts()).filter((post) => isActive(post) && hubMatches(post, params))
    )
    if (q === postsByKeywordsCountQuery.trim()) return filtered.length as T
    return slice(filtered, params.start, params.end) as T
  }
  if (q === allPostSlugsQuery.trim()) {
    return (await loadPosts()).filter((post) => Boolean(post.title)).map(postSlug) as T
  }
  if (q === allCategorySlugsQuery.trim()) {
    return (await loadCategories()).filter((category) => Boolean(category.title)).map((c) => c.slug) as T
  }
  if (q === directoryPostsQuery.trim()) {
    return sortByPublished((await loadPosts()).filter(isActive)).slice(0, 121) as T
  }
  if (q === bancaPostsQuery.trim()) {
    const bancaName = normalize(params.bancaName)
    const bancaSlug = normalize(params.bancaSlug)
    const posts = sortByPublished(
      (await loadPosts()).filter((post) => {
        if (!isActive(post)) return false
        const banca = normalize(post.banca)
        const text = textOf(post)
        return (
          (bancaName && banca.includes(bancaName)) ||
          (bancaName && text.includes(bancaName)) ||
          (bancaSlug && text.includes(bancaSlug))
        )
      })
    )
    return posts.slice(0, 51) as T
  }
  if (q === educationAndStatePostsQuery.trim()) {
    const education = normalize(params.education)
    const educationLabel = normalize(params.educationLabel)
    const posts = sortByPublished(
      (await loadPosts()).filter((post) => {
        if (!isActive(post)) return false
        const levels = asArray<unknown>(post.educationLevel).map(normalize)
        const hasEducation =
          (education && levels.includes(education)) ||
          (educationLabel && textOf(post).includes(educationLabel)) ||
          (educationLabel && categoryTitles(post).includes(educationLabel))
        if (!hasEducation) return false
        const postState = normalize(post.stateUf)
        return postState === normalize(params.ufUpper) || postState === 'nacional' || stateMatches(post, params)
      })
    )
    return posts.slice(0, 51) as T
  }
  if (q === highSalaryPostsQuery.trim()) {
    const posts = sortByPublished(
      (await loadPosts()).filter((post) => {
        if (!isActive(post)) return false
        if (typeof post.salaryMax === 'number' && post.salaryMax >= 10000) return true
        const text = textOf(post)
        return ['10 mil', '15 mil', '20 mil', '30 mil', 'r$ 1', 'r$ 2', 'r$ 3', '10.000', '15.000', '20.000'].some(
          (term) => text.includes(term)
        )
      })
    )
    return posts.slice(0, 51) as T
  }
  if (q === postBySlugHistoryQuery.trim()) {
    const slug = normalize(params.slug)
    const found = (await loadPosts()).find((post) =>
      asArray<unknown>(post.slugHistory).map(normalize).includes(slug)
    )
    return (found ? { slug: postSlug(found) } : null) as T
  }
  if (q === authorBySlugQuery.trim()) {
    const slug = normalize(params.slug)
    const found = (await loadAuthors()).find(
      (author) => normalize(author.slug) === slug || normalize(author._id) === slug
    )
    return (found || null) as T
  }
  if (q === postsByAuthorPaginatedQuery.trim() || q === postsByAuthorCountQuery.trim()) {
    const authorId = String(params.authorId || '')
    const filtered = sortByPublished(
      (await loadPosts()).filter(
        (post) => post.status !== 'cancelado' && String(post.author?._id || '') === authorId
      )
    )
    if (q === postsByAuthorCountQuery.trim()) return filtered.length as T
    return slice(filtered, params.start, params.end) as T
  }
  if (q === allAuthorSlugsQuery.trim()) {
    return (await loadAuthors()).filter((author) => Boolean(author.name)).map((a) => a.slug) as T
  }
  if (q === relatedPostsByBancaQuery.trim()) {
    const currentId = String(params.currentId || '')
    const banca = normalize(params.banca)
    const stateUf = normalize(params.stateUf)
    const matches = (await loadPosts()).filter((post) => {
      if (post._id === currentId || post.status === 'cancelado') return false
      if (banca && normalize(post.banca) === banca) return true
      if (stateUf && stateUf !== 'nacional' && normalize(post.stateUf) === stateUf) return true
      return false
    })
    matches.sort((a, b) => {
      const scoreA = banca && normalize(a.banca) === banca ? 1 : 0
      const scoreB = banca && normalize(b.banca) === banca ? 1 : 0
      if (scoreA !== scoreB) return scoreB - scoreA
      return publishedTime(b) - publishedTime(a)
    })
    return matches.slice(0, 3) as T
  }
  if (q === relatedPostsByStateQuery.trim()) {
    const currentId = String(params.currentId || '')
    const stateUf = normalize(params.stateUf)
    const matches = sortByPublished(
      (await loadPosts()).filter(
        (post) =>
          post._id !== currentId && normalize(post.stateUf) === stateUf && isActive(post)
      )
    )
    return matches.slice(0, 5) as T
  }

  // Consultas inline do sitemap de notícias e do RSS.
  if (q.includes('$twoDaysAgo')) {
    const cutoff = new Date(String(params.twoDaysAgo || 0)).getTime()
    const posts = (await loadPosts()).filter((post) => {
      if (post.status === 'cancelado') return false
      if (post.seo?.noIndex) return false
      const published = post.publishedAt ? new Date(post.publishedAt).getTime() : 0
      const created = post._createdAt ? new Date(post._createdAt).getTime() : 0
      return published >= cutoff || created >= cutoff
    })
    return posts
      .slice(0, 1000)
      .map((post) => ({
        _id: post._id,
        title: post.title,
        slug: postSlug(post),
        publishedAt: post.publishedAt,
        _createdAt: post._createdAt,
      })) as T
  }
  if (q.includes('"authorName"')) {
    const posts = sortByPublished((await loadPosts()).filter((post) => post.status !== 'cancelado')).slice(0, 31)
    return posts.map((post) => ({
      _id: post._id,
      title: post.title,
      slug: postSlug(post),
      publishedAt: post.publishedAt,
      _createdAt: post._createdAt,
      mainImage: post.mainImage,
      excerpt: post.excerpt || '',
      authorName: post.author?.name || 'Redação Concursos Agora',
    })) as T
  }

  throw new Error(`[Turso] Consulta sem implementação equivalente: ${q.slice(0, 120)}`)
}

export function esquecerCacheTurso(): void {
  cachePosts = null
}
