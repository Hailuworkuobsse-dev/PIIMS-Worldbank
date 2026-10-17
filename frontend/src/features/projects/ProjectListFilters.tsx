import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import {
  PROJECT_STATUSES,
  PROJECT_SECTORS,
  type ProjectStatus,
  type ProjectSector,
} from "./project.types";
import { statusLabelKey, sectorLabelKey, statusTone } from "./project.utils";

const ETHIOPIAN_REGIONS = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Dire Dawa",
  "Gambella",
  "Harari",
  "Oromia",
  "Sidama",
  "SNNP",
  "Somali",
  "South West Ethiopia",
  "Tigray",
];

export interface ProjectListFiltersProps {
  q: string;
  status: ProjectStatus[];
  sector: ProjectSector[];
  region: string;
  onChange: (patch: Record<string, string | undefined>) => void;
}

export function ProjectListFilters({
  q,
  status,
  sector,
  region,
  onChange,
}: ProjectListFiltersProps) {
  const { t } = useTranslation();
  const [localQ, setLocalQ] = useState(q);

  // Debounce search 300 ms
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (localQ !== q) onChange({ q: localQ || undefined });
    }, 300);
    return () => window.clearTimeout(id);
  }, [localQ, q, onChange]);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  const toggleStatus = (s: ProjectStatus) => {
    const next = status.includes(s)
      ? status.filter((x) => x !== s)
      : [...status, s];
    onChange({ status: next.length ? next.join(",") : undefined });
  };
  const toggleSector = (s: ProjectSector) => {
    const next = sector.includes(s)
      ? sector.filter((x) => x !== s)
      : [...sector, s];
    onChange({ sector: next.length ? next.join(",") : undefined });
  };

  const hasFilters = !!(q || status.length || sector.length || region);

  return (
    <section
      aria-label={t("projects.actions.filters")}
      className="bg-white border border-neutral-300 rounded-md p-4 space-y-3"
    >
      <div className="grid md:grid-cols-3 gap-3">
        <Input
          label={t("projects.filters.searchPlaceholder")}
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          rightSlot={
            localQ ? (
              <button
                type="button"
                aria-label={t("projects.actions.clearFilters")}
                onClick={() => {
                  setLocalQ("");
                  onChange({ q: undefined });
                }}
                className="p-1 rounded hover:bg-neutral-100"
              >
                <X className="h-4 w-4 text-neutral-600" />
              </button>
            ) : undefined
          }
        />
        <Select
          label={t("projects.filters.region")}
          placeholder="—"
          value={region}
          onChange={(e) => onChange({ region: e.target.value || undefined })}
          options={ETHIOPIAN_REGIONS.map((r) => ({ value: r, label: r }))}
        />
        <div className="flex items-end">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalQ("");
                onChange({
                  q: undefined,
                  status: undefined,
                  sector: undefined,
                  region: undefined,
                });
              }}
            >
              {t("projects.actions.clearFilters")}
            </Button>
          )}
        </div>
      </div>

      <div>
        <div className="text-caption font-semibold text-neutral-600 mb-1.5">
          {t("projects.filters.status")}
        </div>
        <div className="flex flex-wrap gap-2">
          {PROJECT_STATUSES.map((s) => {
            const selected = status.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleStatus(s)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 rounded-full"
              >
                <Chip
                  tone={selected ? statusTone(s) : "grey"}
                  className={
                    selected
                      ? "ring-1 ring-offset-1 ring-primary-300"
                      : "opacity-70 hover:opacity-100"
                  }
                >
                  {t(statusLabelKey(s))}
                </Chip>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-caption font-semibold text-neutral-600 mb-1.5">
          {t("projects.filters.sector")}
        </div>
        <div className="flex flex-wrap gap-2">
          {PROJECT_SECTORS.map((s) => {
            const selected = sector.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleSector(s)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 rounded-full"
              >
                <Chip
                  tone={selected ? "blue" : "grey"}
                  className={
                    selected
                      ? "ring-1 ring-offset-1 ring-primary-300"
                      : "opacity-70 hover:opacity-100"
                  }
                >
                  {t(sectorLabelKey(s))}
                </Chip>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}