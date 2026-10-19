import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function TabBeneficiaries({ projectId }: { projectId: string }) {
  return (
    <EmptyState
      title="Beneficiaries are managed centrally"
      description={`Beneficiary and service-delivery records linked to project ${projectId} are maintained in the Beneficiaries module.`}
      action={
        <Link to="/beneficiaries">
          <Button variant="secondary">Open Beneficiaries</Button>
        </Link>
      }
    />
  );
}
