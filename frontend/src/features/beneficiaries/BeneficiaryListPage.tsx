import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Map as MapIcon, Upload, Download } from "lucide-react";
import { useBeneficiaries } from "./beneficiary.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { BeneficiaryFormModal } from "./BeneficiaryFormModal";
import { BeneficiaryFiltersBar } from "./BeneficiaryFilters";
import {
  beneficiaryStatusTone,
  beneficiaryStatusKey,
  maskPhone,
} from "./beneficiary.utils";
import { formatDate } from "@/lib/utils/date";
import type { Beneficiary, BeneficiaryStatus } from "./beneficiary.types";

export default function BeneficiaryListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [params, setParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  const q = params.get("q") ?? "";
  const region = params.get("region") ?? "";
  const status = (params.get("status")?.split(",").filter(Boolean) ??
    []) as BeneficiaryStatus[];
  const pageSize = Math.min(200, Math.max(1, Number(params.get("size") ?? 25)));
  const page = Math.max(1, Number(params.get("page") ?? 1));

  const { data, isLoading, isError, refetch } = useBeneficiaries({
    q: q || undefined,
    region: region || undefined,
    status: status.length ? status : undefined,
    limit: pageSize,
  });

  const columns: Column<Beneficiary & { id: string }>[] = useMemo(
    () => [
      {
        id: "uniqueId",
        header: "Unique ID",
        render: (r) => (
          <code className="text-caption font-bold text-primary-700">
            {r.uniqueId}
          </code>
        ),
      },
      {
        id: "fullName",
        header: "Name",
        render: (r) => (
          <div className="min-w-0">
            <div className="font-semibold truncate">{r.fullName}</div>
            {r.fullNameAm && (
              <div lang="am" className="text-caption text-neutral-600 truncate">
                {r.fullNameAm}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "gender",
        header: "Gender",
        render: (r) => (
          <span className="text-caption capitalize">
            {r.gender.toLowerCase()}
          </span>
        ),
      },
      {
        id: "ageYears",
        header: "Age",
        align: "right",
        render: (r) => (
          <span className="text-caption">{r.ageYears ?? "—"}</span>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        render: (r) => (
          <span className="text-caption font-mono">{maskPhone(r.phone)}</span>
        ),
      },
      {
        id: "location",
        header: "Location",
        render: (r) => (
          <span className="text-caption">
            {r.location.woreda ?? "—"}
            {r.location.region ? ` · ${r.location.region}` : ""}
          </span>
        ),
      },
      {
        id: "registrationDate",
        header: "Registered",
        render: (r) => (
          <span className="text-caption">{formatDate(r.registrationDate)}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (r) => (
          <Chip tone={beneficiaryStatusTone(r.status)}>
            {t(beneficiaryStatusKey(r.status))}
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
    if (!("page" in patch)) next.set("page", "1");
    setParams(next, { replace: true });
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">
            {t("beneficiaries.title")}
          </h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {data?.pagination?.totalCount ?? 0} {t("beneficiaries.registered")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<MapIcon className="h-4 w-4" />}
            onClick={() => navigate("/map?layer=beneficiaries")}
          >
            {t("beneficiaries.viewMap")}
          </Button>
          {can(PERMISSIONS.beneficiaryExport) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => {
                const csv = ["Unique ID,Full name,Gender,Age,Woreda,Status"]
                  .concat(
                    (data?.data ?? []).map(
                      (b) =>
                        `${b.uniqueId},"${b.fullName.replace(/"/g, '""')}",${b.gender},${b.ageYears ?? ""},${b.location.woreda ?? ""},${b.status}`,
                    ),
                  )
                  .join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `beneficiaries-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              {t("beneficiaries.export")}
            </Button>
          )}
          {can(PERMISSIONS.beneficiaryWrite) && (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => alert("Bulk import — follow-up")}
              >
                {t("beneficiaries.import")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setFormOpen(true)}
              >
                {t("beneficiaries.register")}
              </Button>
            </>
          )}
        </div>
      </header>

      <BeneficiaryFiltersBar
        q={q}
        region={region}
        status={status}
        onChange={updateParams}
      />

      {isLoading && <SkeletonTable rows={8} cols={columns.length} />}
      {isError && !isLoading && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && (data?.data.length ?? 0) === 0 && (
        <EmptyState
          title={
            q
              ? t("beneficiaries.empty.searchTitle", { q })
              : t("beneficiaries.empty.title")
          }
          description={t("beneficiaries.empty.description")}
          action={
            can(PERMISSIONS.beneficiaryWrite) && (
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setFormOpen(true)}
              >
                {t("beneficiaries.register")}
              </Button>
            )
          }
        />
      )}
      {!isLoading && !isError && (data?.data.length ?? 0) > 0 && (
        <>
          <DataGrid
            columns={columns}
            rows={data!.data.map((b) => ({ ...b, id: b.beneficiaryId }))}
            onRowClick={(r) => navigate(`/beneficiaries/${r.beneficiaryId}`)}
            ariaLabel={t("beneficiaries.title")}
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

      <BeneficiaryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </main>
  );
}