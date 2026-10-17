import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // Check for updates every hour
      if (r) {
        setInterval(
          () => {
            r.update().catch(() => {});
          },
          60 * 60 * 1000,
        );
      }
    },
  });

  if (!offlineReady && !needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[100] bg-primary-900 text-white rounded-lg shadow-lg p-4 flex items-start gap-3"
    >
      <RefreshCw
        className="h-5 w-5 text-accent-500 mt-0.5 shrink-0"
        aria-hidden
      />
      <div className="flex-1">
        <p className="text-body-sm font-semibold">
          {needRefresh ? "New version available" : "App ready for offline use"}
        </p>
        <p className="text-caption opacity-80 mt-0.5">
          {needRefresh
            ? "A newer version of PIIMS is available. Reload to update."
            : "PIIMS will continue to work even without internet."}
        </p>
        <div className="flex gap-2 mt-3">
          {needRefresh && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                void updateServiceWorker(true);
              }}
            >
              Reload
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOfflineReady(false);
              setNeedRefresh(false);
            }}
            className="text-white hover:bg-white/10"
          >
            Dismiss
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setOfflineReady(false);
          setNeedRefresh(false);
        }}
        aria-label="Dismiss"
        className="text-white/60 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}