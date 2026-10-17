import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { useProjectHistory } from "../project.queries";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export function TabHistory({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useProjectHistory(projectId);

  if (isLoading) return <LoadingState message="Loading history…" />;
  if (!data?.length) {
    return (
      <Card>
        <CardHeader title="Change history" />
        <EmptyState title="No changes recorded yet" />
      </Card>
    );
  }

  const tone = (a: string) =>
    a === "CREATE"
      ? "pu"
      : a === "UPDATE"
        ? "in"
        : a === "APPROVE"
          ? "rd"
          : a === "DELETE"
            ? "rs"
            : "cf";

  return (
    <Card>
      <CardHeader title="Change history" />
      <ol className="relative border-l-2 border-neutral-300 ml-2 space-y-5">
        {data.map((h) => (
          <li key={h.logId} className="ml-4">
            <span
              aria-hidden
              className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-primary-700"
            />
            <div className="flex items-center gap-2 text-caption text-neutral-600">
              <Badge tone={tone(h.action) as any}>{h.action}</Badge>
              <span className="font-semibold">{h.userName}</span>
              <span>· {new Date(h.at).toLocaleString()}</span>
            </div>
            <div className="mt-1 text-body-sm">
              {h.changes.map((c, i) => (
                <div key={i}>
                  <span className="font-semibold">{c.field}</span>
                  {c.before !== undefined && (
                    <>
                      {" "}
                      — from <code>{String(c.before)}</code>
                    </>
                  )}
                  {c.after !== undefined && (
                    <>
                      {" "}
                      to <code>{String(c.after)}</code>
                    </>
                  )}
                </div>
              ))}
            </div>
            {h.notes && (
              <p className="text-caption text-neutral-600 mt-1">{h.notes}</p>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}