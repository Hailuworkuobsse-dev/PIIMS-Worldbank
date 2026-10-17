import { useTranslation } from "react-i18next";
import { KPITile } from "@/components/ui/KPITile";
import { formatMoney } from "@/lib/utils/currency";
import type { FinancialExecution } from "./financial.types";

export function FinancialKPIs({
  execution,
}: {
  execution: FinancialExecution;
}) {
  const { t } = useTranslation();
  const c = execution.currency;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPITile
        label={t("financial.kpi.appropriation")}
        value={formatMoney(execution.totalAppropriation, c)}
      />
      <KPITile
        label={t("financial.kpi.released")}
        value={formatMoney(execution.totalReleased, c)}
        tone="warning"
        delta={{
          value: `${((Number(execution.totalReleased) / Number(execution.totalAppropriation)) * 100).toFixed(0)}% of appropriation`,
          direction: "flat",
        }}
      />
      <KPITile
        label={t("financial.kpi.expended")}
        value={formatMoney(execution.totalExpended, c)}
        tone="success"
        delta={{
          value: `${((Number(execution.totalExpended) / Number(execution.totalReleased)) * 100).toFixed(0)}% of released`,
          direction: "up",
        }}
      />
      <KPITile
        label={t("financial.kpi.executionRate")}
        value={`${execution.executionRate.toFixed(1)}%`}
        tone="accent"
      />
    </div>
  );
}