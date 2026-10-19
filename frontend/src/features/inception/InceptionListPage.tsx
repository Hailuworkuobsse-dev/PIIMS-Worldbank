import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Filter, CheckCircle2 } from "lucide-react";
import { useInceptionReports } from "./inception.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { InceptionSubmitModal } from "./InceptionSubmitModal";
import { DeadlineTracker } from "./DeadlineTracker";
import {
  reportStatusTone,
  reportStatusKey,
  daysUntil,
  deadlineTone,
} from "./inception.utils";
import { formatDate } from "@/lib/utils/date";
import type { InceptionReport, ReportStatus } from "./inception.types";

const ALL_STATUSES: ReportStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
  "APPROVED",
  "REJECTED",
];

export default function InceptionListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [params, setParams] = useSearchParams();
  const [submitOpen, setSubmitOpen] = useState(false);

  const status = (params.get("status")?.split(",").filter(Boolean) ??
    []) as ReportStatus[];
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(params.get("size") ?? 25)));

  const { data, isLoading, isError, refetch } = useInceptionReports({
    status: status.length ? status : undefined,
    q: q || undefined,
    limit: pageSize,
  });

  const columns: Column<InceptionReport>[] = useMemo(
    () => [
      {
        id: "projectCode",
        header: "Project",
        render: (r) => (
          <div className="min-w-0">
            <div className="text-caption font-bold text-primary-700">
              {r.projectCode}
            </div>
            <div className="text-body-sm truncate">{r.projectName}</div>
          </div>
        ),
      },
      {
        id: "version",
        header: "Version",
        align: "center",
        render: (r) => (
          <code className="text-caption font-bold">v{r.version}</code>
        ),
      },
      {
        id: "submissionDate",
        header: "Submitted",
        render: (r) => (
          <span className="text-caption">
            {r.submissionDate ? formatDate(r.submissionDate) : "—"}
          </span>
        ),
      },
      {
        id: "dueDate",
        header: "Due",
        render: (r) => {
          const d = daysUntil(r.dueDate);
          return (
            <div className="flex items-center gap-2">
              <span className="text-caption">{formatDate(r.dueDate)}</span>
              {[
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "REVISION_REQUIRED",
              ].includes(r.status) && (
                <Chip tone={deadlineTone(d)}>
                  {d < 0
                    ? `${Math.abs(d)}d overdue`
                    : d === 0
                      ? "Today"
                      : `${d}d`}
                </Chip>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        render: (r) => (
          <Chip tone={reportStatusTone(r.status)}>
            {t(reportStatusKey(r.status))}
          </Chip>
        ),
      },
      {
        id: "reviewedByName",
        header: "Reviewer",
        render: (r) => (
          <span className="text-caption">{r.reviewedByName ?? "—"}</span>
        ),
      },
      {
        id: "noObjection",
        header: "No-objection",
        render: (r) =>
          r.noObjection ? (
            <span className="inline-flex items-center gap-1 text-green-700 text-caption font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Yes
            </span>
          ) : (
            <span className="text-caption text-neutral-600">—</span>
          ),
      },
    ],
    [t],
  );

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    });
    if (!("page" in patch)) next.set("page", "1");
    setParams(next, { replace: true });
  };

  const toggleStatus = (s: ReportStatus) => {
    const next = status.includes(s)
      ? status.filter((x) => x !== s)
      : [...status, s];
    updateParams({ status: next.length ? next.join(",") : undefined });
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("inception.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {data?.pagination?.totalCount ?? 0} reports
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(PERMISSIONS.inceptionSubmit) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setSubmitOpen(true)}
            >
              Submit report
            </Button>
          )}
        </div>
      </header>

      <DeadlineTracker />

      <section className="bg-white border border-neutral-300 rounded-md p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-600" aria-hidden />
          {ALL_STATUSES.map((s) => {
            const active = status.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => toggleStatus(s)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 rounded-full"
              >
                <Chip
                  tone={active ? reportStatusTone(s) : "grey"}
                  className={active ? "" : "opacity-70 hover:opacity-100"}
                >
                  {t(reportStatusKey(s))}
                </Chip>
              </button>
            );
          })}
          {status.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateParams({ status: undefined })}
            >
              Clear
            </Button>
          )}
        </div>
      </section>

      {isLoading && <SkeletonTable rows={6} cols={columns.length} />}
      {isError && !isLoading && (
        <ErrorState
          onRetry={() => refetch()}
          message="Failed to load reports."
        />
      )}

      {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
        <EmptyState
          title="No inception reports yet"
          description="Submit the first report to get started."
        />
      )}

      {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
        <>
          <DataGrid
            columns={columns}
            rows={data!.data.map((r) => ({ ...r, id: r.reportId }))}
            onRowClick={(r) => navigate(`/inception/${r.reportId}/review`)}
            ariaLabel={t("inception.title")}
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data!.pagination?.totalCount ?? 0}
            onPageChange={(p) => updateParams({ page: String(p) })}
            onPageSizeChange={(s) =>
              updateParams({ size: String(s), page: "1" })
            }
          />
        </>
      )}

      <InceptionSubmitModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
      />
    </main>
  );
}