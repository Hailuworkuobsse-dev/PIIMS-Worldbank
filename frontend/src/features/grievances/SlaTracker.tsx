import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useGrievances } from "./grievance.queries";
import { slaDaysRemaining, slaTone } from "./grievance.utils";
import { Chip } from "@/components/ui/Chip";
import { formatDate } from "@/lib/utils/date";

export function SlaTracker({ projectId }: { projectId?: string | undefined }) {
  const { t } = useTranslation();
  const { data } = useGrievances({
    projectId,
    status: ["OPEN", "IN_PROGRESS", "ESCALATED"] as any,
    limit: 100,
  });

  const atRisk = (data?.data ?? [])
    .map((g) => ({ g, days: slaDaysRemaining(g.slaDue) }))
    .filter(({ days }) => days <= 3)
    .sort((a, b) => a.days - b.days);

  if (atRisk.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title={t("grievance.sla.title")}
        subtitle={t("grievance.sla.subtitle", { count: atRisk.length })}
      />
      <ul className="divide-y divide-neutral-200">
        {atRisk.map(({ g, days }) => (
          <li key={g.grievanceId} className="py-2 flex items-center gap-3">
            <AlertTriangle
              className={`h-4 w-4 ${days < 0 ? "text-danger" : "text-amber-600"} shrink-0`}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-semibold">
                <code className="text-primary-700 mr-1">{g.ticketNo}</code>
                {g.description.slice(0, 80)}
                {g.description.length > 80 ? "…" : ""}
              </div>
              <div className="text-caption text-neutral-600">
                SLA due {formatDate(g.slaDue)}
              </div>
            </div>
            <Chip tone={slaTone(days)}>
              {days < 0
                ? `${Math.abs(days)}d overdue`
                : days === 0
                  ? "Today"
                  : `${days}d`}
            </Chip>
          </li>
        ))}
      </ul>
    </Card>
  );
}