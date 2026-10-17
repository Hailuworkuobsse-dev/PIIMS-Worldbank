import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DeliveryForm } from "./DeliveryForm";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Chip } from "@/components/ui/Chip";
import { useSupplierDeliveries } from "./supplier.queries";
import { formatDate } from "@/lib/utils/date";
import type { DeliverySubmission } from "./supplier.types";

export function DeliverySubmissionPage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useSupplierDeliveries();

  const columns: Column<DeliverySubmission & { id: string }>[] = [
    {
      id: "serialNo",
      header: "Serial No",
      render: (r) => (
        <code className="text-caption font-bold">{r.serialNo}</code>
      ),
    },
    {
      id: "productName",
      header: "Product",
      render: (r) => (
        <span className="text-body-sm font-semibold">{r.productName}</span>
      ),
    },
    {
      id: "beneficiaryName",
      header: "Beneficiary",
      render: (r) => (
        <span className="text-caption">{r.beneficiaryName ?? "—"}</span>
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
      id: "status",
      header: "Status",
      render: (r) => (
        <Chip
          tone={
            r.status === "VERIFIED"
              ? "green"
              : r.status === "REJECTED"
                ? "red"
                : "amber"
          }
        >
          {r.status}
        </Chip>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title={t("supplier.deliveries.title")}
        subtitle={t("supplier.deliveries.subtitle")}
        action={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setOpen(true)}
          >
            {t("supplier.deliveries.add")}
          </Button>
        }
      />
      {isLoading ? (
        <p className="text-body-sm text-neutral-600">{t("a11y.loading")}</p>
      ) : (
        <DataGrid
          columns={columns}
          rows={(data ?? []).map((d) => ({ ...d, id: d.submissionId }))}
          ariaLabel={t("supplier.deliveries.title")}
          emptyMessage={t("supplier.deliveries.empty")}
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("supplier.deliveries.formTitle")}
        size="md"
      >
        <DeliveryForm onSuccess={() => setOpen(false)} />
      </Modal>
    </Card>
  );
}