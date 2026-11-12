import { getCachedNewsSitemapPosts } from '@/lib/sanity';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

const escapeXml = (unsafe: string) =>
  (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Gera o XML do Google News Sitemap.
 *
 * Regras aplicadas:
 * - Apenas matérias das últimas 48 horas (exigência do Google Notícias).
 * - `news:publication_date` em ISO 8601 com fuso (UTC).
 * - No máximo 1.000 URLs por arquivo.
 */
export async function buildNewsSitemap(): Promise<string> {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  let posts: any[] = [];
  try {
    posts = await getCachedNewsSitemapPosts(twoDaysAgo);
  } catch (error) {
    console.error('Erro ao buscar posts para o news sitemap:', error);
  }

  const urlsXml = (posts || [])
    .filter((post) => post?.title && post?.slug)
    .map((post) => {
      const pubDate = new Date(post.publishedAt || post._createdAt || Date.now()).toISOString();
      const title = escapeXml(post.title);
      const url = `${SITE_URL}/post/${encodeURIComponent(post.slug)}`;

      return `  <url>
    <loc>${escapeXml(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>pt-BR</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlsXml}
</urlset>`;
}
