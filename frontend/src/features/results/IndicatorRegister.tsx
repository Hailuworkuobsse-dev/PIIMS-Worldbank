import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Chip } from "@/components/ui/Chip";
import { TrafficLight } from "@/components/ui/TrafficLight";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { trafficLightLabelKey, trafficLightTone } from "./results.utils";
import type { Indicator, TrafficLightStatus } from "./results.types";

const ALL_STATUSES: TrafficLightStatus[] = [
  "ON_TRACK",
  "AT_RISK",
  "OFF_TRACK",
  "NOT_STARTED",
];

export function IndicatorRegister({
  indicators,
  loading,
  selectedComponentId,
}: {
  indicators: Indicator[];
  loading: boolean;
  selectedComponentId?: string | undefined;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TrafficLightStatus | "ALL">(
    "ALL",
  );

  const filtered = useMemo(() => {
    let arr = indicators;
    if (selectedComponentId)
      arr = arr.filter((i) => i.componentId === selectedComponentId);
    if (statusFilter !== "ALL")
      arr = arr.filter((i) => i.status === statusFilter);
    return arr;
  }, [indicators, selectedComponentId, statusFilter]);

  const columns: Column<Indicator & { id: string }>[] = [
    {
      id: "code",
      header: "Code",
      width: "120px",
      render: (r) => (
        <code className="text-caption font-bold text-primary-700">
          {r.code}
        </code>
      ),
    },
    {
      id: "name",
      header: "Indicator",
      render: (r) => (
        <div className="min-w-0">
          <div className="font-semibold truncate">{r.name}</div>
          <div className="text-caption text-neutral-600">
            {r.indicatorType} · {r.unit}
          </div>
        </div>
      ),
    },
    {
      id: "baseline",
      header: "Baseline",
      align: "right",
      render: (r) => <span className="text-caption">{r.baseline ?? "—"}</span>,
    },
    {
      id: "target",
      header: "Target",
      align: "right",
      render: (r) => <span className="text-caption">{r.target ?? "—"}</span>,
    },
    {
      id: "actual",
      header: "Actual",
      align: "right",
      render: (r) => <span className="font-semibold">{r.actual ?? "—"}</span>,
    },
    {
      id: "status",
      header: "Status",
      render: (r) => (
        <TrafficLight
          status={r.status}
          percent={r.achievementPct ? Math.round(r.achievementPct) : undefined}
        />
      ),
    },
  ];

  if (loading) return <LoadingState message="Loading indicators…" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          aria-pressed={statusFilter === "ALL"}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 rounded-full"
        >
          <Chip tone={statusFilter === "ALL" ? "blue" : "grey"}>
            All ({indicators.length})
          </Chip>
        </button>
        {ALL_STATUSES.map((s) => {
          const count = indicators.filter((i) => i.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 rounded-full"
            >
              <Chip tone={statusFilter === s ? trafficLightTone(s) : "grey"}>
                {t(trafficLightLabelKey(s))} ({count})
              </Chip>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No indicators"
          description="Add indicators to this component to get started."
        />
      ) : (
        <DataGrid
          columns={columns}
          rows={filtered.map((i) => ({ ...i, id: i.indicatorId }))}
          onRowClick={(r) => navigate(`/results/${r.indicatorId}/entry`)}
          ariaLabel="Indicators"
        />
      )}
    </div>
  );
}