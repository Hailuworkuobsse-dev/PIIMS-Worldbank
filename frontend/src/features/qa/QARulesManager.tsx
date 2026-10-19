import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { useQARules } from "./qa.queries";
import { useToggleRule } from "./qa.mutations";
import { useDeleteQARule } from "./qa.rules.mutations";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QARuleFormModal } from "./QARuleFormModal";
import type { ChipTone } from "@/components/ui/Chip";
import { type QARule, type QASeverity } from "./qa.types";

const SEVERITY_TONE: Record<QASeverity, ChipTone> = {
  LOW: "grey",
  MEDIUM: "amber",
  HIGH: "red",
  CRITICAL: "red",
};

export function QARulesManager() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data: rules, isLoading } = useQARules();
  const toggle = useToggleRule();
  const del = useDeleteQARule();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QARule | null>(null);
  const [deleting, setDeleting] = useState<QARule | null>(null);

  if (isLoading) return <LoadingState message="Loading QA rules…" />;

  const canEdit = can(PERMISSIONS.qaRules);

  return (
    <Card>
      <CardHeader
        title={t("qa.rules.title")}
        subtitle={t("qa.rules.subtitle")}
        action={
          canEdit && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              {t("qa.rules.new")}
            </Button>
          )
        }
      />

      {!rules?.length ? (
        <EmptyState
          title={t("qa.rules.empty")}
          description={t("qa.rules.emptyHint")}
        />
      ) : (
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left">
              <th className="py-2 text-caption uppercase text-neutral-600">
                Code
              </th>
              <th className="py-2 text-caption uppercase text-neutral-600">
                Name
              </th>
              <th className="py-2 text-caption uppercase text-neutral-600">
                Type
              </th>
              <th className="py-2 text-caption uppercase text-neutral-600">
                Severity
              </th>
              <th className="py-2 text-caption uppercase text-neutral-600">
                Threshold
              </th>
              <th className="py-2 text-caption uppercase text-neutral-600">
                Active
              </th>
              <th className="py-2 text-caption uppercase text-neutral-600"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.ruleId} className="border-b border-neutral-100">
                <td className="py-2">
                  <code className="text-caption font-bold text-primary-700">
                    {r.code}
                  </code>
                </td>
                <td className="py-2">{r.name}</td>
                <td className="py-2">
                  <Chip tone="blue">{r.type}</Chip>
                </td>
                <td className="py-2">
                  <Chip tone={SEVERITY_TONE[r.severity]}>{r.severity}</Chip>
                </td>
                <td className="py-2">
                  <code className="text-caption text-neutral-600">
                    {Object.entries(r.threshold)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")}
                  </code>
                </td>
                <td className="py-2">
                  <Chip tone={r.active ? "green" : "grey"}>
                    {r.active ? "Active" : "Disabled"}
                  </Chip>
                </td>
                <td className="py-2 text-right">
                  {canEdit && (
                    <div className="inline-flex items-center gap-1">
                      <IconButton
                        label={r.active ? "Disable rule" : "Enable rule"}
                        icon={<Power className="h-3.5 w-3.5" />}
                        size="sm"
                        variant="ghost"
                        loading={toggle.isPending}
                        onClick={() =>
                          toggle.mutate({ ruleId: r.ruleId, active: !r.active })
                        }
                      />
                      <IconButton
                        label="Edit rule"
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(r);
                          setFormOpen(true);
                        }}
                      />
                      <IconButton
                        label="Delete rule"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleting(r)}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <QARuleFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        rule={editing ?? undefined}
      />

      <ConfirmDialog
        open={!!deleting}
        danger
        title={t("qa.rules.deleteConfirmTitle")}
        message={t("qa.rules.deleteConfirmMessage", {
          code: deleting?.code ?? "",
        })}
        confirmLabel={t("actions.delete")}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) del.mutate(deleting.ruleId);
          setDeleting(null);
        }}
      />
    </Card>
  );
}