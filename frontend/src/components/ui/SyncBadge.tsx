import { Wifi, WifiOff, CloudUpload } from "lucide-react";
import { useSyncStore } from "@/stores/sync.store";
import { useTranslation } from "react-i18next";
import { cn } from "./utils/cn";

export function SyncBadge() {
  const { t } = useTranslation();
  const { online, pendingCount } = useSyncStore();

  if (pendingCount > 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-bold",
          online
            ? "bg-amber-100 text-amber-800"
            : "bg-slate-200 text-slate-700",
        )}
      >
        <CloudUpload className="h-3.5 w-3.5" aria-hidden />
        {t("a11y.syncPending", { count: pendingCount })}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-bold",
        online ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
      )}
    >
      {online ? (
        <Wifi className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <WifiOff className="h-3.5 w-3.5" aria-hidden />
      )}
      {online ? "Online" : "Offline"}
    </span>
  );
}