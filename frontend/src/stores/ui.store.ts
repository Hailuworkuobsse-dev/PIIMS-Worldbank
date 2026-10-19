import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/app/config";

interface UIState {
  sidebarCollapsed: boolean;
  locale: Locale;
  mobileNavOpen: boolean;
  searchOpen: boolean;
  keyboardHelpOpen: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setLocale: (l: Locale) => void;
  setMobileNavOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setKeyboardHelpOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      locale: "en",
      mobileNavOpen: false,
      searchOpen: false,
      keyboardHelpOpen: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setLocale: (locale) => set({ locale }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setKeyboardHelpOpen: (keyboardHelpOpen) => set({ keyboardHelpOpen }),
    }),
    {
      name: "piims.ui",
      // Only persist these two
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        locale: s.locale,
      }),
    },
  ),
);