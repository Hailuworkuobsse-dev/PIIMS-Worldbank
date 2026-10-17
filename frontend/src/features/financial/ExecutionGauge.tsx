import { Card, CardHeader } from "@/components/ui/Card";
import { executionTone } from "./financial.utils";
import { useTranslation } from "react-i18next";
import type { FinancialExecution } from "./financial.types";

export function ExecutionGauge({
  execution,
}: {
  execution: FinancialExecution;
}) {
  const { t } = useTranslation();
  const pct = execution.executionRate;
  const tone = executionTone(pct);

  const color =
    tone === "success" ? "#16A34A" : tone === "warning" ? "#D97706" : "#DC2626";
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <Card>
      <CardHeader
        title={t("financial.execution.title")}
        subtitle={t("financial.execution.subtitle")}
      />
      <div className="flex flex-col items-center">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          role="img"
          aria-label={`Execution rate ${pct.toFixed(1)}%`}
        >
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="14"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform="rotate(-90 80 80)"
          />
          <text
            x="80"
            y="80"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="28"
            fontWeight="800"
            fill="#0B1E3D"
          >
            {pct.toFixed(0)}%
          </text>
          <text x="80" y="108" textAnchor="middle" fontSize="11" fill="#475569">
            executed
          </text>
        </svg>
      </div>
    </Card>
  );
}