import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, LayoutGrid, List } from "lucide-react";
import { useGrievances } from "./grievance.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GrievanceKanban } from "./GrievanceKanban";
import { GrievanceList } from "./GrievanceList";
import { GrievanceIntakeModal } from "./GrievanceIntakeModal";
import { GrievanceDetailDrawer } from "./GrievanceDetailDrawer";
import { SlaTracker } from "./SlaTracker";
import { GrievanceAnalytics } from "./GrievanceAnalytics";
import {
  GRIEVANCE_STATUSES,
  type Grievance,
  type GrievanceStatus,
} from "./grievance.types";
import { statusTone, statusKey } from "./grievance.utils";
import { cn } from "@/components/ui/utils/cn";

export default function GrievancePage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const { can } = usePermissions();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [selected, setSelected] = useState<Grievance | null>(null);

  const status = (params.get("status")?.split(",").filter(Boolean) ??
    []) as GrievanceStatus[];
  const projectId = params.get("projectId") ?? undefined;

  const { data, isLoading } = useGrievances({
    projectId,
    status: status.length ? status : undefined,
    limit: 200,
  });

  const list = data?.data ?? [];

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setParams(next, { replace: true });
  };

  const toggleStatus = (s: GrievanceStatus) => {
    const next = status.includes(s)
      ? status.filter((x) => x !== s)
      : [...status, s];
    updateParams({ status: next.length ? next.join(",") : undefined });
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("grievance.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {list.length} {t("grievance.records")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-neutral-300 overflow-hidden">
            <button
              type="button"
              aria-pressed={view === "kanban"}
              onClick={() => setView("kanban")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-caption font-semibold",
                view === "kanban"
                  ? "bg-primary-700 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden /> Kanban
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-caption font-semibold",
                view === "list"
                  ? "bg-primary-700 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100",
              )}
            >
              <List className="h-3.5 w-3.5" aria-hidden /> List
            </button>
          </div>
          {can(PERMISSIONS.grievanceWrite) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIntakeOpen(true)}
            >
              {t("grievance.intake")}
            </Button>
          )}
        </div>
      </header>

      <section className="bg-white border border-neutral-300 rounded-md p-3 flex flex-wrap gap-2 items-center">
        {GRIEVANCE_STATUSES.map((s) => {
          const active = status.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => toggleStatus(s)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 rounded-full"
            >
              <Chip tone={active ? statusTone(s) : "grey"}>
                {t(statusKey(s))}
              </Chip>
            </button>
          );
        })}
        {status.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateParams({ status: undefined })}
          >
            {t("grievance.clear")}
          </Button>
        )}
      </section>

      <SlaTracker projectId={projectId} />

      {view === "kanban" ? (
        <GrievanceKanban
          grievances={list}
          loading={isLoading}
          onSelect={setSelected}
        />
      ) : (
        <GrievanceList
          grievances={list}
          loading={isLoading}
          onSelect={setSelected}
        />
      )}

      <GrievanceAnalytics projectId={projectId} />

      <GrievanceIntakeModal
        open={intakeOpen}
        onClose={() => setIntakeOpen(false)}
      />

      <GrievanceDetailDrawer
        grievance={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </main>
  );
}