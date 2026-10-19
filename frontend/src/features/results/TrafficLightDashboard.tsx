import { Card, CardHeader } from "@/components/ui/Card";
import { TrafficLight } from "@/components/ui/TrafficLight";
import type { Indicator, TrafficLightStatus } from "./results.types";

export function TrafficLightDashboard({
  indicators,
}: {
  indicators: Indicator[];
}) {
  const counts: Record<TrafficLightStatus, number> = {
    ON_TRACK: 0,
    AT_RISK: 0,
    OFF_TRACK: 0,
    NOT_STARTED: 0,
  };
  indicators.forEach((i) => {
    counts[i.status]++;
  });
  const total = indicators.length || 1;

  const byComponent = new Map<string, Indicator[]>();
  indicators.forEach((i) => {
    const arr = byComponent.get(i.componentId) ?? [];
    arr.push(i);
    byComponent.set(i.componentId, arr);
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader
          title="Portfolio status"
          subtitle={`${indicators.length} indicators`}
        />
        <ul className="space-y-3">
          {(
            [
              "ON_TRACK",
              "AT_RISK",
              "OFF_TRACK",
              "NOT_STARTED",
            ] as TrafficLightStatus[]
          ).map((s) => {
            const pct = (counts[s] / total) * 100;
            return (
              <li key={s} className="space-y-1.5">
                <div className="flex items-center justify-between text-body-sm">
                  <TrafficLight status={s} />
                  <span className="font-bold">
                    {counts[s]}{" "}
                    <span className="text-neutral-600 font-normal">
                      ({pct.toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <div
                  className="h-2 bg-neutral-200 rounded overflow-hidden"
                  aria-hidden
                >
                  <div
                    className={
                      s === "ON_TRACK"
                        ? "h-full bg-green-500"
                        : s === "AT_RISK"
                          ? "h-full bg-amber-500"
                          : s === "OFF_TRACK"
                            ? "h-full bg-red-500"
                            : "h-full bg-slate-400"
                    }
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader title="By component" />
        {byComponent.size === 0 ? (
          <p className="text-caption text-neutral-600">No components yet.</p>
        ) : (
          <ul className="space-y-3">
            {Array.from(byComponent.entries()).map(([componentId, items]) => {
              const on = items.filter((i) => i.status === "ON_TRACK").length;
              const at = items.filter((i) => i.status === "AT_RISK").length;
              const off = items.filter((i) => i.status === "OFF_TRACK").length;
              return (
                <li
                  key={componentId}
                  className="flex items-center justify-between text-body-sm"
                >
                  <span className="text-neutral-900 font-semibold truncate">
                    {componentId.slice(0, 8)}…
                  </span>
                  <div className="flex gap-3 text-caption">
                    <span className="text-green-700 font-bold">{on}</span>
                    <span className="text-amber-700 font-bold">{at}</span>
                    <span className="text-red-700 font-bold">{off}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}