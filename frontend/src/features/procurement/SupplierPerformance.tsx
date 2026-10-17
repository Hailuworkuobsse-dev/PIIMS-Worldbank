import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

const MOCK_SUPPLIERS = [
  {
    supplierId: "sup-001",
    supplierName: "SolarTech Ethiopia PLC",
    contracts: 12,
    value: "8,450,000",
    onTime: 10,
    late: 2,
    qualityFlags: 0,
    score: 92,
  },
  {
    supplierId: "sup-002",
    supplierName: "Green Energy Solutions Ltd",
    contracts: 7,
    value: "4,200,000",
    onTime: 5,
    late: 2,
    qualityFlags: 1,
    score: 78,
  },
  {
    supplierId: "sup-003",
    supplierName: "Bright Homes Trading",
    contracts: 4,
    value: "1,850,000",
    onTime: 2,
    late: 2,
    qualityFlags: 3,
    score: 62,
  },
];

export function SupplierPerformance() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader
        title={t("procurement.performance.title")}
        subtitle={t("procurement.performance.subtitle")}
      />
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-left">
            <th className="py-2 text-caption font-bold uppercase text-neutral-600">
              Supplier
            </th>
            <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
              Contracts
            </th>
            <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
              Value (ETB)
            </th>
            <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
              On time
            </th>
            <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
              Late
            </th>
            <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
              Quality flags
            </th>
            <th className="py-2 text-caption font-bold uppercase text-neutral-600">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {MOCK_SUPPLIERS.map((s) => (
            <tr key={s.supplierId} className="border-b border-neutral-100">
              <td className="py-2 font-semibold">{s.supplierName}</td>
              <td className="py-2 text-right">{s.contracts}</td>
              <td className="py-2 text-right">{s.value}</td>
              <td className="py-2 text-right text-green-700 font-bold">
                {s.onTime}
              </td>
              <td className="py-2 text-right text-amber-700 font-bold">
                {s.late}
              </td>
              <td className="py-2 text-right text-red-700 font-bold">
                {s.qualityFlags}
              </td>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <Progress
                      value={s.score}
                      tone={
                        s.score >= 85
                          ? "success"
                          : s.score >= 65
                            ? "warning"
                            : "danger"
                      }
                    />
                  </div>
                  <span className="text-caption font-bold">{s.score}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}