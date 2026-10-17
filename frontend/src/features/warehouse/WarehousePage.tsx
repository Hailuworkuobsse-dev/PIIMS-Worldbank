import { useTranslation } from "react-i18next";
import { Plus, Database, Users } from "lucide-react";
import { useWaveDatasets, usePanelLinks } from "./warehouse.queries";
import { useBuildWaveDataset } from "./warehouse.mutations";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { KPITile } from "@/components/ui/KPITile";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils/date";

export default function WarehousePage() {
  const { t } = useTranslation();
  const { data: waves, isLoading } = useWaveDatasets();
  const { data: panels } = usePanelLinks();
  const build = useBuildWaveDataset();

  if (isLoading) return <LoadingState />;

  const totalPanelMembers = panels?.length ?? 0;
  const activeMembers = panels?.filter((p) => !p.attritionWave).length ?? 0;
  const attrition =
    totalPanelMembers > 0
      ? ((totalPanelMembers - activeMembers) / totalPanelMembers) * 100
      : 0;

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header>
        <h1 className="text-h1 text-primary-900">{t("warehouse.title")}</h1>
        <p className="text-body-sm text-neutral-600 mt-1">
          {t("warehouse.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile
          label="Panel members"
          value={totalPanelMembers.toLocaleString()}
        />
        <KPITile
          label="Active"
          value={activeMembers.toLocaleString()}
          tone="success"
        />
        <KPITile
          label="Attrition"
          value={`${attrition.toFixed(1)}%`}
          tone={attrition > 15 ? "danger" : "warning"}
        />
        <KPITile
          label="Waves"
          value={String(waves?.length ?? 0)}
          tone="accent"
        />
      </div>

      <Card>
        <CardHeader
          title="Wave datasets"
          subtitle="Immutable, versioned extracts ready for analysis"
          action={
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                const wave = prompt("Wave ID?");
                if (wave) build.mutate(wave);
              }}
            >
              Build dataset
            </Button>
          }
        />
        {!waves?.length ? (
          <EmptyState
            title="No wave datasets"
            description="Build the first dataset to begin."
          />
        ) : (
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left">
                <th className="py-2 text-caption uppercase text-neutral-600">
                  Wave
                </th>
                <th className="py-2 text-caption uppercase text-neutral-600">
                  Version
                </th>
                <th className="py-2 text-right text-caption uppercase text-neutral-600">
                  Records
                </th>
                <th className="py-2 text-caption uppercase text-neutral-600">
                  Built
                </th>
                <th className="py-2 text-caption uppercase text-neutral-600">
                  Status
                </th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {waves.map((w) => (
                <tr key={w.datasetId} className="border-b border-neutral-100">
                  <td className="py-2 font-semibold">
                    <code className="text-primary-700">{w.waveCode}</code> ·{" "}
                    {w.waveName}
                  </td>
                  <td className="py-2">v{w.version}</td>
                  <td className="py-2 text-right">
                    {w.recordCount.toLocaleString()}
                  </td>
                  <td className="py-2 text-caption">
                    {formatDate(w.buildStartedAt)}
                  </td>
                  <td className="py-2">
                    <Chip
                      tone={
                        w.status === "RELEASED"
                          ? "green"
                          : w.status === "READY"
                            ? "blue"
                            : "amber"
                      }
                    >
                      {w.status}
                    </Chip>
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Database className="h-3.5 w-3.5" />}
                    >
                      Anonymize
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" aria-hidden /> Panel linking
            </span>
          }
          subtitle="Stable panel IDs tracked across waves"
        />
        {!panels?.length ? (
          <EmptyState title="No panel links yet" />
        ) : (
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left">
                <th className="py-2 text-caption uppercase text-neutral-600">
                  Panel ID
                </th>
                <th className="py-2 text-caption uppercase text-neutral-600">
                  Treatment group
                </th>
                <th className="py-2 text-caption uppercase text-neutral-600">
                  Waves present
                </th>
                <th className="py-2 text-caption uppercase text-neutral-600">
                  Attrition
                </th>
              </tr>
            </thead>
            <tbody>
              {panels.slice(0, 20).map((p) => (
                <tr key={p.panelId} className="border-b border-neutral-100">
                  <td className="py-2">
                    <code>{p.panelId.slice(0, 10)}…</code>
                  </td>
                  <td className="py-2">{p.treatmentGroupName}</td>
                  <td className="py-2">{p.wavesPresent.join(", ")}</td>
                  <td className="py-2">
                    {p.attritionWave ? (
                      <Chip tone="red">{p.attritionWave}</Chip>
                    ) : (
                      <Chip tone="green">Active</Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </main>
  );
}