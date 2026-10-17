import { useTranslation } from "react-i18next";
import { RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useFmisRuns } from "./financial.queries";
import { useTriggerFmisSync } from "./financial.mutations";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/LoadingState";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { formatDate } from "@/lib/utils/date";
import type { FmisSyncRun } from "./financial.types";

export default function FmisSyncPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data, isLoading } = useFmisRuns();
  const trigger = useTriggerFmisSync();

  if (isLoading) return <LoadingState message="Loading FMIS sync status…" />;

  const latest = data?.[0];
  const healthy = latest?.status === "SUCCESS";

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">
            {t("financial.fmis.title")}
          </h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {t("financial.fmis.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            tone={
              healthy ? "green" : latest?.status === "FAILED" ? "red" : "amber"
            }
          >
            {healthy ? "🟢 Healthy" : (latest?.status ?? "Unknown")}
          </Chip>
          {can(PERMISSIONS.financeReconcile) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={trigger.isPending}
              onClick={() => trigger.mutate("EXPENDITURE")}
            >
              {t("financial.fmis.syncNow")}
            </Button>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader title={t("financial.fmis.lastSync")} />
          <div className="text-body-sm space-y-1">
            <Row label="Kind" value={latest?.kind ?? "—"} />
            <Row
              label="Started"
              value={latest?.startedAt ? formatDate(latest.startedAt) : "—"}
            />
            <Row
              label="Duration"
              value={
                latest?.durationMs
                  ? `${(latest.durationMs / 1000).toFixed(1)} s`
                  : "—"
              }
            />
            <Row
              label="Processed"
              value={String(latest?.recordsProcessed ?? 0)}
            />
            <Row label="Failed" value={String(latest?.recordsFailed ?? 0)} />
          </div>
        </Card>

        <Card>
          <CardHeader title={t("financial.fmis.schedule")} />
          <ul className="text-body-sm space-y-2">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-600" /> Appropriation ·
              nightly 02:00
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-600" /> Release · nightly
              02:05
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-600" /> Expenditure ·
              nightly 02:15
            </li>
          </ul>
        </Card>

        <Card>
          <CardHeader title={t("financial.fmis.actions")} />
          <div className="space-y-2">
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              onClick={() => trigger.mutate("APPROPRIATION")}
            >
              Sync appropriations
            </Button>
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              onClick={() => trigger.mutate("RELEASE")}
            >
              Sync releases
            </Button>
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              onClick={() => trigger.mutate("EXPENDITURE")}
            >
              Sync expenditures
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title={t("financial.fmis.history")} />
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left">
              <th className="py-2 text-caption font-bold uppercase text-neutral-600">
                Kind
              </th>
              <th className="py-2 text-caption font-bold uppercase text-neutral-600">
                Started
              </th>
              <th className="py-2 text-caption font-bold uppercase text-neutral-600">
                Duration
              </th>
              <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
                Records
              </th>
              <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
                Errors
              </th>
              <th className="py-2 text-caption font-bold uppercase text-neutral-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <RunRow key={r.runId} run={r} />
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function RunRow({ run }: { run: FmisSyncRun }) {
  const tone =
    run.status === "SUCCESS"
      ? "green"
      : run.status === "FAILED"
        ? "red"
        : run.status === "PARTIAL"
          ? "amber"
          : "blue";
  return (
    <tr className="border-b border-neutral-100">
      <td className="py-2 font-semibold">{run.kind}</td>
      <td className="py-2">{new Date(run.startedAt).toLocaleString()}</td>
      <td className="py-2">
        {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)} s` : "—"}
      </td>
      <td className="py-2 text-right">{run.recordsProcessed}</td>
      <td className="py-2 text-right">{run.recordsFailed}</td>
      <td className="py-2">
        <Chip tone={tone}>
          {run.status === "SUCCESS" && (
            <CheckCircle2 className="h-3 w-3" aria-hidden />
          )}
          {run.status === "FAILED" && (
            <AlertTriangle className="h-3 w-3" aria-hidden />
          )}
          {run.status}
        </Chip>
      </td>
    </tr>
  );
}