import { useTranslation } from "react-i18next";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSupplierWarranties } from "./supplier.queries";
import { formatDate } from "@/lib/utils/date";
import type { WarrantyRecord } from "./supplier.types";

export function WarrantyRegister() {
  const { t } = useTranslation();
  const { data, isLoading } = useSupplierWarranties();

  if (isLoading) return <LoadingState />;
  if (!data?.length)
    return <EmptyState title={t("supplier.warranties.empty")} />;

  const columns: Column<WarrantyRecord & { id: string }>[] = [
    {
      id: "serialNo",
      header: "Serial",
      render: (r) => (
        <code className="text-caption font-bold">{r.serialNo}</code>
      ),
    },
    {
      id: "productName",
      header: "Product",
      render: (r) => <span className="text-body-sm">{r.productName}</span>,
    },
    {
      id: "beneficiaryName",
      header: "Beneficiary",
      render: (r) => (
        <span className="text-caption">{r.beneficiaryName ?? "—"}</span>
      ),
    },
    {
      id: "startDate",
      header: "From",
      render: (r) => (
        <span className="text-caption">{formatDate(r.startDate)}</span>
      ),
    },
    {
      id: "endDate",
      header: "Until",
      render: (r) => (
        <span className="text-caption">{formatDate(r.endDate)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      render: (r) => (
        <Chip
          tone={
            r.status === "ACTIVE"
              ? "green"
              : r.status === "EXPIRED"
                ? "grey"
                : "amber"
          }
        >
          {r.status}
        </Chip>
      ),
    },
  ];

  return (
    <DataGrid
      columns={columns}
      rows={data.map((w) => ({ ...w, id: w.warrantyId }))}
      ariaLabel={t("supplier.warranties.title")}
    />
  );
}