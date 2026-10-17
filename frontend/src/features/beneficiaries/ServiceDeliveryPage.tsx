import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useServiceDeliveries } from "./beneficiary.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ServiceDeliveryForm } from "./ServiceDeliveryForm";
import { Modal } from "@/components/ui/Modal";
import { deliveryStatusTone, deliveryStatusKey } from "./beneficiary.utils";
import { formatDate } from "@/lib/utils/date";
import type { ServiceDelivery } from "./beneficiary.types";

export default function ServiceDeliveryPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { can } = usePermissions();
  const [formOpen, setFormOpen] = useState(false);

  const projectId = params.get("projectId") ?? undefined;
  const { data, isLoading } = useServiceDeliveries({ projectId, limit: 200 });

  const columns: Column<ServiceDelivery & { id: string }>[] = useMemo(
    () => [
      {
        id: "beneficiaryUniqueId",
        header: "Beneficiary",
        render: (r) => (
          <div className="min-w-0">
            <code className="text-caption text-primary-700">
              {r.beneficiaryUniqueId}
            </code>
            <div className="text-body-sm font-semibold truncate">
              {r.beneficiaryName}
            </div>
          </div>
        ),
      },
      {
        id: "productName",
        header: "Product",
        render: (r) => <span className="text-body-sm">{r.productName}</span>,
      },
      {
        id: "serialNo",
        header: "Serial",
        render: (r) => (
          <code className="text-caption">{r.serialNo ?? "—"}</code>
        ),
      },
      {
        id: "installDate",
        header: "Install date",
        render: (r) => (
          <span className="text-caption">
            {r.installDate ? formatDate(r.installDate) : "—"}
          </span>
        ),
      },
      {
        id: "supplierName",
        header: "Supplier",
        render: (r) => (
          <span className="text-caption">{r.supplierName ?? "—"}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (r) => (
          <Chip tone={deliveryStatusTone(r.status)}>
            {t(deliveryStatusKey(r.status))}
          </Chip>
        ),
      },
    ],
    [t],
  );

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">
            {t("beneficiaries.deliveries.title")}
          </h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {data?.pagination?.totalCount ?? 0}{" "}
            {t("beneficiaries.deliveries.recorded")}
          </p>
        </div>
        {can(PERMISSIONS.serviceDeliveryWrite) && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setFormOpen(true)}
          >
            {t("beneficiaries.deliveries.add")}
          </Button>
        )}
      </header>

      {isLoading && <SkeletonTable rows={6} cols={columns.length} />}
      {!isLoading && (data?.data.length ?? 0) === 0 && (
        <EmptyState
          title={t("beneficiaries.deliveries.empty")}
          description={t("beneficiaries.deliveries.emptyHint")}
        />
      )}
      {!isLoading && (data?.data.length ?? 0) > 0 && (
        <DataGrid
          columns={columns}
          rows={data!.data.map((d) => ({ ...d, id: d.deliveryId }))}
          ariaLabel={t("beneficiaries.deliveries.title")}
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={t("beneficiaries.deliveries.formTitle")}
        size="md"
      >
        <ServiceDeliveryForm onSuccess={() => setFormOpen(false)} />
      </Modal>
    </main>
  );
}