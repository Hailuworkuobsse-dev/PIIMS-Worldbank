import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Pencil, MoreVertical } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { TrafficLight } from "@/components/ui/TrafficLight";
import { statusTone, statusLabelKey, sectorLabelKey } from "./project.utils";
import { formatMoney } from "@/lib/utils/currency";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { useAdvanceStage } from "./project.mutations";
import { Modal } from "@/components/ui/Modal";
import { Checkbox } from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/Textarea";
import { STAGE_ORDER, type Project } from "./project.types";

export function ProjectDetailHeader({ project }: { project: Project }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const advance = useAdvanceStage(project.projectId);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const currentIdx = STAGE_ORDER.indexOf(project.status);
  const nextStage =
    STAGE_ORDER[Math.min(currentIdx + 1, STAGE_ORDER.length - 1)];

  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-caption text-neutral-600">
            <code className="font-bold text-primary-700">
              {project.projectCode}
            </code>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span>{project.ownerOrgName ?? project.ownerOrgId}</span>
          </div>
          <h1 className="text-h1 text-primary-900 mt-1">{project.name}</h1>
          {project.nameAm && (
            <p lang="am" className="text-body-sm text-neutral-600 mt-0.5">
              {project.nameAm}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Chip tone={statusTone(project.status)}>
              {t(statusLabelKey(project.status))}
            </Chip>
            <Chip tone="blue">{t(sectorLabelKey(project.sector))}</Chip>
            {project.location?.region && (
              <Chip tone="grey">{project.location.region}</Chip>
            )}
            <span className="text-caption text-neutral-600 font-semibold ml-2">
              {formatMoney(
                project.totalBudget.amount,
                project.totalBudget.currency,
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {can(PERMISSIONS.projectWrite) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Pencil className="h-4 w-4" />}
            >
              {t("projects.actions.edit")}
            </Button>
          )}
          {can(PERMISSIONS.projectApprove) &&
            project.status !== "CLOSED" &&
            project.status !== "CANCELLED" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAdvanceOpen(true)}
              >
                {t("projects.actions.advance")}
              </Button>
            )}
          <IconButton
            label="More actions"
            icon={<MoreVertical className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-neutral-300 rounded-md p-3">
        <Stat
          label={t("projects.detail.fields.start")}
          value={project.startDate ?? "—"}
        />
        <Stat
          label={t("projects.detail.fields.end")}
          value={project.endDate ?? "—"}
        />
        <Stat
          label={t("projects.detail.fields.wbCredit")}
          value={project.wbCreditNo ?? "—"}
        />
        <div>
          <div className="text-caption text-neutral-600">
            {t("projects.columns.progress")}
          </div>
          <div className="mt-1">
            <TrafficLight status="ON_TRACK" percent={72} />
          </div>
        </div>
      </div>

      <Modal
        open={advanceOpen}
        onClose={() => setAdvanceOpen(false)}
        title={t("projects.detail.advance.title")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdvanceOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={advance.isPending}
              onClick={async () => {
                await advance.mutateAsync({
                  targetStage: nextStage,
                  checklist,
                  notes,
                });
                setAdvanceOpen(false);
              }}
            >
              {t("projects.detail.advance.confirm")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div>
              <div className="text-caption text-neutral-600">
                {t("projects.detail.advance.currentStage")}
              </div>
              <Chip tone={statusTone(project.status)} className="mt-1">
                {t(statusLabelKey(project.status))}
              </Chip>
            </div>
            <div>
              <div className="text-caption text-neutral-600">
                {t("projects.detail.advance.targetStage")}
              </div>
              <Chip tone={statusTone(nextStage)} className="mt-1">
                {t(statusLabelKey(nextStage))}
              </Chip>
            </div>
          </div>

          <fieldset>
            <legend className="text-caption font-semibold text-neutral-600 mb-2">
              {t("projects.detail.advance.checklist")}
            </legend>
            <div className="space-y-2">
              {[
                "Profile complete",
                "Feasibility study uploaded",
                "Budget confirmed",
                "Owner approval received",
              ].map((c) => (
                <Checkbox
                  key={c}
                  label={c}
                  checked={!!checklist[c]}
                  onChange={(e) =>
                    setChecklist((s) => ({ ...s, [c]: e.target.checked }))
                  }
                />
              ))}
            </div>
          </fieldset>

          <Textarea
            label={t("projects.detail.advance.notes")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-caption text-neutral-600">{label}</div>
      <div className="font-semibold text-neutral-900 text-body-sm mt-0.5">
        {value}
      </div>
    </div>
  );
}