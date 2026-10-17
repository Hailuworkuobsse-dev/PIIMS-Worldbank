import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, LogOut, User, Shield, Globe } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { roleLabel } from "@/features/auth/auth.types";
import { cn } from "@/components/ui/utils/cn";

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { locale, setLocale } = useUIStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!user) return null;

  const initials = user.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const onSignOut = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-md text-white hover:bg-white/10 transition-colors"
      >
        <span
          aria-hidden
          className="h-7 w-7 rounded-full bg-accent-500 text-primary-900 grid place-items-center font-bold text-[11px]"
        >
          {initials}
        </span>
        <span className="hidden md:inline text-caption font-semibold max-w-[120px] truncate">
          {user.fullName.split(" ")[0]}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 rounded-md bg-white shadow-lg border border-neutral-300 overflow-hidden z-50"
        >
          {/* Identity header */}
          <div className="px-4 py-3 border-b border-neutral-300 bg-neutral-50">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-10 w-10 rounded-full bg-primary-700 text-white grid place-items-center font-bold"
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-body-sm font-bold text-primary-900 truncate">
                  {user.fullName}
                </div>
                <div className="text-caption text-neutral-600 truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-caption">
              <Shield className="h-3.5 w-3.5 text-primary-700" aria-hidden />
              <span className="font-semibold text-primary-700">
                {user.role}
              </span>
              <span className="text-neutral-500 truncate">
                · {roleLabel(user.role)}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
              {user.orgName}
            </div>
          </div>

          {/* Menu items */}
          <ul className="py-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-body-sm text-neutral-900 hover:bg-neutral-100"
                role="menuitem"
              >
                <User className="h-4 w-4 text-neutral-600" aria-hidden />
                {t("shell.account")}
              </button>
            </li>
            <li>
              <div className="px-4 py-2 flex items-center gap-3 text-body-sm text-neutral-900">
                <Globe className="h-4 w-4 text-neutral-600" aria-hidden />
                <span className="flex-1">{t("shell.switchLanguage")}</span>
                <div className="inline-flex overflow-hidden rounded border border-neutral-300 text-caption">
                  <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={cn(
                      "px-2 py-0.5 font-semibold",
                      locale === "en"
                        ? "bg-primary-700 text-white"
                        : "bg-white text-neutral-600",
                    )}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("am")}
                    className={cn(
                      "px-2 py-0.5 font-semibold",
                      locale === "am"
                        ? "bg-primary-700 text-white"
                        : "bg-white text-neutral-600",
                    )}
                  >
                    አማ
                  </button>
                </div>
              </div>
            </li>
          </ul>

          <div className="border-t border-neutral-300">
            <button
              type="button"
              onClick={onSignOut}
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-body-sm font-semibold text-danger hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {t("shell.signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}