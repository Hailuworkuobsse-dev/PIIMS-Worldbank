import { useTranslation } from "react-i18next";
import { Clock, AlertTriangle } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Card, CardHeader } from "@/components/ui/Card";
import { useInceptionReports } from "./inception.queries";
import {
  daysUntil,
  deadlineTone,
  reportStatusKey,
  reportStatusTone,
} from "./inception.utils";
import { formatDate } from "@/lib/utils/date";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

export function DeadlineTracker() {
  const { t } = useTranslation();
  const { data, isLoading } = useInceptionReports({ limit: 50 });

  if (isLoading) return <LoadingState message="Loading deadlines…" />;

  const upcoming = (data?.data ?? [])
    .filter((r) =>
      ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED"].includes(
        r.status,
      ),
    )
    .map((r) => ({ ...r, days: daysUntil(r.dueDate) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 10);

  const overdue = upcoming.filter((r) => r.days < 0);
  const dueSoon = upcoming.filter((r) => r.days >= 0 && r.days <= 7);

  return (
    <Card>
      <CardHeader
        title="Deadline tracker"
        subtitle={`${overdue.length} overdue · ${dueSoon.length} due within 7 days`}
      />

      {upcoming.length === 0 ? (
        <EmptyState
          title="No upcoming deadlines"
          icon={<Clock className="h-12 w-12" />}
        />
      ) : (
        <ul className="divide-y divide-neutral-200">
          {upcoming.map((r) => (
            <li key={r.reportId} className="py-2.5 flex items-center gap-3">
              {r.days < 0 && (
                <AlertTriangle
                  className="h-4 w-4 text-danger shrink-0"
                  aria-hidden
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold truncate">
                  {r.projectName}
                </div>
                <div className="text-caption text-neutral-600">
                  <code>{r.projectCode}</code> · v{r.version}
                </div>
              </div>
              <Chip tone={reportStatusTone(r.status)}>
                {t(reportStatusKey(r.status))}
              </Chip>
              <div className="text-right shrink-0">
                <Chip tone={deadlineTone(r.days)}>
                  {r.days < 0
                    ? `${Math.abs(r.days)}d overdue`
                    : r.days === 0
                      ? "Due today"
                      : `${r.days}d left`}
                </Chip>
                <div className="text-caption text-neutral-600 mt-0.5">
                  {formatDate(r.dueDate)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}