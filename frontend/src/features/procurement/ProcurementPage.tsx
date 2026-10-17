import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useProcurement } from "./procurement.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { ProcurementTable } from "./ProcurementTable";
import { ProcurementTimeline } from "./ProcurementTimeline";
import { ContractRegister } from "./ContractRegister";
import { DelayAlerts } from "./DelayAlerts";
import { ProcurementFormModal } from "./ProcurementFormModal";
import { ContractFormModal } from "./ContractFormModal";
import { SupplierPerformance } from "./SupplierPerformance";

export default function ProcurementPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { can } = usePermissions();
  const [procurementOpen, setProcurementOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  const projectId = params.get("projectId") ?? "PIIMS-2026-0042";
  const { data, isLoading } = useProcurement({ projectId, limit: 100 });

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("procurement.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            <code className="text-primary-700 font-bold">{projectId}</code> ·{" "}
            {data?.data.length ?? 0} plan line(s)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(PERMISSIONS.contractWrite) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setContractOpen(true)}
            >
              {t("procurement.actions.newContract")}
            </Button>
          )}
          {can(PERMISSIONS.procurementWrite) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setProcurementOpen(true)}
            >
              {t("procurement.actions.newLine")}
            </Button>
          )}
        </div>
      </header>

      <DelayAlerts projectId={projectId} />

      <Tabs
        tabs={[
          {
            id: "plan",
            label: t("procurement.tabs.plan"),
            content: (
              <ProcurementTable
                procurement={data?.data ?? []}
                loading={isLoading}
              />
            ),
          },
          {
            id: "timeline",
            label: t("procurement.tabs.timeline"),
            content: <ProcurementTimeline procurement={data?.data ?? []} />,
          },
          {
            id: "contracts",
            label: t("procurement.tabs.contracts"),
            content: <ContractRegister projectId={projectId} />,
          },
          {
            id: "performance",
            label: t("procurement.tabs.performance"),
            content: <SupplierPerformance />,
          },
        ]}
      />

      <ProcurementFormModal
        open={procurementOpen}
        onClose={() => setProcurementOpen(false)}
        defaultProjectId={projectId}
      />
      <ContractFormModal
        open={contractOpen}
        onClose={() => setContractOpen(false)}
        defaultProjectId={projectId}
      />
    </main>
  );
}