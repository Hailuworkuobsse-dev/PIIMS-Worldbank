import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Database, Play, CheckCircle2, Clock } from "lucide-react";
import { useWaveDatasets } from "./warehouse.queries";
import { useBuildWaveDataset } from "./warehouse.mutations";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { Progress } from "@/components/ui/Progress";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils/date";

export function WaveDatasetBuilder() {
  const { t } = useTranslation();
  const { data: waves } = useWaveDatasets();
  const build = useBuildWaveDataset();
  const [open, setOpen] = useState(false);
  const [waveId, setWaveId] = useState("");

  const onBuild = async () => {
    if (!waveId) return;
    await build.mutateAsync(waveId);
    setOpen(false);
    setWaveId("");
  };

  return (
    <>
      <Card>
        <CardHeader
          title={t("warehouse.builder.title")}
          subtitle={t("warehouse.builder.subtitle")}
          action={
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Play className="h-4 w-4" />}
              onClick={() => setOpen(true)}
            >
              {t("warehouse.builder.build")}
            </Button>
          }
        />

        {!waves?.length ? (
          <p className="text-body-sm text-neutral-600">
            {t("warehouse.builder.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {waves.map((w) => (
              <li key={w.datasetId} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-body-sm font-semibold">
                      <code className="text-primary-700 mr-2">
                        {w.waveCode}
                      </code>
                      {w.waveName}
                    </div>
                    <div className="text-caption text-neutral-600 mt-0.5">
                      v{w.version} · {w.recordCount.toLocaleString()} records
                      {w.buildCompletedAt &&
                        ` · built ${formatDate(w.buildCompletedAt)}`}
                    </div>
                  </div>
                  <Chip
                    tone={
                      w.status === "RELEASED"
                        ? "green"
                        : w.status === "READY"
                          ? "blue"
                          : w.status === "BUILDING"
                            ? "amber"
                            : "grey"
                    }
                  >
                    {w.status === "BUILDING" ? (
                      <Clock className="h-3 w-3" aria-hidden />
                    ) : null}
                    {w.status === "RELEASED" ? (
                      <CheckCircle2 className="h-3 w-3" aria-hidden />
                    ) : null}
                    {w.status}
                  </Chip>
                </div>
                {w.status === "BUILDING" && (
                  <Progress value={60} className="mt-2" label="Building…" />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("warehouse.builder.modalTitle")}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button
              variant="primary"
              loading={build.isPending}
              disabled={!waveId}
              onClick={onBuild}
            >
              <Database className="h-4 w-4 mr-1" aria-hidden />
              {t("warehouse.builder.build")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label={t("warehouse.builder.wave")}
            required
            placeholder="Select wave"
            value={waveId}
            onChange={(e) => setWaveId(e.target.value)}
            options={(waves ?? []).map((w) => ({
              value: w.waveId,
              label: `${w.waveCode} · ${w.waveName}`,
            }))}
          />
          <p className="text-caption text-neutral-600">
            {t("warehouse.builder.warning")}
          </p>
        </div>
      </Modal>
    </>
  );
}