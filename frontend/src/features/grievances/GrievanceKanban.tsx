import { useTranslation } from "react-i18next";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  statusTone,
  statusKey,
  categoryTone,
  categoryKey,
  severityTone,
  slaDaysRemaining,
  slaTone,
} from "./grievance.utils";
import {
  GRIEVANCE_STATUSES,
  type Grievance,
  type GrievanceStatus,
} from "./grievance.types";

export function GrievanceKanban({
  grievances,
  loading,
  onSelect,
}: {
  grievances: Grievance[];
  loading: boolean;
  onSelect: (g: Grievance) => void;
}) {
  const { t } = useTranslation();
  if (loading) return <LoadingState />;

  const byStatus = GRIEVANCE_STATUSES.reduce<
    Record<GrievanceStatus, Grievance[]>
  >(
    (acc, s) => {
      acc[s] = [];
      return acc;
    },
    {} as Record<GrievanceStatus, Grievance[]>,
  );
  grievances.forEach((g) => byStatus[g.status]?.push(g));

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {GRIEVANCE_STATUSES.map((s) => (
          <section
            key={s}
            aria-label={t(statusKey(s))}
            className="w-[300px] shrink-0 bg-neutral-100 rounded-md border border-neutral-300"
          >
            <header className="flex items-center justify-between px-3 py-2 border-b border-neutral-300">
              <Chip tone={statusTone(s)}>{t(statusKey(s))}</Chip>
              <span className="text-caption font-bold text-neutral-600">
                {byStatus[s].length}
              </span>
            </header>
            <ul className="p-2 space-y-2 min-h-[200px]">
              {byStatus[s].map((g) => {
                const days = slaDaysRemaining(g.slaDue);
                return (
                  <li key={g.grievanceId}>
                    <button
                      type="button"
                      onClick={() => onSelect(g)}
                      className="w-full text-left bg-white border border-neutral-300 rounded-md p-3 hover:border-primary-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <code className="text-caption font-bold text-primary-700">
                          {g.ticketNo}
                        </code>
                        <Chip tone={severityTone(g.severity)}>
                          {g.severity}
                        </Chip>
                      </div>
                      <div className="text-body-sm font-semibold line-clamp-2">
                        {g.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Chip tone={categoryTone(g.category)}>
                          {t(categoryKey(g.category))}
                        </Chip>
                        <Chip tone={slaTone(days)}>
                          {days < 0
                            ? `${Math.abs(days)}d overdue`
                            : days === 0
                              ? "Today"
                              : `${days}d`}
                        </Chip>
                      </div>
                    </button>
                  </li>
                );
              })}
              {byStatus[s].length === 0 && (
                <li className="text-center text-caption text-neutral-500 py-6">
                  {t("grievance.empty")}
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}