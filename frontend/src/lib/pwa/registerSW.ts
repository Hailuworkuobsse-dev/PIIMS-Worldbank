/**
 * Register the service worker in production only.
 * Called from `main.tsx` after mount.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[PWA] Service worker registration failed", err);
    });
  });
}