import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useIdleTimeout } from "@/features/auth/useIdleTimeout";
import { IdleTimeoutWarning } from "@/features/auth/IdleTimeoutWarning";
import { SyncBadge } from "@/components/ui/SyncBadge";

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { warning, extend, forceLogout } = useIdleTimeout(!!user);

  useEffect(() => {
    // Auto-refresh token 60 s before expiry
    if (!user) return;
    const expiresAt = useAuthStore.getState().expiresAt;
    if (!expiresAt) return;
    const ms = expiresAt - Date.now() - 60_000;
    if (ms <= 0) {
      void useAuthStore.getState().refresh();
      return;
    }
    const id = window.setTimeout(() => {
      void useAuthStore.getState().refresh();
    }, ms);
    return () => window.clearTimeout(id);
  }, [user]);

  return (
    <>
      {children}
      <IdleTimeoutWarning
        open={warning}
        onExtend={extend}
        onLogout={forceLogout}
      />
      {/* Global offline badge — visible on every page when relevant */}
      {user && (
        <div className="pointer-events-none fixed bottom-4 left-4 z-40">
          <div className="pointer-events-auto">
            <SyncBadge />
          </div>
        </div>
      )}
    </>
  );
}