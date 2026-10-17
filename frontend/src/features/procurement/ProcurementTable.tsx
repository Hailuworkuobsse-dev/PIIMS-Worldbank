import { useTranslation } from "react-i18next";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { procurementStatusTone } from "./procurement.utils";
import { formatMoney } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { Procurement } from "./procurement.types";

export function ProcurementTable({
  procurement,
  loading,
}: {
  procurement: Procurement[];
  loading: boolean;
}) {
  const { t } = useTranslation();

  if (loading) return <LoadingState />;
  if (procurement.length === 0)
    return <EmptyState title={t("procurement.empty")} />;

  const columns: Column<Procurement & { id: string }>[] = [
    {
      id: "planRef",
      header: "Plan Ref",
      render: (r) => (
        <code className="text-caption font-bold text-primary-700">
          {r.planRef}
        </code>
      ),
    },
    {
      id: "description",
      header: "Description",
      render: (r) => (
        <span className="text-body-sm font-semibold">{r.description}</span>
      ),
    },
    {
      id: "method",
      header: "Method",
      render: (r) => <Chip tone="grey">{r.method}</Chip>,
    },
    {
      id: "estimatedAmount",
      header: "Estimate",
      align: "right",
      render: (r) => (
        <span className="text-caption">
          {formatMoney(r.estimatedAmount, r.currency)}
        </span>
      ),
    },
    {
      id: "planDate",
      header: "Planned",
      render: (r) => (
        <span className="text-caption">{formatDate(r.planDate)}</span>
      ),
    },
    {
      id: "awardDate",
      header: "Awarded",
      render: (r) => (
        <span className="text-caption">
          {r.awardDate ? formatDate(r.awardDate) : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      render: (r) => (
        <Chip tone={procurementStatusTone(r.status)}>{r.status}</Chip>
      ),
    },
  ];

  return (
    <DataGrid
      columns={columns}
      rows={procurement.map((p) => ({ ...p, id: p.procurementId }))}
      ariaLabel={t("procurement.title")}
    />
  );
}