import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff, RefreshCw } from "lucide-react";
import { useSyncStore } from "@/stores/sync.store";
import { flushMutationQueue } from "@/features/projects/project.mutations";
import { Button } from "@/components/ui/Button";

export function OfflineBanner() {
  const { t } = useTranslation();
  const { online, pendingCount, markSynced } = useSyncStore();
  const [syncing, setSyncing] = useState(false);

  // Auto-sync when we come back online
  useEffect(() => {
    if (!online) return;
    void (async () => {
      setSyncing(true);
      try {
        await flushMutationQueue();
        markSynced();
      } catch {
        /* ignore */
      } finally {
        setSyncing(false);
      }
    })();
  }, [online, markSynced]);

  if (online && pendingCount === 0) return null;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await flushMutationQueue();
      markSynced();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      role="status"
      className={
        "flex items-center gap-3 px-4 py-2 text-body-sm border-b " +
        (online
          ? "bg-amber-50 text-amber-900 border-amber-200"
          : "bg-red-50 text-red-900 border-red-200")
      }
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1">
        {online
          ? t("a11y.syncPending", { count: pendingCount })
          : t("a11y.offlineBanner")}
      </span>
      {online && pendingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          loading={syncing}
          onClick={handleSync}
        >
          Sync now
        </Button>
      )}
    </div>
  );
}