import { ContractRegister } from "@/features/procurement/ContractRegister";
import { DelayAlerts } from "@/features/procurement/DelayAlerts";

export function TabProcurement({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-4">
      <DelayAlerts projectId={projectId} />
      <ContractRegister projectId={projectId} />
    </div>
  );
}
