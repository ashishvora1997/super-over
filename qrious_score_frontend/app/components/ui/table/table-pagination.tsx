import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  page,
  total,
  pageSize,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);
    if (page <= 3) end = Math.min(totalPages - 1, 4);
    if (page >= totalPages - 2) start = Math.max(2, totalPages - 3);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const isSinglePage = totalPages <= 1;
  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-gray-50/50">
      <p className="text-xs text-muted">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {(page - 1) * pageSize + 1}
        </span>{" "}
        –{" "}
        <span className="font-semibold text-foreground">
          {Math.min(page * pageSize, total)}
        </span>{" "}
        of <span className="font-semibold text-foreground">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isSinglePage}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>

        {pageNumbers.map((item, index) =>
          item === "..." ? (
            <span
              key={index}
              className="w-8 h-8 flex items-center justify-center text-xs text-muted"
            >
              ···
            </span>
          ) : (
            <button
              key={item as number}
              onClick={() => !isSinglePage && onPageChange(item as number)}
              disabled={isSinglePage}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                item === page
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border bg-white hover:bg-gray-100 text-foreground"
              } ${isSinglePage ? "cursor-not-allowed" : ""}`}
            >
              {item}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || isSinglePage}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <p className="text-xs text-muted hidden sm:block">{pageSize} / page</p>
    </div>
  );
}
