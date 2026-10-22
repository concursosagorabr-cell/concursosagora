/**
 * Normaliza os perfis de autores:
 * - cria slug quando faltar;
 * - preenche cargo padrão;
 * - corrige URLs de redes sociais (sem protocolo, espaços, http -> https).
 *
 * Uso: npm run patch:authors
 * Seguro para reexecutar: só altera campos vazios ou URLs inválidas.
 */
import { client, isDryRun, requireToken } from './lib.mjs';

requireToken();

const authors = await client.fetch(
  `*[_type == "author"] | order(name asc) { _id, name, slug, role, linkedinUrl, twitterUrl, instagramUrl, facebookUrl }`
);

const SOCIAL_FIELDS = ['linkedinUrl', 'twitterUrl', 'instagramUrl', 'facebookUrl'];

function fixUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) return `https://${raw.replace(/^\/+/, '')}`;
  return raw.replace(/^http:\/\//i, 'https://');
}

let changed = 0;

for (const author of authors) {
  const patch = {};

  if (!author.slug?.current && author.name) {
    patch.slug = {
      _type: 'slug',
      current: String(author.name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    };
  }

  if (!author.role) {
    patch.role = 'Redação Concursos Agora';
  }

  for (const field of SOCIAL_FIELDS) {
    const fixed = fixUrl(author[field]);
    if (fixed && fixed !== author[field]) patch[field] = fixed;
  }

  if (Object.keys(patch).length === 0) continue;

  changed += 1;
  console.log(`Autor: ${author.name} (${author._id})`);
  for (const [key, value] of Object.entries(patch)) {
    console.log(`  • ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
  }

  if (!isDryRun) {
    await client.patch(author._id).set(patch).commit({ visibility: 'async' });
  }
}

console.log(`\n${changed} autor(es) atualizado(s)${isDryRun ? ' [DRY RUN]' : ''}.`);
