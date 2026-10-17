import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils/date";
import type { Procurement } from "./procurement.types";

const STAGES = [
  "planDate",
  "advertisementDate",
  "bidOpeningDate",
  "evaluationDate",
  "awardDate",
] as const;
const STAGE_LABELS: Record<(typeof STAGES)[number], string> = {
  planDate: "Plan",
  advertisementDate: "Advertised",
  bidOpeningDate: "Bid open",
  evaluationDate: "Evaluated",
  awardDate: "Awarded",
};

export function ProcurementTimeline({
  procurement,
}: {
  procurement: Procurement[];
}) {
  const { t } = useTranslation();

  // Compute overall date range
  const dates = procurement.flatMap((p) =>
    STAGES.map((s) => (p[s] ? Date.parse(p[s] as string) : null)).filter(
      (d): d is number => d != null,
    ),
  );
  if (dates.length === 0) return null;
  const min = Math.min(...dates);
  const max = Math.max(...dates);
  const span = max - min || 1;

  return (
    <Card>
      <CardHeader
        title={t("procurement.timeline.title")}
        subtitle={t("procurement.timeline.subtitle")}
      />
      <div className="overflow-x-auto">
        <div className="min-w-[720px] space-y-3">
          {/* Header */}
          <div className="grid grid-cols-[240px_1fr] gap-3">
            <div />
            <div className="flex justify-between text-caption text-neutral-600">
              <span>{formatDate(new Date(min).toISOString())}</span>
              <span>{formatDate(new Date((min + max) / 2).toISOString())}</span>
              <span>{formatDate(new Date(max).toISOString())}</span>
            </div>
          </div>

          {/* Rows */}
          {procurement.map((p) => (
            <div
              key={p.procurementId}
              className="grid grid-cols-[240px_1fr] gap-3 items-center"
            >
              <div className="text-body-sm truncate">
                <code className="text-caption font-bold text-primary-700 mr-1">
                  {p.planRef}
                </code>
                <span className="text-neutral-900">{p.description}</span>
              </div>
              <div className="relative h-10 bg-neutral-100 rounded-md">
                {/* Plan marker */}
                <Marker
                  at={p.planDate}
                  min={min}
                  span={span}
                  color="bg-blue-400"
                  label={STAGE_LABELS.planDate}
                />
                {/* Progress bar from plan → latest */}
                <Bar
                  from={p.planDate}
                  to={
                    p.awardDate ??
                    p.evaluationDate ??
                    p.bidOpeningDate ??
                    p.advertisementDate ??
                    p.planDate
                  }
                  min={min}
                  span={span}
                />
                <Marker
                  at={p.advertisementDate}
                  min={min}
                  span={span}
                  color="bg-amber-400"
                  label={STAGE_LABELS.advertisementDate}
                />
                <Marker
                  at={p.bidOpeningDate}
                  min={min}
                  span={span}
                  color="bg-amber-500"
                  label={STAGE_LABELS.bidOpeningDate}
                />
                <Marker
                  at={p.evaluationDate}
                  min={min}
                  span={span}
                  color="bg-indigo-500"
                  label={STAGE_LABELS.evaluationDate}
                />
                <Marker
                  at={p.awardDate}
                  min={min}
                  span={span}
                  color="bg-green-500"
                  label={STAGE_LABELS.awardDate}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Marker({
  at,
  min,
  span,
  color,
  label,
}: {
  at?: string;
  min: number;
  span: number;
  color: string;
  label: string;
}) {
  if (!at) return null;
  const pct = ((Date.parse(at) - min) / span) * 100;
  return (
    <span
      aria-label={label}
      title={`${label}: ${at}`}
      className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ${color} border-2 border-white shadow`}
      style={{ left: `calc(${pct}% - 6px)` }}
    />
  );
}

function Bar({
  from,
  to,
  min,
  span,
}: {
  from?: string;
  to?: string;
  min: number;
  span: number;
}) {
  if (!from || !to) return null;
  const startPct = ((Date.parse(from) - min) / span) * 100;
  const endPct = ((Date.parse(to) - min) / span) * 100;
  const width = Math.max(2, endPct - startPct);
  return (
    <span
      aria-hidden
      className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-primary-300 rounded-full opacity-60"
      style={{ left: `${startPct}%`, width: `${width}%` }}
    />
  );
}