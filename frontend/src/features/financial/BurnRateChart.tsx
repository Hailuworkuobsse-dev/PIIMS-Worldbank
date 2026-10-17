import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatMoney } from "@/lib/utils/currency";
import type { FinancialExecution } from "./financial.types";

/** Simple CSS-based bar chart — no external chart libs required at this step. */
export function BurnRateChart({
  execution,
}: {
  execution: FinancialExecution;
}) {
  const { t } = useTranslation();
  const total = Number(execution.totalAppropriation) || 1;

  const rows: { label: string; amount: string; color: string; key: string }[] =
    [
      {
        key: "released",
        label: t("financial.burn.released"),
        amount: execution.totalReleased,
        color: "bg-amber-500",
      },
      {
        key: "expended",
        label: t("financial.burn.expended"),
        amount: execution.totalExpended,
        color: "bg-green-500",
      },
      {
        key: "committed",
        label: t("financial.burn.committed"),
        amount: execution.totalCommitted,
        color: "bg-blue-500",
      },
    ];

  return (
    <Card>
      <CardHeader
        title={t("financial.burn.title")}
        subtitle={formatMoney(execution.totalAppropriation, execution.currency)}
      />
      <ul className="space-y-4">
        {rows.map((r) => {
          const pct = (Number(r.amount) / total) * 100;
          return (
            <li key={r.key}>
              <div className="flex justify-between text-body-sm mb-1.5">
                <span className="text-neutral-600">{r.label}</span>
                <span className="font-semibold">
                  {formatMoney(r.amount, execution.currency)}
                  <span className="text-caption text-neutral-600 ml-2">
                    ({pct.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div
                className="h-3 bg-neutral-200 rounded-full overflow-hidden"
                aria-hidden
              >
                <div
                  className={`h-full ${r.color} transition-all`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}