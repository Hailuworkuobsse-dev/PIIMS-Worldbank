import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./utils/cn";
import { IconButton } from "./IconButton";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 mt-3"
    >
      <div className="text-caption text-neutral-600">
        Showing{" "}
        <b>
          {from}–{to}
        </b>{" "}
        of <b>{total.toLocaleString()}</b>
      </div>

      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <label className="text-caption text-neutral-600 inline-flex items-center gap-1.5">
            Rows:
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded border border-neutral-300 bg-white px-1.5 text-caption"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center gap-1">
          <IconButton
            label="Previous page"
            size="sm"
            icon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          />
          <span className={cn("px-2 text-caption text-neutral-600")}>
            Page {page} / {totalPages}
          </span>
          <IconButton
            label="Next page"
            size="sm"
            icon={<ChevronRight className="h-4 w-4" />}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          />
        </div>
      </div>
    </nav>
  );
}