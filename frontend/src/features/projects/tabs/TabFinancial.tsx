import { useBudgets } from "@/features/financial/financial.queries";
import { BudgetRegister } from "@/features/financial/BudgetRegister";
import { CostPerOutputView } from "@/features/financial/CostPerOutputView";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

export function TabFinancial({ projectId }: { projectId: string }) {
  const { data: budgets, isLoading } = useBudgets({ projectId });

  if (isLoading) return <LoadingState message="Loading financials…" />;

  if (!budgets?.length) {
    return (
      <EmptyState
        title="No budget lines yet"
        description="Budget registers appear here once the Financial module records allocations for this project."
      />
    );
  }

  return (
    <div className="space-y-4">
      <BudgetRegister budgets={budgets} currency={budgets[0]?.currency ?? "ETB"} />
      <CostPerOutputView projectId={projectId} />
    </div>
  );
}
