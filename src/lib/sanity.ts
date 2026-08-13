import { createClient } from '@sanity/client';

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'wobukj4j';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-07-25';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Garante que artigos e imagens recentes apareçam imediatamente sem delay do cache CDN do Sanity
});
