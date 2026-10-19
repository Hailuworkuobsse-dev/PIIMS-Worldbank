import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "@/features/auth/auth.api";
import { roleHome, type AuthUser, type LoginRequest, type Permission } from "@/features/auth/auth.types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // access token expiry (epoch ms)
  refreshExpiresAt: number | null;
  hydrated: boolean;
  refreshing: Promise<boolean> | null; // single-flight guard

  login: (
    req: LoginRequest,
  ) => Promise<{ mfaRequired: boolean; mfaToken?: string }>;
  completeMFA: (
    mfaToken: string,
    code: string,
    remember?: boolean,
  ) => Promise<void>;
  setSession: (
    u: AuthUser,
    access: string,
    refresh: string,
    expiresIn: number,
    refreshExpiresIn: number,
  ) => void;
  refresh: () => Promise<boolean>;
  logout: (opts?: { silent?: boolean; broadcast?: boolean }) => void;
  has: (p: Permission) => boolean;
  homeRoute: () => string;
}

/* ---- Cross-tab broadcast ---- */
const AUTH_CHANNEL = "piims.auth";
const bc: BroadcastChannel | null =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(AUTH_CHANNEL)
    : null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      refreshExpiresAt: null,
      hydrated: false,
      refreshing: null,

      async login(req) {
        const res = await authApi.login(req);
        if (res.mfa_required && res.mfa_token) {
          return { mfaRequired: true, mfaToken: res.mfa_token };
        }
        get().setSession(
          res.user,
          res.access_token,
          res.refresh_token,
          res.expires_in,
          res.refresh_expires_in,
        );
        return { mfaRequired: false };
      },

      async completeMFA(mfaToken, code, remember) {
        const res = await authApi.completeMFA({
          mfa_token: mfaToken,
          mfa_code: code,
          remember_device: remember,
        });
        get().setSession(
          res.user,
          res.access_token,
          res.refresh_token,
          res.expires_in,
          res.refresh_expires_in,
        );
      },

      setSession(user, access, refresh, expiresIn, refreshExpiresIn) {
        const now = Date.now();
        set({
          user,
          accessToken: access,
          refreshToken: refresh,
          expiresAt: now + expiresIn * 1000,
          refreshExpiresAt: now + refreshExpiresIn * 1000,
        });
        bc?.postMessage({ type: "session:set", userId: user.userId, at: now });
      },

      async refresh() {
        const state = get();
        if (state.refreshing) return state.refreshing;
        if (!state.refreshToken) return false;

        const promise = (async () => {
          try {
            const res = await authApi.refresh(state.refreshToken!);
            set({
              accessToken: res.access_token,
              expiresAt: Date.now() + res.expires_in * 1000,
            });
            return true;
          } catch {
            return false;
          } finally {
            set({ refreshing: null });
          }
        })();
        set({ refreshing: promise });
        return promise;
      },

      logout(opts = {}) {
        const { refreshToken } = get();
        if (refreshToken && !opts.silent) {
          // Fire-and-forget server-side revocation
          authApi.logout(refreshToken).catch(() => {
            /* ignore */
          });
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          refreshExpiresAt: null,
        });
        if (opts.broadcast !== false) {
          bc?.postMessage({ type: "session:clear", at: Date.now() });
        }
      },

      has(p) {
        const u = get().user;
        if (!u) return false;
        return u.permissions.includes(p);
      },

      homeRoute() {
        const u = get().user;
        return u ? roleHome(u.role) : "/login";
      },
    }),
    {
      name: "piims.auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        expiresAt: s.expiresAt,
        refreshExpiresAt: s.refreshExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.hydrated) {
          useAuthStore.setState({ hydrated: true });
        }
      },
    },
  ),
);

/* Cross-tab message handling */
bc?.addEventListener("message", (ev) => {
  const msg = ev.data;
  if (msg?.type === "session:clear") {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      refreshExpiresAt: null,
    });
  }
  if (
    msg?.type === "session:set" &&
    msg.userId !== useAuthStore.getState().user?.userId
  ) {
    // Another tab logged in as a different user → force reload to sync
    window.location.reload();
  }
});

/* Expose for tests & debugging */
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__authStore = useAuthStore;
}