import { Post, Category } from '@/types';

/** Gera a URL canônica de um post */
export function getPostUrl(post: { slug?: string; _id: string }): string {
  return `/post/${post.slug || post._id}`;
}

/** Gera a URL de uma categoria */
export function getCategoryUrl(cat: { slug?: string; _id: string }): string {
  return `/categoria/${cat.slug || cat._id}`;
}

/** Formata data em pt-BR */
export function formatDate(
  dateStr: string | undefined | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', options);
}

/** Formata data curta (dd/mm/yyyy) */
export function formatDateShort(dateStr: string | undefined | null): string {
  return formatDate(dateStr, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
