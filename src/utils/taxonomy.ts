import { getCategoryAliases } from './categories';

export type BrazilianRegion = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul' | 'Nacional';

export const BRAZILIAN_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const UF_TO_REGION: Record<string, BrazilianRegion> = {
  AC: 'Norte',
  AL: 'Nordeste',
  AP: 'Norte',
  AM: 'Norte',
  BA: 'Nordeste',
  CE: 'Nordeste',
  DF: 'Centro-Oeste',
  ES: 'Sudeste',
  GO: 'Centro-Oeste',
  MA: 'Nordeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  MG: 'Sudeste',
  PA: 'Norte',
  PB: 'Nordeste',
  PR: 'Sul',
  PE: 'Nordeste',
  PI: 'Nordeste',
  RJ: 'Sudeste',
  RN: 'Nordeste',
  RS: 'Sul',
  RO: 'Norte',
  RR: 'Norte',
  SC: 'Sul',
  SP: 'Sudeste',
  SE: 'Nordeste',
  TO: 'Norte',
  Nacional: 'Nacional',
};

export const REGION_UFS: Record<Exclude<BrazilianRegion, 'Nacional'>, string[]> = {
  Norte: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  Nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  Sudeste: ['ES', 'MG', 'RJ', 'SP'],
  Sul: ['PR', 'RS', 'SC'],
};

const REGION_SLUGS: Record<BrazilianRegion, string> = {
  Norte: 'norte',
  Nordeste: 'nordeste',
  'Centro-Oeste': 'centro-oeste',
  Sudeste: 'sudeste',
  Sul: 'sul',
  Nacional: 'nacional',
};

/**
 * A única UF cujo slug de categoria não é a sigla em minúsculas é Alagoas
 * (categoria `alagoas`, para não colidir com o artigo "a").
 */
const UF_CATEGORY_SLUG_OVERRIDES: Record<string, string> = {
  AL: 'alagoas',
};

export function normalizeUf(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (cleaned.toLowerCase() === 'nacional') return 'Nacional';
  const upper = cleaned.toUpperCase();
  return (BRAZILIAN_UFS as readonly string[]).includes(upper) ? upper : null;
}

export function getRegionForUf(value?: string | null): BrazilianRegion {
  const uf = normalizeUf(value);
  if (!uf) return 'Nacional';
  return UF_TO_REGION[uf] || 'Nacional';
}

export function getStateCategorySlug(value?: string | null): string | null {
  const uf = normalizeUf(value);
  if (!uf || uf === 'Nacional') return null;
  return UF_CATEGORY_SLUG_OVERRIDES[uf] || uf.toLowerCase();
}

export function getRegionCategorySlug(region: BrazilianRegion): string {
  return REGION_SLUGS[region];
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export interface CategoryScope {
  /** UF exata quando a página é de estado (ex.: /categoria/sp). */
  uf: string | null;
  /** Região quando a página é regional (ex.: /categoria/sul). */
  region: Exclude<BrazilianRegion, 'Nacional'> | null;
  /** UFs que compõem a região, usadas como fallback para matérias antigas. */
  regionUfs: string[];
  /** Slugs/sinônimos legados aceitos pela query de categorias. */
  slugs: string[];
}

/**
 * Define o escopo real de uma página /categoria/[slug].
 *
 * - UF (SP, AL, ...) filtra por `stateUf`, não pela categoria genérica.
 * - Região (Sul, Nordeste, ...) filtra por `region` + UFs da região.
 * - Categoria temática continua usando os sinônimos de `getCategoryAliases`.
 */
export function getCategoryScope(
  slug: string,
  category?: { title?: string | null; group?: string | null }
): CategoryScope {
  const normalizedSlug = normalizeText(slug);
  const title = category?.title ? category.title.trim() : '';
  const normalizedTitle = title ? normalizeText(title) : '';
  const group = category?.group || null;

  const directUf = normalizeUf(slug) || normalizeUf(title);
  const isStateCategory = group === 'estado' || Boolean(directUf && directUf !== 'Nacional' && normalizedTitle === directUf.toLowerCase());

  if (directUf && (isStateCategory || normalizedSlug === getStateCategorySlug(directUf))) {
    if (directUf === 'Nacional') {
      return {
        uf: 'Nacional',
        region: null,
        regionUfs: [],
        slugs: getCategoryAliases(slug),
      };
    }
    return {
      uf: directUf,
      region: null,
      regionUfs: [],
      slugs: Array.from(new Set([slug, getStateCategorySlug(directUf) || slug])),
    };
  }

  const regionEntry = (Object.entries(REGION_SLUGS) as Array<[BrazilianRegion, string]>).find(
    ([region, regionSlug]) =>
      region !== 'Nacional' &&
      (group === 'regiao' || normalizedSlug === regionSlug || normalizedTitle === normalizeText(region)) &&
      (normalizedSlug === regionSlug || normalizedTitle === normalizeText(region) || group === 'regiao')
  );

  if (regionEntry) {
    const [region] = regionEntry;
    if (region !== 'Nacional') {
      return {
        uf: null,
        region,
        regionUfs: REGION_UFS[region],
        slugs: getCategoryAliases(slug),
      };
    }
  }

  if (normalizedSlug === 'nacional') {
    return {
      uf: 'Nacional',
      region: null,
      regionUfs: [],
      slugs: getCategoryAliases(slug),
    };
  }

  return {
    uf: null,
    region: null,
    regionUfs: [],
    slugs: getCategoryAliases(slug),
  };
}

export { REGION_SLUGS };
