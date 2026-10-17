import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { MENU, MENU_SECTIONS, type MenuItem } from "./menu.config";
import { usePermissions } from "@/features/auth/usePermissions";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/components/ui/utils/cn";

export function SideNav() {
  const { t } = useTranslation();
  const { canAny } = usePermissions();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  // Filter menu by permission
  const filtered = MENU.filter(
    (item) => !item.anyOf || canAny(...item.anyOf),
  ).map((item) => ({
    ...item,
    children: item.children?.filter((c) => !c.anyOf || canAny(...c.anyOf)),
  }));

  const grouped = MENU_SECTIONS.map((s) => ({
    ...s,
    items: filtered.filter((i) => i.section === s.id),
  })).filter((s) => s.items.length > 0);

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "hidden md:flex flex-col shrink-0 bg-white border-r border-neutral-300 overflow-hidden",
        sidebarCollapsed ? "w-[68px]" : "w-[240px]",
        "transition-[width] duration-150",
      )}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end px-3 h-11 border-b border-neutral-200">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={
            sidebarCollapsed
              ? t("shell.expandSidebar")
              : t("shell.collapseSidebar")
          }
          className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {grouped.map((section) => (
          <div key={section.id} className="mb-2">
            {!sidebarCollapsed && (
              <div className="px-4 pt-3 pb-1 text-[10.5px] font-extrabold tracking-[0.14em] text-neutral-500 uppercase">
                {section.label}
              </div>
            )}
            {section.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                currentPath={location.pathname}
                collapsed={sidebarCollapsed}
              />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function NavItem({
  item,
  currentPath,
  collapsed,
}: {
  item: MenuItem;
  currentPath: string;
  collapsed: boolean;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;

  const inPath = (p: string) =>
    currentPath === p || currentPath.startsWith(p + "/");

  const isChildActive = item.children?.some((c) => inPath(c.to)) ?? false;
  const hasChildren = (item.children?.length ?? 0) > 0;
  const isParentActive = inPath(item.to) || isChildActive;

  const [open, setOpen] = useState(isParentActive);

  // Auto-open when route is inside
  // (handled by initial state above; re-render on path change will keep it)
  const key = `${currentPath}-${item.id}`;
  // We use a ref-free approach: derive open from active when path changes
  const shouldBeOpen = isParentActive || open;
  void key;

  /* Parent link */
  const parentLink = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-body-sm font-semibold transition-colors",
          "border-l-[3px] border-transparent",
          isActive || isParentActive
            ? "bg-primary-100 text-primary-700 border-l-primary-700"
            : "text-neutral-900 hover:bg-neutral-100",
          collapsed && "justify-center px-2",
        )
      }
      aria-current={isParentActive ? "page" : undefined}
      end={item.to === "/dashboard"}
    >
      {Icon && <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />}
      {!collapsed && <span className="truncate flex-1">{t(item.label)}</span>}
      {!collapsed && hasChildren && (
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            shouldBeOpen && "rotate-180",
          )}
          aria-hidden
        />
      )}
    </NavLink>
  );

  if (!hasChildren || collapsed) return parentLink;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={shouldBeOpen}
        className={cn(
          "w-full flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-body-sm font-semibold",
          "border-l-[3px] border-transparent transition-colors text-left",
          isParentActive || shouldBeOpen
            ? "text-primary-700"
            : "text-neutral-900 hover:bg-neutral-100",
        )}
        style={{ width: "calc(100% - 16px)" }}
      >
        {Icon && <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />}
        <span className="truncate flex-1">{t(item.label)}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            shouldBeOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {shouldBeOpen && (
        <ul className="mt-0.5 mb-1">
          {item.children!.map((c) => {
            const active = inPath(c.to);
            return (
              <li key={c.id}>
                <NavLink
                  to={c.to}
                  end={c.to === item.to}
                  className={cn(
                    "block pl-[52px] pr-3 py-1.5 mx-2 rounded-md text-caption transition-colors",
                    active
                      ? "bg-primary-100 text-primary-700 font-semibold"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {t(c.label)}
                </NavLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}