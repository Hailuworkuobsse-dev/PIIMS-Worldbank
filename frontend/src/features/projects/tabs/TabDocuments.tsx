import { Link } from "react-router-dom";
import { useDocuments } from "@/features/documents/document.queries";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

export function TabDocuments({ projectId }: { projectId: string }) {
  const { data, isLoading } = useDocuments({ projectId, limit: 20 });
  const docs = data?.data ?? [];

  if (isLoading) return <LoadingState message="Loading documents…" />;

  if (!docs.length) {
    return (
      <EmptyState
        title="No documents"
        description="Documents uploaded against this project appear here."
        action={
          <Link to="/documents">
            <span className="text-body-sm text-primary-700 underline">
              Open Documents module
            </span>
          </Link>
        }
      />
    );
  }

  return (
    <Card padding="none">
      <ul className="divide-y divide-neutral-200">
        {docs.map((d) => (
          <li
            key={d.docId}
            className="flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-neutral-900 truncate">
                {d.title}
              </p>
              <p className="text-caption text-neutral-600">
                v{d.version} · {(d.fileSize / 1024).toFixed(0)} KB
              </p>
            </div>
            <Chip tone="grey">{d.docType}</Chip>
          </li>
        ))}
      </ul>
    </Card>
  );
}
