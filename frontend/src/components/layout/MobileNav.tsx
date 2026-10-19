import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, FolderKanban, Menu as MenuIcon, X, TrendingUp, Users, Search } from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { BrandMark } from "@/components/brand/BrandMark";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { MENU, MENU_SECTIONS } from "./menu.config";
import { cn } from "@/components/ui/utils/cn";

export function MobileNav() {
  const { t } = useTranslation();
  const { canAny } = usePermissions();
  const location = useLocation();
  const { mobileNavOpen, setMobileNavOpen, setSearchOpen } = useUIStore();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, setMobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen, setMobileNavOpen]);

  const filterMenu = (items: typeof MENU) =>
    items
      .filter((i) => !i.anyOf || canAny(...i.anyOf))
      .map((i) => ({
        ...i,
        children: i.children?.filter((c) => !c.anyOf || canAny(...c.anyOf)),
      }));

  const filtered = filterMenu(MENU);
  const grouped = MENU_SECTIONS.map((s) => ({
    ...s,
    items: filtered.filter((i) => i.section === s.id),
  })).filter((s) => s.items.length > 0);

  return (
    <>
      {/* Bottom nav */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-300 pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5">
          <BottomItem
            to="/dashboard"
            label={t("nav.dashboard")}
            icon={LayoutDashboard}
          />
          <BottomItem
            to="/projects"
            label={t("nav.projects")}
            icon={FolderKanban}
            disabled={!canAny(PERMISSIONS.projectRead)}
          />
          <li>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-full flex flex-col items-center justify-center py-2 text-neutral-600 hover:text-primary-700"
              aria-label={t("shell.searchHint")}
            >
              <Search className="h-5 w-5" aria-hidden />
              <span className="text-[10px] font-semibold mt-0.5">Search</span>
            </button>
          </li>
          <BottomItem
            to="/impact"
            label={t("nav.impact")}
            icon={TrendingUp}
            disabled={
              !canAny(
                PERMISSIONS.impactIndicatorRead,
                PERMISSIONS.impactAnalyticsRead,
              )
            }
          />
          <li>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="w-full flex flex-col items-center justify-center py-2 text-neutral-600 hover:text-primary-700"
              aria-label={t("shell.openMenu")}
              aria-expanded={mobileNavOpen}
            >
              <MenuIcon className="h-5 w-5" aria-hidden />
              <span className="text-[10px] font-semibold mt-0.5">More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Drawer */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-neutral-900/55"
          role="presentation"
          onClick={(e) => {
            // close only when the backdrop itself is clicked
            if (e.target === e.currentTarget) setMobileNavOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              // document-level listener also handles Escape — avoid double-calling
              e.stopPropagation();
              setMobileNavOpen(false);
            }
          }}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[88vw] max-w-sm bg-white shadow-lg flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={t("shell.openMenu")}
          >
            <header className="flex items-center justify-between px-4 h-14 border-b border-neutral-300">
              <span className="flex items-center gap-2.5">
                <BrandMark className="h-8 w-8" />
                <span className="text-h3 text-primary-900">PIIMS</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label={t("shell.closeMenu")}
                className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <nav className="flex-1 overflow-y-auto py-3">
              {grouped.map((section) => (
                <div key={section.id} className="mb-2">
                  <div className="px-4 pt-3 pb-1 text-[10px] font-extrabold tracking-widest text-neutral-500 uppercase">
                    {section.label}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-body-sm font-semibold",
                              isActive
                                ? "bg-primary-100 text-primary-700"
                                : "text-neutral-900 hover:bg-neutral-100",
                            )
                          }
                        >
                          {Icon && (
                            <Icon className="h-4 w-4 shrink-0" aria-hidden />
                          )}
                          <span className="flex-1">{t(item.label)}</span>
                        </NavLink>
                        {item.children?.map((c) => (
                          <NavLink
                            key={c.id}
                            to={c.to}
                            className={({ isActive }) =>
                              cn(
                                "block pl-12 pr-3 py-1.5 mx-2 rounded-md text-caption",
                                isActive
                                  ? "text-primary-700 font-semibold"
                                  : "text-neutral-600 hover:bg-neutral-100",
                              )
                            }
                          >
                            {t(c.label)}
                          </NavLink>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function BottomItem({
  to,
  label,
  icon: Icon,
  disabled,
}: {
  to: string;
  label: string;
  icon: typeof Users;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <li>
        <div className="w-full flex flex-col items-center justify-center py-2 text-neutral-300">
          <Icon className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-semibold mt-0.5">{label}</span>
        </div>
      </li>
    );
  }
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            "w-full flex flex-col items-center justify-center py-2",
            isActive
              ? "text-primary-700"
              : "text-neutral-600 hover:text-primary-700",
          )
        }
      >
        <Icon className="h-5 w-5" aria-hidden />
        <span className="text-[10px] font-semibold mt-0.5">{label}</span>
      </NavLink>
    </li>
  );
}