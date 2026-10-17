import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { IndicatorSeries } from "./analytics.types";

/** CSS-based bar chart across waves for a selected indicator. */
export function WaveComparisonChart({
  indicators,
}: {
  indicators: IndicatorSeries[];
}) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState(indicators[0]?.indicatorId);
  const selected =
    indicators.find((i) => i.indicatorId === selectedId) ?? indicators[0];

  if (!selected)
    return <p className="text-body-sm text-neutral-600">No data.</p>;

  const max = Math.max(...selected.waves.map((w) => w.mean), 1);

  return (
    <div>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="mb-4 h-9 px-3 rounded-md border border-neutral-300 text-body-sm"
        aria-label="Select indicator"
      >
        {indicators.map((i) => (
          <option key={i.indicatorId} value={i.indicatorId}>
            {i.indicatorName}
          </option>
        ))}
      </select>

      <div className="flex items-end gap-4 h-[260px] px-4">
        {selected.waves.map((w, idx) => {
          const height = (w.mean / max) * 100;
          const isLast = idx === selected.waves.length - 1;
          return (
            <div
              key={w.waveCode}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <div className="text-body-sm font-bold text-primary-900 mb-1">
                {w.mean.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
              <div
                className={`w-full max-w-[80px] rounded-t-md ${isLast ? "bg-green-500" : "bg-primary-700"} transition-all`}
                style={{ height: `${Math.max(height, 3)}%` }}
              />
              <div className="text-caption text-neutral-600 mt-2 text-center">
                <div className="font-semibold">{w.waveCode}</div>
                <div className="text-[10px]">n = {w.n}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-caption text-neutral-600 text-center mt-2">
        {selected.unit}
      </div>
    </div>
  );
}