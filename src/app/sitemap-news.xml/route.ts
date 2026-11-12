import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/constants';

/**
 * Alias legado. O arquivo canônico agora é /news-sitemap.xml.
 * Mantemos o redirecionamento permanente para não quebrar inscrições
 * antigas no Google Search Console.
 */
export async function GET() {
  return NextResponse.redirect(new URL('/news-sitemap.xml', SITE_URL), 308);
}
