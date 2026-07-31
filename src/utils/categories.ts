import { Category } from '@/types';

/**
 * Remove categorias duplicadas com base no título normalizado ou no slug/ID.
 */
export function deduplicateCategories(categories: Category[]): Category[] {
  if (!categories || !Array.isArray(categories)) return [];

  const seenTitles = new Set<string>();
  const seenSlugs = new Set<string>();
  const result: Category[] = [];

  for (const cat of categories) {
    if (!cat || !cat.title) continue;

    const normalizedTitle = cat.title.trim().toLowerCase();
    const slugOrId = (cat.slug || cat._id || '').trim().toLowerCase();

    // Evitar duplicatas no feed/sidebar/grid
    if (seenTitles.has(normalizedTitle) || (slugOrId && seenSlugs.has(slugOrId))) {
      continue;
    }

    seenTitles.add(normalizedTitle);
    if (slugOrId) seenSlugs.add(slugOrId);

    result.push(cat);
  }

  return result;
}

/**
 * Seleciona as principais categorias limpas ignorando nomes genéricos ou duplicatas.
 */
export function getTopCategories(categories: Category[], limit: number = 6): Category[] {
  const unique = deduplicateCategories(categories);

  const cleanCategories = unique.filter(
    (c) =>
      !c.title.toLowerCase().includes('teste') &&
      !c.title.toLowerCase().includes('sem categoria')
  );

  return (cleanCategories.length > 0 ? cleanCategories : unique).slice(0, limit);
}
