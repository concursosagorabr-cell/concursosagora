import { Category } from '@/types';

const STATE_CODES = new Set([
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
]);

const REGION_NAMES = new Set([
  'nacional', 'sudeste', 'sul', 'nordeste', 'norte', 'centro-oeste', 'centro oeste'
]);

const CATEGORY_ALIASES_MAP: Record<string, string[]> = {
  // Finanças e Bancário
  'financas': ['financas', 'bancaro-financas', 'bancaria-e-financeira', 'bancaria', 'financeiro', 'banco'],
  'bancaro-financas': ['financas', 'bancaro-financas', 'bancaria-e-financeira', 'bancaria', 'financeiro', 'banco'],
  'bancaria-e-financeira': ['financas', 'bancaro-financas', 'bancaria-e-financeira', 'bancaria', 'financeiro', 'banco'],
  'financeiro': ['financas', 'bancaro-financas', 'bancaria-e-financeira', 'bancaria', 'financeiro', 'banco'],

  // Administração
  'administracao': ['administracao', 'administrativa', 'gestao-publica'],
  'administrativa': ['administracao', 'administrativa', 'gestao-publica'],

  // Segurança / Policial
  'seguranca': ['seguranca', 'policial', 'policia'],
  'policial': ['seguranca', 'policial', 'policia'],

  // Saúde
  'saude': ['saude', 'enfermagem', 'medicina'],
  'enfermagem': ['saude', 'enfermagem', 'medicina'],

  // Fiscal
  'fiscal': ['fiscal', 'contabil', 'tributaria'],
};

/**
 * Retorna os sinônimos/slugs equivalentes de uma categoria para unir posts fragmentados do Sanity.
 */
export function getCategoryAliases(slug: string): string[] {
  if (!slug) return [];
  const normalized = slug.trim().toLowerCase();

  const matched = CATEGORY_ALIASES_MAP[normalized];
  if (matched && matched.length > 0) {
    return Array.from(new Set([normalized, ...matched]));
  }

  return [normalized, slug];
}

/**
 * Remove categorias duplicadas com base no título normalizado.
 */
export function deduplicateCategories(categories: Category[]): Category[] {
  if (!categories || !Array.isArray(categories)) return [];

  const seen = new Set<string>();
  const result: Category[] = [];

  for (const cat of categories) {
    if (!cat || !cat.title) continue;

    const normalizedTitle = cat.title.trim().toLowerCase();

    if (seen.has(normalizedTitle)) continue;

    seen.add(normalizedTitle);
    result.push(cat);
  }

  return result;
}

/**
 * Retorna apenas categorias temáticas/carreiras puras, desconsiderando siglas de estados (AC, AL, SP...)
 * e regiões (Sudeste, Sul...) que já possuem menus/links próprios em "Estados" e "Regiões".
 */
export function getPureCategories(categories: Category[]): Category[] {
  const unique = deduplicateCategories(categories);

  return unique.filter((cat) => {
    if (!cat || !cat.title) return false;
    const titleTrimmed = cat.title.trim();
    const titleUpper = titleTrimmed.toUpperCase();
    const titleLower = titleTrimmed.toLowerCase();

    // Remover siglas de estados (AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG...)
    if (STATE_CODES.has(titleUpper)) return false;

    // Remover nomes de regiões
    if (REGION_NAMES.has(titleLower)) return false;

    // Remover tags de teste
    if (titleLower.includes('teste')) return false;

    return true;
  });
}

/**
 * Seleciona as principais categorias puras para exibições compactas.
 */
export function getTopCategories(categories: Category[], limit: number = 6): Category[] {
  const pure = getPureCategories(categories);
  return pure.slice(0, limit);
}
