import { ChevronLeft, ChevronRight } from 'lucide-react';

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/**
 * Builds a compact list like: 1 … 34 35 36 … 65
 * Always shows the first page, last page, and the current page
 * with `siblings` pages on each side. A gap of exactly one page
 * is filled with the page number instead of an ellipsis.
 */
function getPageItems(
  current: number,
  total: number,
  siblings = 1,
): PageItem[] {
  const pages = new Set<number>([1, total]);

  for (let p = current - siblings; p <= current + siblings; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];

  sorted.forEach((page, index) => {
    const prev = sorted[index - 1];

    if (prev !== undefined) {
      if (page - prev === 2) {
        items.push(prev + 1);
      } else if (page - prev > 2) {
        items.push(prev === 1 ? 'ellipsis-start' : 'ellipsis-end');
      }
    }

    items.push(page);
  });

  return items;
}

const navButton =
  'flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <nav className="mt-6" aria-label="Pagination">
      {/* MOBILE */}
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          className={`${navButton} gap-1.5 px-3 py-2 text-sm font-medium`}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="text-sm font-medium text-slate-500">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          className={`${navButton} gap-1.5 px-3 py-2 text-sm font-medium`}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      {/* DESKTOP */}
      <div className="hidden items-center justify-center gap-2 sm:flex">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          className={`${navButton} h-9 w-9`}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1">
          {getPageItems(currentPage, totalPages).map((item) =>
            typeof item === 'string' ? (
              <span
                key={item}
                className="flex h-9 w-9 items-center justify-center text-sm text-slate-400"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
                  item === currentPage
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          className={`${navButton} h-9 w-9`}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
