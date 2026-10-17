import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFinancialExceptions } from "./financial.queries";
import { exceptionTone } from "./financial.utils";
import { formatDate } from "@/lib/utils/date";

export function ExceptionsPanel({ projectId }: { projectId?: string }) {
  const { t } = useTranslation();
  const { data } = useFinancialExceptions(projectId);
  const open = (data ?? []).filter((e) => !e.resolved);

  return (
    <Card>
      <CardHeader
        title={t("financial.exceptions.title")}
        subtitle={
          open.length === 0
            ? t("financial.exceptions.none")
            : `${open.length} open`
        }
      />
      {open.length === 0 ? (
        <EmptyState
          title="All clear"
          description="No financial exceptions detected."
          icon={<CheckCircle2 className="h-12 w-12 text-green-600" />}
        />
      ) : (
        <ul className="divide-y divide-neutral-200">
          {open.map((e) => (
            <li key={e.id} className="py-2.5 flex items-start gap-3">
              <AlertTriangle
                className="h-4 w-4 text-danger mt-0.5 shrink-0"
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold">{e.message}</div>
                <div className="text-caption text-neutral-600">
                  <code>{e.projectCode}</code> · detected{" "}
                  {formatDate(e.detectedAt)}
                </div>
              </div>
              <Chip tone={exceptionTone(e.severity)}>{e.severity}</Chip>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}