import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import {
  BENEFICIARY_STATUSES,
  type BeneficiaryStatus,
} from "./beneficiary.types";
import {
  beneficiaryStatusTone,
  beneficiaryStatusKey,
  ETHIOPIAN_REGIONS,
} from "./beneficiary.utils";

export function BeneficiaryFiltersBar({
  q,
  region,
  status,
  onChange,
}: {
  q: string;
  region: string;
  status: BeneficiaryStatus[];
  onChange: (patch: Record<string, string | undefined>) => void;
}) {
  const { t } = useTranslation();
  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (localQ !== q) onChange({ q: localQ || undefined });
    }, 300);
    return () => window.clearTimeout(id);
  }, [localQ, q, onChange]);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  const toggleStatus = (s: BeneficiaryStatus) => {
    const next = status.includes(s)
      ? status.filter((x) => x !== s)
      : [...status, s];
    onChange({ status: next.length ? next.join(",") : undefined });
  };

  const hasFilters = !!(q || region || status.length);

  return (
    <section
      aria-label={t("beneficiaries.filters.title")}
      className="bg-white border border-neutral-300 rounded-md p-4 space-y-3"
    >
      <div className="grid md:grid-cols-3 gap-3">
        <Input
          label={t("beneficiaries.filters.search")}
          placeholder={t("beneficiaries.filters.searchPlaceholder")}
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          rightSlot={
            localQ ? (
              <button
                type="button"
                onClick={() => {
                  setLocalQ("");
                  onChange({ q: undefined });
                }}
                aria-label={t("beneficiaries.filters.clear")}
                className="p-1 rounded hover:bg-neutral-100"
              >
                <X className="h-4 w-4 text-neutral-600" />
              </button>
            ) : undefined
          }
        />
        <Select
          label={t("beneficiaries.filters.region")}
          placeholder="—"
          value={region}
          onChange={(e) => onChange({ region: e.target.value || undefined })}
          options={ETHIOPIAN_REGIONS.map((r) => ({ value: r, label: r }))}
        />
        {hasFilters && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalQ("");
                onChange({
                  q: undefined,
                  region: undefined,
                  status: undefined,
                });
              }}
            >
              {t("beneficiaries.filters.clearAll")}
            </Button>
          </div>
        )}
      </div>

      <div>
        <div className="text-caption font-semibold text-neutral-600 mb-1.5">
          {t("beneficiaries.filters.status")}
        </div>
        <div className="flex flex-wrap gap-2">
          {BENEFICIARY_STATUSES.map((s) => {
            const active = status.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => toggleStatus(s)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 rounded-full"
              >
                <Chip tone={active ? beneficiaryStatusTone(s) : "grey"}>
                  {t(beneficiaryStatusKey(s))}
                </Chip>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}