import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useImpactDashboard } from "./analytics.queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { KPITile } from "@/components/ui/KPITile";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { WaveComparisonChart } from "./WaveComparisonChart";
import { TreatmentVsControl } from "./TreatmentVsControl";
import { formatDate } from "@/lib/utils/date";

export default function ImpactDashboardPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const projectId = params.get("projectId") ?? "PIIMS-2026-0042";
  const { data, isLoading } = useImpactDashboard(projectId);

  if (isLoading) return <LoadingState message="Loading impact dashboard…" />;
  if (!data) return <EmptyState title="No impact data yet" />;

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header>
        <div className="text-caption text-neutral-600">
          <code className="text-primary-700 font-bold">{data.projectCode}</code>
        </div>
        <h1 className="text-h1 text-primary-900 mt-1">{data.projectName}</h1>
        <div className="flex items-center gap-2 mt-2">
          {data.waves.map((w) => (
            <Chip
              key={w.waveCode}
              tone={w.waveCode === "W2" ? "green" : "blue"}
            >
              {w.waveCode} · {w.waveName}
            </Chip>
          ))}
          <span className="text-caption text-neutral-500 ml-2">
            Last updated {formatDate(data.lastUpdated)}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.headlineIndicators.slice(0, 4).map((ind) => {
          const baseline = ind.waves[0];
          const endline = ind.waves[ind.waves.length - 1];
          const change =
            baseline && endline && baseline.mean !== 0
              ? ((endline.mean - baseline.mean) / baseline.mean) * 100
              : 0;
          return (
            <KPITile
              key={ind.indicatorId}
              label={ind.indicatorName}
              value={endline ? `${endline.mean.toFixed(0)} ${ind.unit}` : "—"}
              delta={{
                value: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
                direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
              }}
              tone={change > 0 ? "success" : change < 0 ? "danger" : "default"}
            />
          );
        })}
      </div>

      <Card>
        <CardHeader
          title="Wave trajectory"
          subtitle="Mean values across waves"
        />
        <WaveComparisonChart indicators={data.headlineIndicators} />
      </Card>

      <TreatmentVsControl projectId={projectId} />
    </main>
  );
}