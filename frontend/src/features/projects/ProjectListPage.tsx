import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Download, Filter, Upload, RefreshCw } from "lucide-react";
import { useProjects } from "./project.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Progress } from "@/components/ui/Progress";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ProjectListFilters } from "./ProjectListFilters";
import {
  statusTone,
  statusLabelKey,
  sectorLabelKey,
  progressTone,
} from "./project.utils";
import { formatMoney } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { ProjectSummary } from "./project.types";

export default function ProjectListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get("q") ?? "";
  const status = (params.get("status")?.split(",").filter(Boolean) ??
    []) as ProjectSummary["status"][];
  const sector = (params.get("sector")?.split(",").filter(Boolean) ??
    []) as ProjectSummary["sector"][];
  const region = params.get("region") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(params.get("size") ?? 25)));

  const { data, isLoading, isFetching, isError, refetch } = useProjects({
    q: q || undefined,
    status: status.length ? status : undefined,
    sector: sector.length ? sector : undefined,
    region: region || undefined,
    limit: pageSize,
    cursor: undefined,
  });

  const columns: Column<ProjectSummary>[] = useMemo(
    () => [
      {
        id: "projectCode",
        header: t("projects.columns.code"),
        sortable: true,
        render: (r) => (
          <code className="text-caption font-bold text-primary-700">
            {r.projectCode}
          </code>
        ),
      },
      {
        id: "name",
        header: t("projects.columns.name"),
        sortable: true,
        render: (r) => (
          <div className="min-w-0">
            <div className="font-semibold text-neutral-900 truncate">
              {r.name}
            </div>
            {r.region && (
              <div className="text-caption text-neutral-600">{r.region}</div>
            )}
          </div>
        ),
      },
      {
        id: "sector",
        header: t("projects.columns.sector"),
        render: (r) => <Chip tone="blue">{t(sectorLabelKey(r.sector))}</Chip>,
      },
      {
        id: "status",
        header: t("projects.columns.status"),
        render: (r) => (
          <Chip tone={statusTone(r.status)}>{t(statusLabelKey(r.status))}</Chip>
        ),
      },
      {
        id: "totalBudget",
        header: t("projects.columns.budget"),
        align: "right",
        render: (r) => (
          <span className="font-semibold">
            {formatMoney(r.totalBudget.amount, r.totalBudget.currency)}
          </span>
        ),
      },
      {
        id: "progressPct",
        header: t("projects.columns.progress"),
        render: (r) => (
          <div className="min-w-[120px]">
            <Progress
              value={r.progressPct ?? 0}
              tone={progressTone(r.progressPct)}
            />
          </div>
        ),
      },
      {
        id: "updatedAt",
        header: t("projects.columns.updated"),
        render: (r) => (
          <span className="text-caption text-neutral-600">
            {formatDate(r.updatedAt)}
          </span>
        ),
      },
    ],
    [t],
  );

  const active = (data?.data ?? []).filter((p) => p.status === "ACTIVE").length;
  const pipeline = (data?.data ?? []).filter((p) =>
    ["IDEA", "PROFILE", "PRE_FEASIBILITY", "FEASIBILITY", "APPRAISAL"].includes(
      p.status,
    ),
  ).length;

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    });
    if (!("page" in patch)) next.set("page", "1");
    setParams(next, { replace: true });
  };

  return (
    <main id="main" tabIndex={-1}>
      <header className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-h1 text-primary-900">{t("projects.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {t("projects.subtitle", {
              count: data?.pagination.totalCount ?? 0,
              active,
              pipeline,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setFiltersOpen((s) => !s)}
            aria-expanded={filtersOpen}
          >
            {t("projects.actions.filters")}
          </Button>
          {can(PERMISSIONS.projectRead) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => {
                const csv = ["Code,Name,Sector,Status,Budget"]
                  .concat(
                    (data?.data ?? []).map(
                      (p) =>
                        `${p.projectCode},"${p.name.replace(/"/g, '""')}",${p.sector},${p.status},${p.totalBudget.amount} ${p.totalBudget.currency}`,
                    ),
                  )
                  .join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `projects-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              {t("projects.actions.export")}
            </Button>
          )}
          {can(PERMISSIONS.projectWrite) && (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => alert("Bulk import wizard — Step 5 follow-up")}
              >
                {t("projects.actions.import")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => navigate("/projects/new")}
              >
                {t("projects.actions.new")}
              </Button>
            </>
          )}
        </div>
      </header>

      {filtersOpen && (
        <div className="mb-4">
          <ProjectListFilters
            q={q}
            status={status}
            sector={sector}
            region={region}
            onChange={updateParams}
          />
        </div>
      )}

      {isLoading && <SkeletonTable rows={8} cols={columns.length} />}

      {isError && !isLoading && (
        <ErrorState
          onRetry={() => refetch()}
          message="Failed to load projects."
        />
      )}

      {!isLoading &&
        !isError &&
        (data?.data.length ?? 0) === 0 &&
        (q ? (
          <EmptyState
            title={t("projects.empty.searchTitle", { q })}
            description={t("projects.empty.searchDescription")}
            action={
              <Button
                variant="secondary"
                onClick={() => updateParams({ q: undefined })}
              >
                {t("projects.actions.clearFilters")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={t("projects.empty.title")}
            description={t("projects.empty.description")}
            action={
              can(PERMISSIONS.projectWrite) && (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => navigate("/projects/new")}
                >
                  {t("projects.actions.new")}
                </Button>
              )
            }
          />
        ))}

      {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
        <>
          <DataGrid
            columns={columns}
            rows={data!.data.map((p) => ({ ...p, id: p.projectId }))}
            onRowClick={(r) => navigate(`/projects/${r.projectCode}`)}
            ariaLabel={t("projects.title")}
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data!.pagination.totalCount}
            onPageChange={(p) => updateParams({ page: String(p) })}
            onPageSizeChange={(s) =>
              updateParams({ size: String(s), page: "1" })
            }
          />
        </>
      )}
    </main>
  );
}