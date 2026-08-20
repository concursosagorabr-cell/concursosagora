import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl = '/',
  totalItems,
  itemsPerPage = 10,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  // Gerar números de páginas visíveis
  const pages: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

  const getPageUrl = (p: number) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${p}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 my-12">
      {totalItems !== undefined && (
        <span className="text-xs text-slate-500 font-medium">
          Exibindo {startItem}–{endItem} de {totalItems} matérias
        </span>
      )}

      <nav className="flex items-center justify-center space-x-1.5" aria-label="Paginação">
        {prevPage ? (
          <Link
            href={getPageUrl(prevPage)}
            className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors shadow-2xs"
          >
            ← Anterior
          </Link>
        ) : (
          <span className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed border border-transparent">
            ← Anterior
          </span>
        )}

        {startPage > 1 && (
          <>
            <Link
              href={getPageUrl(1)}
              className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 transition-colors"
            >
              1
            </Link>
            {startPage > 2 && <span className="px-1 text-slate-400">...</span>}
          </>
        )}

        {pages.map((p) => {
          const isActive = p === currentPage;
          return isActive ? (
            <span
              key={p}
              className="px-3.5 py-2 text-sm font-bold rounded-xl bg-blue-600 text-white shadow-xs"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={getPageUrl(p)}
              className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors"
            >
              {p}
            </Link>
          );
        })}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-slate-400">...</span>}
            <Link
              href={getPageUrl(totalPages)}
              className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 transition-colors"
            >
              {totalPages}
            </Link>
          </>
        )}

        {nextPage ? (
          <Link
            href={getPageUrl(nextPage)}
            className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors shadow-2xs"
          >
            Próxima →
          </Link>
        ) : (
          <span className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed border border-transparent">
            Próxima →
          </span>
        )}
      </nav>
    </div>
  );
}
