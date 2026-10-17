import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface IdleTimeoutWarningProps {
  open: boolean;
  onExtend: () => void;
  onLogout: () => void;
  secondsLeft?: number;
}

export function IdleTimeoutWarning({
  open,
  onExtend,
  onLogout,
  secondsLeft = 120,
}: IdleTimeoutWarningProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onExtend}
      title="Session about to expire"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onLogout}>
            {t("actions.signOut")}
          </Button>
          <Button ref={ref} onClick={onExtend}>
            Stay signed in
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-neutral-600">
        Your session will expire in about {Math.floor(secondsLeft / 60)} minute
        {secondsLeft >= 120 ? "s" : ""} due to inactivity. Choose{" "}
        <b>Stay signed in</b> to continue working, or sign out now.
      </p>
    </Modal>
  );
}