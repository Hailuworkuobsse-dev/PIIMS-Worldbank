import { useEffect, useReducer } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useKeyboardShortcuts } from "@/features/auth/useKeyboardShortcut";
import { useUIStore } from "@/stores/ui.store";
import { useSyncStore } from "@/stores/sync.store";
import { useAuthStore } from "@/stores/auth.store";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { usePermissions } from "@/features/auth/usePermissions";

import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";
import { MobileNav } from "./MobileNav";
import { GlobalSearch } from "./GlobalSearch";
import { KeyboardHelp } from "./KeyboardHelp";
import { RouteProgress } from "./RouteProgress";
import { Breadcrumbs } from "./Breadcrumbs";
import { Banner } from "@/components/ui/Banner";

export function AppShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setSearchOpen, setKeyboardHelpOpen } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const { can } = usePermissions();

  /* Route-transition focus management: move focus to <main> on nav */
  useEffect(() => {
    const main = document.getElementById("main");
    if (main) {
      main.focus({ preventScroll: true });
    }
    // Scroll content to top on navigation
    const scroller = document.getElementById("main-scroll");
    if (scroller) scroller.scrollTop = 0;
  }, [location.pathname]);

  /* Global keyboard shortcuts */
  useKeyboardShortcuts([
    {
      keys: ["k"],
      modifiers: { ctrl: true },
      handler: () => setSearchOpen(true),
      ignoreInInput: false,
      description: t("shell.shortcuts.openSearch"),
    },
    {
      keys: ["k"],
      modifiers: { meta: true },
      handler: () => setSearchOpen(true),
      ignoreInInput: false,
      description: t("shell.shortcuts.openSearch"),
    },
    {
      keys: ["/"],
      handler: () => setSearchOpen(true),
      ignoreInInput: true,
      description: t("shell.shortcuts.focusSearch"),
    },
    {
      keys: ["g", "d"],
      handler: () => navigate("/dashboard"),
      ignoreInInput: true,
      description: t("shell.shortcuts.goDashboard"),
    },
    {
      keys: ["g", "p"],
      handler: () => {
        if (can(PERMISSIONS.projectRead)) navigate("/projects");
      },
      ignoreInInput: true,
      description: t("shell.shortcuts.goProjects"),
    },
    {
      keys: ["g", "i"],
      handler: () => {
        if (
          can(PERMISSIONS.impactIndicatorRead) ||
          can(PERMISSIONS.impactAnalyticsRead)
        )
          navigate("/impact");
      },
      ignoreInInput: true,
      description: t("shell.shortcuts.goImpact"),
    },
    {
      keys: ["?"],
      handler: () => setKeyboardHelpOpen(true),
      ignoreInInput: true,
      description: t("shell.shortcuts.showHelp"),
    },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <RouteProgress />

      <TopBar />

      {/* Offline banner — appears when browser goes offline */}
      <OfflineBanner />

      <div className="flex-1 flex min-h-0">
        <SideNav />

        <main
          id="main"
          tabIndex={-1}
          className="flex-1 flex flex-col min-w-0 focus:outline-none"
        >
          {/* Breadcrumb strip */}
          <div className="border-b border-neutral-200 bg-white/60 backdrop-blur-sm">
            <div className="px-4 md:px-6 py-2">
              <Breadcrumbs />
            </div>
          </div>

          {/* Scrollable content */}
          <div
            id="main-scroll"
            className="flex-1 overflow-y-auto pb-24 md:pb-8"
          >
            <div className="px-4 md:px-6 py-4 max-w-[1600px] mx-auto w-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav + drawer */}
      <MobileNav />

      {/* Overlays */}
      <GlobalSearch />
      <KeyboardHelp />

      {/* Greeting hidden region for screen readers on login */}
      {user && (
        <div aria-live="polite" className="sr-only">
          Signed in as {user.fullName}, {user.role}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Offline banner
 * ------------------------------------------------------------------------- */
function OfflineBanner() {
  const { t } = useTranslation();
  const online = useSyncStoreOnline();

  if (online) return null;
  return (
    <Banner tone="warning" className="rounded-none border-x-0 border-t-0">
      {t("a11y.offlineBanner")}
    </Banner>
  );
}

function useSyncStoreOnline() {
  // Zustand subscription keeps `online` fresh; the window listeners below are
  // a belt-and-braces re-render trigger for edge cases (e.g. tab restore).
  const online = useSyncStore((s) => s.online);
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const on = () => force();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  return online && navigator.onLine;
}