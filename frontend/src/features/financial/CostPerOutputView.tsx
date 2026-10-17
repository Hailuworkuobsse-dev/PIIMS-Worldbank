import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCostPerOutput } from "./financial.queries";
import { formatMoney } from "@/lib/utils/currency";

export function CostPerOutputView({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useCostPerOutput(projectId);

  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState title="No cost-per-output data yet" />;

  return (
    <Card>
      <CardHeader
        title={t("financial.costPerOutput.title")}
        subtitle={t("financial.costPerOutput.subtitle")}
      />
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-left">
            <th className="py-2 text-caption font-bold uppercase text-neutral-600">
              Indicator
            </th>
            <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
              Actual
            </th>
            <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
              Expended (ETB)
            </th>
            <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
              Cost per unit
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.indicatorId} className="border-b border-neutral-100">
              <td className="py-2">
                <code className="text-caption text-primary-700">
                  {r.indicatorCode}
                </code>
                <div className="font-semibold">{r.indicatorName}</div>
              </td>
              <td className="py-2 text-right">
                {r.actualValue.toLocaleString()}{" "}
                <span className="text-caption text-neutral-600">{r.unit}</span>
              </td>
              <td className="py-2 text-right">
                {formatMoney(r.expendedEtb, "ETB")}
              </td>
              <td className="py-2 text-right font-bold">
                {formatMoney(r.costPerUnitEtb, "ETB")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}