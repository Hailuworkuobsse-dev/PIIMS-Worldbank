import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  FileSpreadsheet,
  FileDown,
  PlayCircle,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  useReportCatalogue,
  useReportInstances,
  useReportSchedules,
} from "./report.queries";
import { useGenerateReport, useDeleteSchedule } from "./report.mutations";
import { reportApi } from "./report.api";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils/date";
import type { ReportDefinition, ReportType } from "./report.types";
import { ReportGenerateModal } from "./ReportGenerateModal";
import { ScheduleModal } from "./ScheduleModal";

const FREQ_TONE: Record<ReportDefinition["frequency"], any> = {
  MONTHLY: "blue",
  QUARTERLY: "blue",
  SEMI_ANNUAL: "blue",
  ANNUAL: "teal",
  ON_DEMAND: "grey",
};

export default function ReportsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { push } = useToast();
  const { data: catalogue, isLoading } = useReportCatalogue();
  const { data: instances, refetch: refetchInstances } = useReportInstances();
  const { data: schedules, refetch: refetchSchedules } = useReportSchedules();
  const deleteSchedule = useDeleteSchedule();
  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [scheduling, setScheduling] = useState<ReportType | null>(null);

  const download = async (instanceId: string) => {
    try {
      const { url } = await reportApi.download(instanceId);
      window.open(url, "_blank", "noopener");
    } catch {
      push("error", "Download failed");
    }
  };

  const exportWB = async () => {
    const period = prompt("Reporting period (e.g. Q3-2026)?");
    if (!period) return;
    try {
      const { url } = await reportApi.exportWB(period);
      window.open(url, "_blank", "noopener");
      push("success", "ISR export ready");
    } catch {
      push("error", "WB export failed");
    }
  };

  if (isLoading || !catalogue)
    return <LoadingState message="Loading reports…" />;

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("reports.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {t("reports.subtitle")}
          </p>
        </div>
        {can(PERMISSIONS.reportWBExport) && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={exportWB}
          >
            {t("reports.exportWB")}
          </Button>
        )}
      </header>

      <Tabs
        tabs={[
          {
            id: "catalogue",
            label: t("reports.tabs.catalogue"),
            content: (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catalogue.map((r) => (
                  <Card key={r.code} hoverable>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <code className="text-caption font-bold text-primary-700">
                          {r.code}
                        </code>
                        <div className="text-body-sm font-semibold mt-1">
                          {r.name}
                        </div>
                      </div>
                      <Chip tone={FREQ_TONE[r.frequency]}>{r.frequency}</Chip>
                    </div>
                    <p className="text-caption text-neutral-600 mb-3">
                      {r.description}
                    </p>
                    <div className="text-caption text-neutral-500 mb-3">
                      Formats: {r.formats.join(", ")}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        fullWidth
                        leftIcon={<PlayCircle className="h-3.5 w-3.5" />}
                        onClick={() => setGenerating(r.code)}
                        disabled={!can(PERMISSIONS.reportGenerate)}
                      >
                        {t("reports.generate")}
                      </Button>
                      {can(PERMISSIONS.reportSchedule) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setScheduling(r.code)}
                        >
                          Schedule
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            id: "instances",
            label: t("reports.tabs.instances"),
            content: (
              <Card>
                <CardHeader
                  title="Recent reports"
                  action={
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      onClick={() => refetchInstances()}
                    >
                      Refresh
                    </Button>
                  }
                />
                {!instances?.length ? (
                  <EmptyState
                    title="No reports generated yet"
                    description="Generate your first report from the catalogue."
                  />
                ) : (
                  <table className="w-full text-body-sm">
                    <thead>
                      <tr className="border-b border-neutral-300 text-left">
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Report
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Period
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Format
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Generated
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Status
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {instances.map((inst) => (
                        <tr
                          key={inst.instanceId}
                          className="border-b border-neutral-100"
                        >
                          <td className="py-2 font-semibold">
                            <code className="text-caption text-primary-700">
                              {inst.reportCode}
                            </code>
                          </td>
                          <td className="py-2 text-caption">
                            {inst.period ?? "—"}
                          </td>
                          <td className="py-2 text-caption">{inst.format}</td>
                          <td className="py-2 text-caption">
                            {inst.generatedAt
                              ? formatDate(inst.generatedAt)
                              : "—"}
                          </td>
                          <td className="py-2">
                            <Chip
                              tone={
                                inst.status === "READY"
                                  ? "green"
                                  : inst.status === "FAILED"
                                    ? "red"
                                    : inst.status === "GENERATING"
                                      ? "amber"
                                      : "blue"
                              }
                            >
                              {inst.status}
                            </Chip>
                          </td>
                          <td className="py-2 text-right">
                            {inst.status === "READY" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={<Download className="h-3.5 w-3.5" />}
                                onClick={() => download(inst.instanceId)}
                              >
                                Download
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            ),
          },
          {
            id: "schedules",
            label: t("reports.tabs.schedules"),
            content: (
              <Card>
                <CardHeader title="Scheduled reports" />
                {!schedules?.length ? (
                  <EmptyState
                    title="No scheduled reports"
                    description="Schedule a report to run automatically."
                  />
                ) : (
                  <table className="w-full text-body-sm">
                    <thead>
                      <tr className="border-b border-neutral-300 text-left">
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Report
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Cron
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Recipients
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Last run
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600">
                          Next run
                        </th>
                        <th className="py-2 text-caption uppercase text-neutral-600"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s) => (
                        <tr
                          key={s.scheduleId}
                          className="border-b border-neutral-100"
                        >
                          <td className="py-2 font-semibold">
                            <code className="text-caption text-primary-700">
                              {s.reportCode}
                            </code>
                          </td>
                          <td className="py-2">
                            <code className="text-caption">{s.cron}</code>
                          </td>
                          <td className="py-2 text-caption">
                            {s.recipients.join(", ")}
                          </td>
                          <td className="py-2 text-caption">
                            {s.lastRunAt ? formatDate(s.lastRunAt) : "—"}
                          </td>
                          <td className="py-2 text-caption">
                            {s.nextRunAt ? formatDate(s.nextRunAt) : "—"}
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (confirm("Delete this schedule?")) {
                                  await deleteSchedule.mutateAsync(
                                    s.scheduleId,
                                  );
                                  refetchSchedules();
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            ),
          },
        ]}
      />

      {generating && (
        <ReportGenerateModal
          open={!!generating}
          onClose={() => setGenerating(null)}
          reportCode={generating}
        />
      )}

      {scheduling && (
        <ScheduleModal
          open={!!scheduling}
          onClose={() => setScheduling(null)}
          reportCode={scheduling}
        />
      )}
    </main>
  );
}