import { useTranslation } from "react-i18next";
import { Users, Zap, Flame } from "lucide-react";
import { cn } from "@/components/ui/utils/cn";
import type { GeoFilters } from "./geo.types";

const LAYERS: {
  id: GeoFilters["layer"];
  icon: typeof Users;
  labelKey: string;
}[] = [
  { id: "beneficiaries", icon: Users, labelKey: "geo.layers.beneficiaries" },
  { id: "interventions", icon: Zap, labelKey: "geo.layers.interventions" },
  { id: "heatmap", icon: Flame, labelKey: "geo.layers.heatmap" },
];

export function MapControls({
  layer,
  onLayerChange,
}: {
  layer: GeoFilters["layer"];
  onLayerChange: (l: GeoFilters["layer"]) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex bg-white border border-neutral-300 rounded-md overflow-hidden">
      {LAYERS.map((l) => {
        const Icon = l.icon;
        const active = layer === l.id;
        return (
          <button
            key={l.id}
            type="button"
            aria-pressed={active}
            onClick={() => onLayerChange(l.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-caption font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-inset",
              active
                ? "bg-primary-700 text-white"
                : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {t(l.labelKey)}
          </button>
        );
      })}
    </div>
  );
}