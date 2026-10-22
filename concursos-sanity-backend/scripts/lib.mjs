import { createClient } from '@sanity/client';

export const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  'wobukj4j';

export const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  'production';

export const apiVersion = process.env.SANITY_API_VERSION || '2026-07-25';

export function requireToken() {
  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      'SANITY_API_TOKEN não configurado. Crie backend/.env.local a partir de .env.example.'
    );
  }
  return token;
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

export const isDryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function toSlug(value) {
  return normalizeText(value).replace(/\s+/g, '-').slice(0, 96);
}

export function logChange(label, detail = '') {
  console.log(`  • ${label}${detail ? `: ${detail}` : ''}`);
}
