import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export const revalidate = 300; // Revalida a cada 5 minutos

export async function GET() {
  const baseUrl = 'https://concursosagora.com.br';

  // Buscar notícias publicadas nos últimos 2 dias (48 horas)
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  let posts: any[] = [];
  try {
    posts = await client.fetch(
      `*[_type == "post" && (publishedAt >= $twoDaysAgo || _createdAt >= $twoDaysAgo)] | order(publishedAt desc)[0..1000] {
        _id,
        title,
        "slug": coalesce(slug.current, _id),
        publishedAt,
        _createdAt
      }`,
      { twoDaysAgo }
    );
  } catch (error) {
    console.error('Erro ao buscar posts para o sitemap-news:', error);
  }

  // Fallback: se não houver posts nas últimas 48h, pega os 10 mais recentes
  if (!posts || posts.length === 0) {
    try {
      posts = await client.fetch(
        `*[_type == "post"] | order(publishedAt desc)[0..10] {
          _id,
          title,
          "slug": coalesce(slug.current, _id),
          publishedAt,
          _createdAt
        }`
      );
    } catch (e) {
      console.error('Erro no fallback do sitemap-news:', e);
    }
  }

  const escapeXml = (unsafe: string) =>
    (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const urlsXml = (posts || [])
    .map((post) => {
      const pubDate = new Date(post.publishedAt || post._createdAt || Date.now()).toISOString();
      const title = escapeXml(post.title);
      const url = `${baseUrl}/post/${encodeURIComponent(post.slug)}`;

      return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>Concursos Agora</news:name>
        <news:language>pt-BR</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlsXml}
</urlset>`;

  return new NextResponse(xmlContent, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
