import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type RoleCode =
  | "NA"
  | "MW-PIU"
  | "MW-ME"
  | "MW-IE"
  | "MW-DM"
  | "MW-QA"
  | "MW-FO"
  | "MW-TL"
  | "MW-PM"
  | "MF-BO"
  | "MF-FM"
  | "MF-AUD"
  | "DB-LO"
  | "DB-DO"
  | "DB-PM"
  | "DB-AUD"
  | "WB-TTL"
  | "WB-IE"
  | "WB-FM"
  | "WB-PROC"
  | "WB-ES"
  | "WB-M&E"
  | "SP-AD"
  | "SP-OPS"
  | "SP-SVC"
  | "LG-RO"
  | "LG-ZO"
  | "LG-WO"
  | "LG-KO"
  | "DC-EN"
  | "DC-SV"
  | "RS-EX"
  | "AU-EX"
  | "AU-EV"
  | "SC-MB"
  | "BN-SR"
  | "BN-REP";

export interface AuthUser {
  userId: string;
  username: string;
  fullName: string;
  orgId: string;
  role: RoleCode;
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  login: (username: string, password: string, mfa?: string) => Promise<void>;
  refresh: () => Promise<boolean>;
  logout: () => void;
  has: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      async login(username, password, mfa) {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL ?? ""}/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, mfa_code: mfa }),
          },
        );
        if (!res.ok) throw new Error("Login failed");
        const { data } = await res.json();
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        });
      },
      async refresh() {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL ?? ""}/auth/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh_token: refreshToken }),
            },
          );
          if (!res.ok) return false;
          const { data } = await res.json();
          set({
            accessToken: data.access_token,
            expiresAt: Date.now() + data.expires_in * 1000,
          });
          return true;
        } catch {
          return false;
        }
      },
      logout() {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        });
      },
      has(permission) {
        return get().user?.permissions.includes(permission) ?? false;
      },
    }),
    {
      name: "piims.auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        refreshToken: s.refreshToken,
        accessToken: s.accessToken,
        expiresAt: s.expiresAt,
      }),
    },
  ),
);