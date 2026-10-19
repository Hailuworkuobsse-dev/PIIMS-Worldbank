import { EmptyState } from "@/components/ui/EmptyState";

export function TabDocuments({ projectId }: { projectId: string }) {
  return (
    <EmptyState
      title="Project documents are not available yet"
      description={`Document records for project ${projectId} are not connected to this project view yet.`}
    />
  );
}
