import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { useProcurementDelays } from "./procurement.queries";
import { delaySeverityTone } from "./procurement.utils";
import { formatDate } from "@/lib/utils/date";

export function DelayAlerts({ projectId }: { projectId?: string }) {
  const { t } = useTranslation();
  const { data } = useProcurementDelays(projectId);

  if (!data?.length) return null;

  return (
    <Card>
      <CardHeader
        title={t("procurement.delay.title")}
        subtitle={`${data.length} line(s) delayed`}
      />
      <ul className="divide-y divide-neutral-200">
        {data.map((d) => (
          <li key={d.procurementId} className="py-2.5 flex items-start gap-3">
            <AlertTriangle
              className="h-4 w-4 text-danger mt-0.5 shrink-0"
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-semibold">
                <code className="text-primary-700 mr-1">{d.planRef}</code>
                {d.description}
              </div>
              <div className="text-caption text-neutral-600">
                Planned {formatDate(d.planDate)} · {d.daysOverdue} days overdue
                · status {d.status}
              </div>
            </div>
            <Chip tone={delaySeverityTone(d.severity)}>{d.severity}</Chip>
          </li>
        ))}
      </ul>
    </Card>
  );
}