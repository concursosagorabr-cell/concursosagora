import { createClient, type QueryParams } from '@sanity/client';
import { cache } from 'react';

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'wobukj4j';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-07-25';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Usa cache CDN de borda para leituras — ISR do Next.js controla revalidação
});

/**
 * Wrapper com React.cache() para deduplicar requests dentro da mesma árvore RSC.
 * Evita waterfalls quando múltiplos componentes pedem a mesma query.
 */
export const sanityFetch = cache(
  async <T = any>(query: string, params: QueryParams = {}): Promise<T> => {
    return client.fetch<T>(query, params);
  }
);
