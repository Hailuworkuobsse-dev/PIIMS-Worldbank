import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useContracts } from "./procurement.queries";
import { contractStatusTone } from "./procurement.utils";
import { formatMoney } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { Contract } from "./procurement.types";

export function ContractRegister({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useContracts({ projectId, limit: 100 });

  const columns: Column<Contract & { id: string }>[] = useMemo(
    () => [
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
          <span className="text-body-sm font-semibold">{r.title}</span>
        ),
      },
      {
        id: "supplierName",
        header: "Supplier",
        render: (r) => <span className="text-caption">{r.supplierName}</span>,
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
        render: (r) => (
          <Chip tone={contractStatusTone(r.status)}>{r.status}</Chip>
        ),
      },
      {
        id: "amendmentNo",
        header: "Amend.",
        align: "right",
        render: (r) => <span className="text-caption">{r.amendmentNo}</span>,
      },
    ],
    [],
  );

  if (isLoading) return <SkeletonTable rows={5} cols={columns.length} />;
  if (!data?.data.length) return <EmptyState title="No contracts yet" />;

  return (
    <DataGrid
      columns={columns}
      rows={data.data.map((c) => ({ ...c, id: c.contractId }))}
      ariaLabel={t("procurement.contracts.title")}
    />
  );
}