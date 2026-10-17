import { Modal } from "./Modal";
import { Button } from "./Button";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  loading,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel ?? t("actions.cancel")}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t("actions.confirm")}
          </Button>
        </>
      }
    >
      <div className="flex gap-3 items-start">
        {danger && (
          <AlertTriangle
            className="h-5 w-5 text-danger shrink-0 mt-0.5"
            aria-hidden
          />
        )}
        <p className="text-body-sm text-neutral-600">{message}</p>
      </div>
    </Modal>
  );
}