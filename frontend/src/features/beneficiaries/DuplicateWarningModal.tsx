import { AlertTriangle, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { dedupTone } from "./beneficiary.utils";
import type { DuplicateCandidate } from "./beneficiary.types";

export function DuplicateWarningModal({
  open,
  candidates,
  onCancel,
  onMerge,
  onProceed,
  loading,
}: {
  open: boolean;
  candidates: DuplicateCandidate[];
  onCancel: () => void;
  onMerge: (candidateId: string) => void;
  onProceed: () => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t("beneficiaries.duplicate.title")}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
          <Button variant="secondary" loading={loading} onClick={onProceed}>
            {t("beneficiaries.duplicate.proceedAnyway")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3 items-start">
          <AlertTriangle
            className="h-5 w-5 text-amber-600 mt-0.5 shrink-0"
            aria-hidden
          />
          <p className="text-body-sm text-neutral-600">
            {t("beneficiaries.duplicate.message", { count: candidates.length })}
          </p>
        </div>

        <ul className="space-y-2">
          {candidates.map((c) => (
            <li
              key={c.candidateId}
              className="border border-neutral-300 rounded-md p-3 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-body-sm font-semibold truncate">
                  {c.fullName}
                </div>
                <div className="text-caption text-neutral-600">
                  <code>{c.uniqueId}</code> · {c.woreda}, {c.region}
                </div>
                <div className="text-caption text-neutral-500 mt-1">
                  {c.matchReasons.join(" · ")}
                </div>
              </div>
              <div className="text-right shrink-0">
                <Chip tone={dedupTone(c.dedupScore)}>
                  {(c.dedupScore * 100).toFixed(0)}% match
                </Chip>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  leftIcon={<Users className="h-3.5 w-3.5" />}
                  onClick={() => onMerge(c.candidateId)}
                >
                  {t("beneficiaries.duplicate.merge")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}