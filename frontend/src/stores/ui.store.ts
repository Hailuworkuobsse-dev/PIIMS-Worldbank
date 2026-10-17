import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/app/config";

interface UIState {
  sidebarCollapsed: boolean;
  locale: Locale;
  setSidebarCollapsed: (v: boolean) => void;
  setLocale: (l: Locale) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      locale: "en",
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setLocale: (locale) => set({ locale }),
    }),
    { name: "piims.ui" },
  ),
);