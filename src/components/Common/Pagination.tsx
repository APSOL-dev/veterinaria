import React from 'react';

export function getPaginationRange(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Near start: pages 1 to 4
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  // Near end: last 4 pages
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  // In the middle
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  itemLabel = 'registros',
  className = ''
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  const paginationRange = getPaginationRange(safeCurrentPage, totalPages);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 font-body-md text-xs ${className}`}
    >
      {/* Left: Range Info */}
      <div className="text-slate-500 font-medium text-xs whitespace-nowrap order-2 sm:order-1">
        Mostrando {startItem}-{endItem} de {totalItems} {itemLabel}
      </div>

      {/* Center: Page Controls */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* Previous Page */}
        <button
          type="button"
          onClick={() => safeCurrentPage > 1 && onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="w-8 h-8 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="Página anterior"
          aria-label="Página anterior"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>

        {/* Page Numbers */}
        {paginationRange.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs font-medium select-none"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(page);
          const isActive = pageNum === safeCurrentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#0F172A] text-white font-semibold shadow-xs'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => safeCurrentPage < totalPages && onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          className="w-8 h-8 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="Página siguiente"
          aria-label="Página siguiente"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>

      {/* Right: Page Size Dropdown */}
      <div className="order-3 flex items-center gap-2">
        {onPageSizeChange && (
          <div className="relative inline-block">
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-7 text-xs text-slate-700 font-medium outline-none cursor-pointer focus:border-primary shadow-2xs transition-colors hover:border-slate-300"
              aria-label="Cantidad de registros por página"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}/page
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              expand_more
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
