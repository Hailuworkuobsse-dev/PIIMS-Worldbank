import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { KPITile } from "@/components/ui/KPITile";
import { useGrievanceStats } from "./grievance.queries";
import { categoryKey } from "./grievance.utils";

export function GrievanceAnalytics({ projectId }: { projectId?: string | undefined }) {
  const { t } = useTranslation();
  const { data, isLoading } = useGrievanceStats(projectId);
  if (isLoading || !data) return <LoadingState />;

  const maxCat = Math.max(1, ...data.byCategory.map((c) => c.count));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile
          label={t("grievance.analytics.total")}
          value={String(data.total)}
        />
        <KPITile
          label={t("grievance.analytics.open")}
          value={String(data.open)}
          tone="warning"
        />
        <KPITile
          label={t("grievance.analytics.overdue")}
          value={String(data.overdue)}
          tone="danger"
        />
        <KPITile
          label={t("grievance.analytics.avgDays")}
          value={`${data.avgResolutionDays.toFixed(1)} d`}
          tone="success"
        />
      </div>

      <Card>
        <CardHeader title={t("grievance.analytics.byCategory")} />
        <ul className="space-y-2">
          {data.byCategory.map((c) => (
            <li key={c.category}>
              <div className="flex justify-between text-body-sm mb-1">
                <span className="text-neutral-600">
                  {t(categoryKey(c.category))}
                </span>
                <span className="font-bold">{c.count}</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-700"
                  style={{ width: `${(c.count / maxCat) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}