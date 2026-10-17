import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Download } from "lucide-react";
import { useDisbursements } from "./financial.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { DisbursementFormModal } from "./DisbursementFormModal";
import {
  disbursementStatusTone,
  disbursementStatusKey,
} from "./financial.utils";
import { formatMoney } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { Disbursement, DisbursementStatus } from "./financial.types";

const ALL_STATUSES: DisbursementStatus[] = [
  "PLANNED",
  "REQUESTED",
  "APPROVED",
  "DISBURSED",
  "RECONCILED",
  "REJECTED",
];

export default function DisbursementPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [params, setParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  const projectId = params.get("projectId") ?? undefined;
  const status = (params.get("status")?.split(",").filter(Boolean) ??
    []) as DisbursementStatus[];
  const pageSize = Math.min(200, Math.max(1, Number(params.get("size") ?? 25)));

  const { data, isLoading, isError, refetch } = useDisbursements({
    projectId,
    status: status.length ? status : undefined,
    limit: pageSize,
  });

  const columns: Column<Disbursement & { id: string }>[] = useMemo(
    () => [
      {
        id: "projectCode",
        header: "Project",
        render: (r) => (
          <code className="text-caption font-bold text-primary-700">
            {r.projectCode}
          </code>
        ),
      },
      {
        id: "sourceOrgName",
        header: "Source",
        render: (r) => <span className="text-body-sm">{r.sourceOrgName}</span>,
      },
      {
        id: "category",
        header: "Category",
        render: (r) => <Chip tone="grey">{r.category.replace("_", " ")}</Chip>,
      },
      {
        id: "amount",
        header: "Amount",
        align: "right",
        render: (r) => (
          <span className="font-semibold">
            {formatMoney(r.amount, r.currency)}
          </span>
        ),
      },
      {
        id: "valueDate",
        header: "Value date",
        render: (r) => (
          <span className="text-caption">{formatDate(r.valueDate)}</span>
        ),
      },
      {
        id: "referenceNo",
        header: "Reference",
        render: (r) => (
          <code className="text-caption">{r.referenceNo ?? "—"}</code>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (r) => (
          <Chip tone={disbursementStatusTone(r.status)}>
            {t(disbursementStatusKey(r.status))}
          </Chip>
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
    setParams(next, { replace: true });
  };

  const toggleStatus = (s: DisbursementStatus) => {
    const nxt = status.includes(s)
      ? status.filter((x) => x !== s)
      : [...status, s];
    updateParams({ status: nxt.length ? nxt.join(",") : undefined });
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">
            {t("financial.disbursements.title")}
          </h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {data?.pagination?.totalCount ?? 0} disbursements
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              const csv = [
                "Project,Source,Category,Amount,Currency,Value date,Status",
              ]
                .concat(
                  (data?.data ?? []).map(
                    (d) =>
                      `${d.projectCode},${d.sourceOrgName},${d.category},${d.amount},${d.currency},${d.valueDate},${d.status}`,
                  ),
                )
                .join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "disbursements.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            {t("financial.actions.export")}
          </Button>
          {can(PERMISSIONS.disbursementWrite) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setFormOpen(true)}
            >
              {t("financial.disbursements.add")}
            </Button>
          )}
        </div>
      </header>

      <section className="bg-white border border-neutral-300 rounded-md p-3 flex flex-wrap gap-2 items-center">
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
              <Chip tone={active ? disbursementStatusTone(s) : "grey"}>
                {t(disbursementStatusKey(s))}
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
            {t("financial.filters.clear")}
          </Button>
        )}
      </section>

      {isLoading && <SkeletonTable rows={6} cols={columns.length} />}
      {isError && !isLoading && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
        <EmptyState
          title="No disbursements yet"
          description="Record a disbursement to begin tracking."
        />
      )}
      {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
        <>
          <DataGrid
            columns={columns}
            rows={data!.data.map((d) => ({ ...d, id: d.disbursementId }))}
            ariaLabel={t("financial.disbursements.title")}
          />
          <Pagination
            page={1}
            pageSize={pageSize}
            total={data!.pagination?.totalCount ?? 0}
            onPageChange={() => {
              /* cursor-based */
            }}
            onPageSizeChange={(s) => updateParams({ size: String(s) })}
          />
        </>
      )}

      <DisbursementFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </main>
  );
}