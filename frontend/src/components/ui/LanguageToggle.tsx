import { useUIStore } from "@/stores/ui.store";
import { cn } from "./utils/cn";

/** EN/አማርኛ switch — syncs the ui store and react-i18next. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useUIStore();
  return (
    <div
      role="group"
      aria-label="Language / ቋንቋ"
      className={cn(
        "inline-flex overflow-hidden rounded-md border border-neutral-300 text-caption shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={locale === "en"}
        className={cn(
          "px-3 py-1.5 font-semibold transition-colors",
          locale === "en"
            ? "bg-primary-700 text-white"
            : "bg-white text-neutral-600 hover:bg-neutral-100",
        )}
        onClick={() => setLocale("en")}
      >
        English
      </button>
      <button
        type="button"
        aria-pressed={locale === "am"}
        className={cn(
          "px-3 py-1.5 font-semibold transition-colors",
          locale === "am"
            ? "bg-primary-700 text-white"
            : "bg-white text-neutral-600 hover:bg-neutral-100",
        )}
        onClick={() => setLocale("am")}
      >
        አማርኛ
      </button>
    </div>
  );
}
