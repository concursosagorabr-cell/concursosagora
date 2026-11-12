import { NextResponse } from 'next/server';
import { buildNewsSitemap } from '@/lib/newsSitemap';

export const revalidate = 300; // Revalida a cada 5 minutos

export async function GET() {
  const xmlContent = await buildNewsSitemap();

  return new NextResponse(xmlContent, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
