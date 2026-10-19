import { EmptyState } from "@/components/ui/EmptyState";

export function TabFinancial({ projectId }: { projectId: string }) {
  return (
    <EmptyState
      title="Project financial details are not available yet"
      description={`Financial records for project ${projectId} are not connected to this project view yet.`}
    />
  );
}
