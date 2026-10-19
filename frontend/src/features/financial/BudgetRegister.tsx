import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoney } from "@/lib/utils/currency";
import type { Budget } from "./financial.types";

export function BudgetRegister({
  budgets,
}: {
  budgets: Budget[];
  currency: string;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader
        title={t("financial.budget.title")}
        subtitle={`${budgets.length} line(s)`}
      />
      {budgets.length === 0 ? (
        <EmptyState
          title="No budget lines yet"
          description="Add budget lines to start tracking execution."
        />
      ) : (
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left">
              <th className="py-2 text-caption font-bold uppercase text-neutral-600">
                FY
              </th>
              <th className="py-2 text-caption font-bold uppercase text-neutral-600">
                Component
              </th>
              <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
                Appropriation
              </th>
              <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
                Released
              </th>
              <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
                Expended
              </th>
              <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.budgetId} className="border-b border-neutral-100">
                <td className="py-2">{b.fiscalYear}</td>
                <td className="py-2 font-semibold">
                  {b.componentId?.slice(0, 8) ?? "—"}
                </td>
                <td className="py-2 text-right">
                  {formatMoney(b.appropriation, (b.currency || currency) as any)}
                </td>
                <td className="py-2 text-right">
                  {formatMoney(b.released, (b.currency || currency) as any)}
                </td>
                <td className="py-2 text-right">
                  {formatMoney(b.expended, (b.currency || currency) as any)}
                </td>
                <td className="py-2 text-right font-bold">
                  {formatMoney(b.balance, (b.currency || currency) as any)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}