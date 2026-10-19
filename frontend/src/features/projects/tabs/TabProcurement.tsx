import { EmptyState } from "@/components/ui/EmptyState";

export function TabProcurement({ projectId }: { projectId: string }) {
  return (
    <EmptyState
      title="Project procurement details are not available yet"
      description={`Procurement records for project ${projectId} are not connected to this project view yet.`}
    />
  );
}
