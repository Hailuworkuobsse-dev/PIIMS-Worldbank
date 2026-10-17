import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Download } from "lucide-react";
import { useExecution, useBudgets } from "./financial.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { FinancialKPIs } from "./FinancialKPIs";
import { BurnRateChart } from "./BurnRateChart";
import { ExecutionGauge } from "./ExecutionGauge";
import { ExceptionsPanel } from "./ExceptionsPanel";
import { BudgetRegister } from "./BudgetRegister";
import { BudgetFormModal } from "./BudgetFormModal";
import { CostPerOutputView } from "./CostPerOutputView";
import { formatMoney } from "@/lib/utils/currency";

export default function FinancialPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { can } = usePermissions();
  const [budgetOpen, setBudgetOpen] = useState(false);

  const projectId = params.get("projectId") ?? "PIIMS-2026-0042";
  const fiscalYear = Number(params.get("fy") ?? new Date().getFullYear());

  const { data: execution, isLoading } = useExecution(projectId, fiscalYear);
  const { data: budgets } = useBudgets({ projectId, fiscalYear });

  if (isLoading || !execution)
    return <LoadingState message="Loading financial data…" />;

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("financial.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            <code className="text-primary-700 font-bold">{projectId}</code> · FY{" "}
            {fiscalYear}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/financial/fmis")}
          >
            {t("financial.actions.viewFmis")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              const csv = [
                "Component,Appropriation,Released,Expended,Execution %",
              ]
                .concat(
                  execution.byComponent.map(
                    (c) =>
                      `${c.componentName},${c.appropriation},${c.released},${c.expended},${c.executionPct.toFixed(1)}`,
                  ),
                )
                .join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `financial-${projectId}-FY${fiscalYear}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            {t("financial.actions.export")}
          </Button>
          {can(PERMISSIONS.budgetWrite) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setBudgetOpen(true)}
            >
              {t("financial.actions.addBudget")}
            </Button>
          )}
        </div>
      </header>

      <FinancialKPIs execution={execution} />

      <div className="grid md:grid-cols-2 gap-4">
        <BurnRateChart execution={execution} />
        <ExecutionGauge execution={execution} />
      </div>

      <Tabs
        tabs={[
          {
            id: "budget",
            label: t("financial.tabs.budget"),
            content: (
              <BudgetRegister
                budgets={budgets ?? []}
                currency={execution.currency}
              />
            ),
          },
          {
            id: "by-component",
            label: t("financial.tabs.byComponent"),
            content: (
              <Card>
                <CardHeader title={t("financial.byComponent.title")} />
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="border-b border-neutral-300 text-left">
                      <th className="py-2 text-caption font-bold uppercase tracking-wide text-neutral-600">
                        Component
                      </th>
                      <th className="py-2 text-right text-caption font-bold uppercase tracking-wide text-neutral-600">
                        Appropriation
                      </th>
                      <th className="py-2 text-right text-caption font-bold uppercase tracking-wide text-neutral-600">
                        Released
                      </th>
                      <th className="py-2 text-right text-caption font-bold uppercase tracking-wide text-neutral-600">
                        Expended
                      </th>
                      <th className="py-2 text-right text-caption font-bold uppercase tracking-wide text-neutral-600">
                        Exec %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {execution.byComponent.map((c) => (
                      <tr
                        key={c.componentId}
                        className="border-b border-neutral-100"
                      >
                        <td className="py-2 font-semibold">
                          {c.componentName}
                        </td>
                        <td className="py-2 text-right">
                          {formatMoney(c.appropriation, execution.currency)}
                        </td>
                        <td className="py-2 text-right">
                          {formatMoney(c.released, execution.currency)}
                        </td>
                        <td className="py-2 text-right">
                          {formatMoney(c.expended, execution.currency)}
                        </td>
                        <td className="py-2 text-right font-bold">
                          {c.executionPct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ),
          },
          {
            id: "cost-per-output",
            label: t("financial.tabs.costPerOutput"),
            content: <CostPerOutputView projectId={projectId} />,
          },
          {
            id: "disbursements",
            label: t("financial.tabs.disbursements"),
            content: (
              <Card>
                <CardHeader
                  title={t("financial.disbursements.title")}
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate("/financial/disbursements")}
                    >
                      {t("financial.actions.viewAll")}
                    </Button>
                  }
                />
                <p className="text-body-sm text-neutral-600">
                  {t("financial.disbursements.hint")}
                </p>
              </Card>
            ),
          },
        ]}
      />

      <ExceptionsPanel />

      <BudgetFormModal
        open={budgetOpen}
        onClose={() => setBudgetOpen(false)}
        defaultProjectId={projectId}
      />
    </main>
  );
}