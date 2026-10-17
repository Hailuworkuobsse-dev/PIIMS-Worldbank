import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { offlineStore } from "./offlineStore";
import { fieldApi } from "./field.api";
import { useSyncStore } from "@/stores/sync.store";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useToast } from "@/components/ui/Toast";

export function SyncQueue() {
  const { t } = useTranslation();
  const { push } = useToast();
  const online = useSyncStore((s) => s.online);
  const setPending = useSyncStore((s) => s.setPending);
  const markSynced = useSyncStore((s) => s.markSynced);
  const [queue, setQueue] = useState<
    { localId: string; assignmentId: string }[]
  >([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = async () => {
    const q = await offlineStore.listQueue();
    setQueue(q);
    setPending(q.length);
  };

  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (online) void refresh();
  }, [online]);

  const sync = async () => {
    setSyncing(true);
    const items = await offlineStore.listQueue();
    let ok = 0;
    for (const item of items) {
      try {
        const { localId, ...submission } = item;
        await fieldApi.submit(submission);
        await offlineStore.removeFromQueue(localId);
        ok++;
      } catch {
        /* stays in queue */
      }
    }
    await refresh();
    setSyncing(false);
    if (ok > 0) {
      markSynced();
      push("success", `Synced ${ok} interview(s)`);
    }
  };

  if (queue.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title={`Pending sync · ${queue.length}`}
        action={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            loading={syncing}
            disabled={!online}
            onClick={sync}
          >
            Sync now
          </Button>
        }
      />
      <ul className="divide-y divide-neutral-100">
        {queue.map((item) => (
          <li
            key={item.localId}
            className="py-2 flex justify-between text-body-sm"
          >
            <span className="text-neutral-600">
              Assignment {item.assignmentId.slice(0, 8)}…
            </span>
            <Chip tone="amber">Pending</Chip>
          </li>
        ))}
      </ul>
      {!online && (
        <p className="text-caption text-neutral-600 mt-2">
          Will sync automatically when online.
        </p>
      )}
    </Card>
  );
}