import { useTranslation } from "react-i18next";
import { KPITile } from "@/components/ui/KPITile";
import { LoadingState } from "@/components/ui/LoadingState";
import { useSupplierDashboard } from "./supplier.queries";
import { formatMoney } from "@/lib/utils/currency";

export function SupplierDashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useSupplierDashboard();

  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPITile
        label={t("supplier.kpi.activeContracts")}
        value={String(data.activeContracts)}
      />
      <KPITile
        label={t("supplier.kpi.totalValue")}
        value={formatMoney(data.totalContractValue, "ETB")}
        tone="accent"
      />
      <KPITile
        label={t("supplier.kpi.pendingDeliveries")}
        value={String(data.pendingDeliveries)}
        tone={data.pendingDeliveries > 5 ? "warning" : "default"}
      />
      <KPITile
        label={t("supplier.kpi.paidAmount")}
        value={formatMoney(data.paidAmount, "ETB")}
        tone="success"
      />
    </div>
  );
}