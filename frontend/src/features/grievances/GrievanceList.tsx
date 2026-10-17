import { useTranslation } from "react-i18next";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  statusTone,
  statusKey,
  categoryTone,
  categoryKey,
  severityTone,
  slaDaysRemaining,
  slaTone,
} from "./grievance.utils";
import { formatDate } from "@/lib/utils/date";
import type { Grievance } from "./grievance.types";

export function GrievanceList({
  grievances,
  loading,
  onSelect,
}: {
  grievances: Grievance[];
  loading: boolean;
  onSelect: (g: Grievance) => void;
}) {
  const { t } = useTranslation();

  const columns: Column<Grievance & { id: string }>[] = [
    {
      id: "ticketNo",
      header: "Ticket",
      render: (r) => (
        <code className="text-caption font-bold text-primary-700">
          {r.ticketNo}
        </code>
      ),
    },
    {
      id: "description",
      header: "Description",
      render: (r) => (
        <span className="text-body-sm truncate block max-w-md">
          {r.description}
        </span>
      ),
    },
    {
      id: "category",
      header: "Category",
      render: (r) => (
        <Chip tone={categoryTone(r.category)}>
          {t(categoryKey(r.category))}
        </Chip>
      ),
    },
    {
      id: "severity",
      header: "Severity",
      render: (r) => <Chip tone={severityTone(r.severity)}>{r.severity}</Chip>,
    },
    {
      id: "slaDue",
      header: "SLA",
      render: (r) => {
        const days = slaDaysRemaining(r.slaDue);
        return (
          <div className="flex items-center gap-2">
            <span className="text-caption">{formatDate(r.slaDue)}</span>
            <Chip tone={slaTone(days)}>
              {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
            </Chip>
          </div>
        );
      },
    },
    {
      id: "assignedToName",
      header: "Assigned",
      render: (r) => (
        <span className="text-caption">{r.assignedToName ?? "—"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      render: (r) => (
        <Chip tone={statusTone(r.status)}>{t(statusKey(r.status))}</Chip>
      ),
    },
  ];

  if (!loading && grievances.length === 0) {
    return <EmptyState title={t("grievance.empty")} />;
  }

  return (
    <DataGrid
      columns={columns}
      rows={grievances.map((g) => ({ ...g, id: g.grievanceId }))}
      loading={loading}
      onRowClick={onSelect}
      ariaLabel={t("grievance.title")}
    />
  );
}