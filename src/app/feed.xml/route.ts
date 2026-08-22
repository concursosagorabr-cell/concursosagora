import { NextResponse } from 'next/server';
import { getCachedRssFeedPosts } from '@/lib/sanity';
import { getImageUrl } from '@/lib/image';

export const revalidate = 300; // Revalida a cada 5 minutos

export async function GET() {
  const baseUrl = 'https://concursosagora.com.br';

  let posts: any[] = [];
  try {
    posts = await getCachedRssFeedPosts();
  } catch (error) {
    console.error('Erro ao buscar posts para o RSS Feed:', error);
  }

  const escapeXml = (unsafe: string) =>
    (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const itemsXml = (posts || [])
    .map((post) => {
      const pubDate = new Date(post.publishedAt || post._createdAt || Date.now()).toUTCString();
      const title = escapeXml(post.title);
      const link = `${baseUrl}/post/${encodeURIComponent(post.slug)}`;
      const description = escapeXml(post.excerpt || post.title);
      const author = escapeXml(post.authorName);
      const imageUrl = post.mainImage ? getImageUrl(post.mainImage, 1200, 675) : '';

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${author}</dc:creator>
      <description>${description}</description>
      ${imageUrl ? `<media:content url="${escapeXml(imageUrl)}" medium="image" width="1200" height="675" />` : ''}
    </item>`;
    })
    .join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:dc="http://purl.org/dc/elements/1.1/" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Concursos Agora — Notícias de Concursos Públicos</title>
    <link>${baseUrl}</link>
    <description>O portal definitivo de notícias sobre concursos públicos no Brasil. Inscrições abertas, editais previstos e materiais de estudo.</description>
    <language>pt-BR</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
