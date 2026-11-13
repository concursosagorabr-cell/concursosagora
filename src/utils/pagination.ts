import { notFound } from 'next/navigation';

/**
 * Converte `?page=` em inteiro positivo. Valores inválidos (texto, zero,
 * negativo, decimais) viram 404 em vez de serem silenciosamente tratados como
 * página 1 — evita URLs duplicadas indexáveis.
 */
export function parsePageParam(value?: string): number {
  if (value === undefined || value === '') return 1;
  if (!/^\d+$/.test(value)) notFound();
  const page = Number.parseInt(value, 10);
  if (!Number.isFinite(page) || page < 1) notFound();
  return page;
}

/**
 * Garante que a paginação solicitada existe. Páginas acima do total retornam
 * 404 (em vez de 200 com a mensagem "nenhuma matéria"), como recomendado para
 * páginas de arquivo.
 */
export function assertPageInRange(currentPage: number, totalPages: number): void {
  if (currentPage > 1 && (totalPages === 0 || currentPage > totalPages)) {
    notFound();
  }
}
