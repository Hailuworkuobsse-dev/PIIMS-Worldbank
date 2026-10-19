import { EmptyState } from "@/components/ui/EmptyState";

export function TabBeneficiaries({ projectId }: { projectId: string }) {
  return (
    <EmptyState
      title="Project beneficiary details are not available yet"
      description={`Beneficiary records for project ${projectId} are not connected to this project view yet.`}
    />
  );
}
