import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  FolderKanban,
  Users,
  FileText,
  TrendingUp,
  CornerDownLeft,
} from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { cn } from "@/components/ui/utils/cn";

interface Result {
  id: string;
  category: "Projects" | "Beneficiaries" | "Documents" | "Impact";
  title: string;
  subtitle?: string;
  to: string;
  icon: typeof FolderKanban;
  perm: any;
}

/* In production, these results would come from /v1/search?q=... */
const MOCK_RESULTS: Result[] = [
  {
    id: "p1",
    category: "Projects",
    title: "PIIMS-2026-0042",
    subtitle: "Solar Mini-Grid – Oromia Phase 1",
    to: "/projects/PIIMS-2026-0042",
    icon: FolderKanban,
    perm: PERMISSIONS.projectRead,
  },
  {
    id: "p2",
    category: "Projects",
    title: "PIIMS-2026-0038",
    subtitle: "Solar Home Systems – Amhara",
    to: "/projects/PIIMS-2026-0038",
    icon: FolderKanban,
    perm: PERMISSIONS.projectRead,
  },
  {
    id: "b1",
    category: "Beneficiaries",
    title: "Aster Bekele",
    subtitle: "BEN-2026-00012345 · Bora",
    to: "/beneficiaries?q=BEN-2026-00012345",
    icon: Users,
    perm: PERMISSIONS.beneficiaryRead,
  },
  {
    id: "d1",
    category: "Documents",
    title: "Feasibility Study – Oromia Phase 1",
    subtitle: "v2 · 12 Oct 2026",
    to: "/documents",
    icon: FileText,
    perm: PERMISSIONS.docRead,
  },
  {
    id: "i1",
    category: "Impact",
    title: "Household income",
    subtitle: "IMP-INC-001 · +65% change",
    to: "/impact",
    icon: TrendingUp,
    perm: PERMISSIONS.impactAnalyticsRead,
  },
];

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { searchOpen, setSearchOpen } = useUIStore();
  const { can } = usePermissions();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    return MOCK_RESULTS.filter((r) => can(r.perm))
      .filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          (r.subtitle ?? "").toLowerCase().includes(term) ||
          r.category.toLowerCase().includes(term),
      )
      .slice(0, 20);
  }, [q, can]);

  useEffect(() => {
    if (searchOpen) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [searchOpen]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        const r = results[active];
        if (r) {
          setSearchOpen(false);
          navigate(r.to);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen, results, active, navigate, setSearchOpen]);

  if (!searchOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-start justify-center pt-[8vh] px-4 bg-neutral-900/55"
      onClick={() => setSearchOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={t("shell.searchPlaceholder")}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-lg bg-white shadow-lg border border-neutral-300 overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-300">
          <Search className="h-5 w-5 text-neutral-600" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("shell.searchPlaceholder")}
            className="flex-1 outline-none text-body bg-transparent"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={results[active]?.id}
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-300 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          id="search-results"
          role="listbox"
          className="max-h-[420px] overflow-y-auto"
        >
          {q.trim().length < 2 && (
            <div className="p-6 text-center text-body-sm text-neutral-600">
              {t("shell.searchEmpty")}
            </div>
          )}
          {q.trim().length >= 2 && results.length === 0 && (
            <div className="p-6 text-center text-body-sm text-neutral-600">
              {t("shell.searchNoResults", { q })}
            </div>
          )}
          {results.map((r, i) => {
            const Icon = r.icon;
            const isActive = i === active;
            return (
              <button
                key={r.id}
                id={r.id}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  setSearchOpen(false);
                  navigate(r.to);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left",
                  isActive ? "bg-primary-100" : "hover:bg-neutral-50",
                )}
              >
                <Icon
                  className="h-4 w-4 text-neutral-600 shrink-0"
                  aria-hidden
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-body-sm font-semibold text-neutral-900 truncate">
                    {r.title}
                  </span>
                  {r.subtitle && (
                    <span className="block text-caption text-neutral-600 truncate">
                      {r.subtitle}
                    </span>
                  )}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold shrink-0">
                  {r.category}
                </span>
                {isActive && (
                  <CornerDownLeft
                    className="h-4 w-4 text-neutral-500 shrink-0"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-300 bg-neutral-50 px-4 py-2 flex items-center gap-4 text-caption text-neutral-600">
          <span>
            <kbd className="px-1 bg-white border border-neutral-300 rounded text-[10px]">
              ↑↓
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="px-1 bg-white border border-neutral-300 rounded text-[10px]">
              ↵
            </kbd>{" "}
            open
          </span>
          <span className="ml-auto">{t("shell.searchHint")}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}