import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/app/config";

interface UIState {
  sidebarCollapsed: boolean;
  locale: Locale;
  mobileNavOpen: boolean;
  searchOpen: boolean;
  keyboardHelpOpen: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
  setLocale: (locale: Locale) => void;
  setMobileNavOpen: (value: boolean) => void;
  setSearchOpen: (value: boolean) => void;
  setKeyboardHelpOpen: (value: boolean) => void;
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
      // Only persist preferences, not transient open/closed UI state.
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        locale: state.locale,
      }),
    },
  ),
);
