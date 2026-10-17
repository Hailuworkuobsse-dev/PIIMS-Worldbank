import { Menu, Search as SearchIcon, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUIStore } from "@/stores/ui.store";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { cn } from "@/components/ui/utils/cn";

export function TopBar() {
  const { t } = useTranslation();
  const { locale, setLocale, setSearchOpen, setMobileNavOpen } = useUIStore();

  return (
    <header
      role="banner"
      className="h-14 shrink-0 bg-primary-900 text-white flex items-center gap-3 px-3 sm:px-4 shadow-md z-30 relative"
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label={t("shell.openMenu")}
        className="md:hidden h-9 w-9 rounded-md hover:bg-white/10 grid place-items-center"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {/* Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          aria-hidden
          className="h-7 w-7 rounded-md"
          style={{
            background:
              "conic-gradient(from 210deg,#38bdf8,#818cf8,#f472b6,#38bdf8)",
          }}
        />
        <div className="leading-tight">
          <div className="text-body-sm font-extrabold tracking-wide">PIIMS</div>
          <div className="hidden md:block text-[10px] uppercase tracking-[0.16em] opacity-70">
            Impact-Enabled
          </div>
        </div>
      </div>

      {/* Search trigger */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className={cn(
          "hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-md bg-white/10 hover:bg-white/20",
          "text-caption text-white/80 hover:text-white min-w-[280px] lg:min-w-[360px] justify-between transition-colors",
        )}
        aria-label={t("shell.searchHint")}
      >
        <span className="inline-flex items-center gap-2">
          <SearchIcon className="h-4 w-4" aria-hidden />
          <span>{t("shell.searchPlaceholder")}</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white/10 border border-white/20 rounded">
            ⌘K
          </kbd>
        </span>
      </button>

      {/* Mobile search trigger */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label={t("shell.searchHint")}
        className="md:hidden h-9 w-9 rounded-md hover:bg-white/10 grid place-items-center"
      >
        <SearchIcon className="h-5 w-5" aria-hidden />
      </button>

      <div className="flex-1" />

      {/* Language */}
      <div className="hidden sm:flex items-center gap-1.5">
        <Languages className="h-4 w-4 opacity-70" aria-hidden />
        <div
          role="group"
          aria-label={t("shell.switchLanguage")}
          className="inline-flex overflow-hidden rounded-md border border-white/20"
        >
          <button
            type="button"
            onClick={() => setLocale("en")}
            aria-pressed={locale === "en"}
            className={cn(
              "px-2.5 py-1 text-caption font-semibold transition-colors",
              locale === "en"
                ? "bg-accent-500 text-primary-900"
                : "text-white/70 hover:text-white hover:bg-white/10",
            )}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale("am")}
            aria-pressed={locale === "am"}
            className={cn(
              "px-2.5 py-1 text-caption font-semibold transition-colors",
              locale === "am"
                ? "bg-accent-500 text-primary-900"
                : "text-white/70 hover:text-white hover:bg-white/10",
            )}
          >
            አማ
          </button>
        </div>
      </div>

      <NotificationBell />
      <UserMenu />
    </header>
  );
}