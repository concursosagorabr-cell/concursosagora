import { sqliteTable, text, index, primaryKey } from 'drizzle-orm/sqlite-core'

/**
 * Espelho do schema do Turso (usado apenas por `drizzle-kit generate`).
 *
 * A coluna `data` guarda o documento completo no formato que o frontend
 * consome do Sanity. As demais colunas existem para indexação e filtros
 * rápidos, sem duplicar a fonte da verdade.
 */
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  body: text('body').notNull(),
  mainImage: text('main_image'),
  publishedAt: text('published_at'),
  status: text('status').notNull(),
  reviewStatus: text('review_status').notNull().default('pending'),
  seo: text('seo'),
  authorId: text('author_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  stateUf: text('state_uf'),
  region: text('region'),
  banca: text('banca'),
  organ: text('organ'),
  hubAreas: text('hub_areas'),
  contestKey: text('contest_key'),
  contentHash: text('content_hash'),
  data: text('data').notNull(),
}, (t) => ({
  slugIdx: index('posts_slug_idx').on(t.slug),
  reviewIdx: index('posts_review_idx').on(t.reviewStatus, t.publishedAt),
  stateIdx: index('posts_state_idx').on(t.stateUf),
  bancaIdx: index('posts_banca_idx').on(t.banca),
}))

export const authors = sqliteTable('authors', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  image: text('image'),
  bio: text('bio'),
  data: text('data').notNull(),
})

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  groupName: text('group_name'),
  data: text('data').notNull(),
})

export const postCategories = sqliteTable('post_categories', {
  postId: text('post_id').notNull(),
  categoryId: text('category_id').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.categoryId] }),
}))

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value'),
})
