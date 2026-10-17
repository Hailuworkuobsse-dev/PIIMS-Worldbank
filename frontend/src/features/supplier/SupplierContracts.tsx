import { useTranslation } from "react-i18next";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSupplierContracts } from "./supplier.queries";
import { formatMoney } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { SupplierContract } from "./supplier.types";

const tone = (s: SupplierContract["status"]) =>
  s === "ACTIVE"
    ? "green"
    : s === "COMPLETED"
      ? "teal"
      : s === "SIGNED"
        ? "blue"
        : s === "TERMINATED"
          ? "red"
          : "grey";

export function SupplierContracts() {
  const { t } = useTranslation();
  const { data, isLoading } = useSupplierContracts();

  if (isLoading) return <LoadingState />;
  if (!data?.length)
    return <EmptyState title={t("supplier.contracts.empty")} />;

  const columns: Column<SupplierContract & { id: string }>[] = [
    {
      id: "contractNo",
      header: "Contract No",
      render: (r) => (
        <code className="text-caption font-bold text-primary-700">
          {r.contractNo}
        </code>
      ),
    },
    {
      id: "title",
      header: "Title",
      render: (r) => (
        <div className="min-w-0">
          <div className="text-body-sm font-semibold truncate">{r.title}</div>
          <div className="text-caption text-neutral-600">
            <code>{r.projectCode}</code> · {r.projectName}
          </div>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Value",
      align: "right",
      render: (r) => (
        <span className="font-semibold">
          {formatMoney(r.amount, r.currency)}
        </span>
      ),
    },
    {
      id: "deliveriesCount",
      header: "Deliveries",
      align: "right",
      render: (r) => (
        <span className="text-caption">
          {r.deliveriesVerified} / {r.deliveriesCount}
        </span>
      ),
    },
    {
      id: "signedDate",
      header: "Signed",
      render: (r) => (
        <span className="text-caption">
          {r.signedDate ? formatDate(r.signedDate) : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      render: (r) => <Chip tone={tone(r.status) as any}>{r.status}</Chip>,
    },
  ];

  return (
    <DataGrid
      columns={columns}
      rows={data.map((c) => ({ ...c, id: c.contractId }))}
      ariaLabel={t("supplier.contracts.title")}
    />
  );
}