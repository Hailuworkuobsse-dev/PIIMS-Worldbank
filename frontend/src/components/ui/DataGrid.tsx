import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "./utils/cn";

export interface Column<T> {
  /** Row field key, or a virtual id (e.g. "actions") for render-only columns */
  id: (keyof T & string) | string;
  header: string;
  width?: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataGridProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  ariaLabel?: string;
}

type SortDir = "asc" | "desc" | null;

export function DataGrid<T extends { id: string }>({
  columns,
  rows,
  loading,
  onRowClick,
  emptyMessage = "No records",
  ariaLabel,
}: DataGridProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return rows;
    const arr = [...rows];
    arr.sort((a, b) => {
      const va = (a as any)[sortCol];
      const vb = (b as any)[sortCol];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va > vb ? 1 : va < vb ? -1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortCol, sortDir]);

  const toggle = (col: string) => {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
    if (sortDir === "desc") setSortCol(null);
  };

  return (
    <div className="w-full overflow-x-auto rounded-md border border-neutral-300 bg-white">
      <table
        className="w-full border-collapse text-body-sm"
        aria-label={ariaLabel}
      >
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sortCol === c.id && sortDir;
              return (
                <th
                  key={c.id}
                  scope="col"
                  style={{ width: c.width }}
                  aria-sort={
                    active === "asc"
                      ? "ascending"
                      : active === "desc"
                        ? "descending"
                        : c.sortable
                          ? "none"
                          : undefined
                  }
                  className={cn(
                    "bg-primary-700 text-white font-bold text-caption uppercase tracking-wide px-3 py-2.5 sticky top-0",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    "text-left",
                  )}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      className="inline-flex items-center gap-1 hover:opacity-90"
                    >
                      {c.header}
                      {active === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : active === "desc" ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td
                colSpan={columns.length}
                className="p-8 text-center text-neutral-600"
              >
                Loading…
              </td>
            </tr>
          )}
          {!loading && sorted.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="p-8 text-center text-neutral-600"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {!loading &&
            sorted.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "even:bg-neutral-50 border-t border-neutral-300",
                  onRowClick &&
                    "cursor-pointer hover:bg-primary-100 focus-visible:bg-primary-100 focus-visible:outline-none",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.id}
                    className={cn(
                      "px-3 py-2.5 align-middle",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className,
                    )}
                  >
                    {c.render
                      ? c.render(row)
                      : String((row as any)[c.id] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}