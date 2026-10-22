/**
 * Corrige categorias sem slug (ex.: "Concursos Abertos"), normaliza slugs
 * duplicados e classifica o agrupamento (área, estado, região, status).
 *
 * Uso: npm run fix:categories
 */
import { client, isDryRun, requireToken, toSlug } from './lib.mjs';

requireToken();

const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);
const REGIONS = new Set(['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']);
const STATUS_GROUPS = new Set([
  'Concursos Abertos', 'Previstos', 'Vagas Temporárias', 'Concursos Encerrados',
  'Concursos Municipais', 'Concursos Federais', 'Concursos Estaduais',
]);

function groupFor(category) {
  const title = category.title || '';
  if (UFS.has(title.toUpperCase())) return 'estado';
  if (REGIONS.has(title)) return 'regiao';
  if (STATUS_GROUPS.has(title)) return 'status';
  if (/banca|fgv|cebraspe|vunesp|fcc|ibfc|aocp|quadrix|cesgranrio|fundatec/i.test(title)) return 'banca';
  if (/prefeitura|tribunal|câmara|ministerio|ministério|defensoria|polícia|policia|inss|receita|banco|caixa/i.test(title)) {
    return 'instituicao';
  }
  return 'area';
}

const categories = await client.fetch(
  `*[_type == "category"] | order(title asc) { _id, title, slug, description, group }`
);

const usedSlugs = new Set(
  categories.map((c) => c.slug?.current).filter((s) => typeof s === 'string' && s.length > 0)
);

let changed = 0;

for (const category of categories) {
  const patch = {};
  let slug = category.slug?.current;

  if (!slug) {
    const base = toSlug(category.title) || `categoria-${category._id.slice(0, 6)}`;
    slug = base;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);
    patch.slug = { _type: 'slug', current: slug };
  }

  if (!category.group) {
    patch.group = groupFor(category);
  }

  if (Object.keys(patch).length === 0) continue;

  changed += 1;
  console.log(`Categoria: ${category.title} (${category._id})`);
  for (const [key, value] of Object.entries(patch)) {
    console.log(`  • ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
  }

  if (!isDryRun) {
    await client.patch(category._id).set(patch).commit({ visibility: 'async' });
  }
}

console.log(`\n${changed} categoria(s) atualizada(s)${isDryRun ? ' [DRY RUN]' : ''}.`);
