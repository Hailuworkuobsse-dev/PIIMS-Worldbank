import { useEffect, useRef, useState } from "react";
import { APP_CONFIG } from "@/app/config";
import { useAuthStore } from "@/stores/auth.store";

const WARN_BEFORE_MS = 2 * 60 * 1000;

export function useIdleTimeout(enabled: boolean) {
  const logout = useAuthStore((s) => s.logout);
  const [warning, setWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const warnTimer = useRef<number | null>(null);
  const outTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const clearTimers = () => {
      if (warnTimer.current) window.clearTimeout(warnTimer.current);
      if (outTimer.current) window.clearTimeout(outTimer.current);
      warnTimer.current = null;
      outTimer.current = null;
    };

    const schedule = () => {
      clearTimers();
      warnTimer.current = window.setTimeout(
        () => setWarning(true),
        APP_CONFIG.idleTimeoutMs - WARN_BEFORE_MS,
      );
      outTimer.current = window.setTimeout(() => {
        setWarning(false);
        logout({ silent: false });
      }, APP_CONFIG.idleTimeoutMs);
    };

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (warning) return; // don't restart while warning is visible — user must explicitly extend
      schedule();
    };

    const events: (keyof DocumentEventMap)[] = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "visibilitychange",
    ];
    events.forEach((e) =>
      document.addEventListener(e, onActivity, { passive: true }),
    );

    schedule();

    return () => {
      events.forEach((e) => document.removeEventListener(e, onActivity));
      clearTimers();
    };
  }, [enabled, logout, warning]);

  const extend = () => {
    setWarning(false);
    lastActivityRef.current = Date.now();
  };

  const forceLogout = () => {
    setWarning(false);
    logout({ silent: false });
  };

  return { warning, extend, forceLogout };
}