import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { useDiD } from "./analytics.queries";

export function TreatmentVsControl({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  // In production, indicator and group IDs are selectors
  const { data, isLoading } = useDiD(
    projectId,
    "ind-income-001",
    "tg-treatment",
    "tg-control",
  );

  return (
    <Card>
      <CardHeader
        title={t("analytics.did.title")}
        subtitle={t("analytics.did.subtitle")}
      />
      {isLoading && (
        <p className="text-body-sm text-neutral-600">Computing DiD…</p>
      )}
      {!isLoading && !data && (
        <p className="text-body-sm text-neutral-600">
          {t("analytics.did.noData")}
        </p>
      )}
      {data && (
        <>
          <table className="w-full text-body-sm mb-4">
            <thead>
              <tr className="border-b border-neutral-300 text-left">
                <th className="py-2 text-caption uppercase text-neutral-600"></th>
                <th className="py-2 text-right text-caption uppercase text-neutral-600">
                  Baseline
                </th>
                <th className="py-2 text-right text-caption uppercase text-neutral-600">
                  Endline
                </th>
                <th className="py-2 text-right text-caption uppercase text-neutral-600">
                  Change
                </th>
                <th className="py-2 text-right text-caption uppercase text-neutral-600">
                  n
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100">
                <td className="py-2 font-semibold">Treatment</td>
                <td className="py-2 text-right">
                  {data.treatment.baseline.toFixed(1)}
                </td>
                <td className="py-2 text-right">
                  {data.treatment.endline.toFixed(1)}
                </td>
                <td className="py-2 text-right font-bold text-green-700">
                  +{data.treatmentChange.toFixed(1)}
                </td>
                <td className="py-2 text-right text-caption">
                  {data.treatment.n}
                </td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="py-2 font-semibold">Control</td>
                <td className="py-2 text-right">
                  {data.control.baseline.toFixed(1)}
                </td>
                <td className="py-2 text-right">
                  {data.control.endline.toFixed(1)}
                </td>
                <td className="py-2 text-right">
                  {data.controlChange.toFixed(1)}
                </td>
                <td className="py-2 text-right text-caption">
                  {data.control.n}
                </td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-primary-900">DiD effect</td>
                <td colSpan={2} />
                <td className="py-3 text-right text-lg font-bold text-primary-900">
                  {data.did.toFixed(2)}
                </td>
                <td className="py-3 text-right text-caption">{data.unit}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-md">
            <Chip tone={data.significant ? "green" : "grey"}>
              {data.significant ? "✓ Significant" : "Not significant"}
            </Chip>
            <span className="text-body-sm text-neutral-600">
              p = {data.pValue.toFixed(4)} · SE = {data.stdError.toFixed(2)}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}