import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { useUIStore } from "@/stores/ui.store";

export function KeyboardHelp() {
  const { t } = useTranslation();
  const { keyboardHelpOpen, setKeyboardHelpOpen } = useUIStore();

  const rows: [string, string][] = [
    ["⌘K / Ctrl+K", t("shell.shortcuts.openSearch")],
    ["/", t("shell.shortcuts.focusSearch")],
    ["g d", t("shell.shortcuts.goDashboard")],
    ["g p", t("shell.shortcuts.goProjects")],
    ["g i", t("shell.shortcuts.goImpact")],
    ["Esc", t("shell.shortcuts.closeDialog")],
    ["?", t("shell.shortcuts.showHelp")],
  ];

  return (
    <Modal
      open={keyboardHelpOpen}
      onClose={() => setKeyboardHelpOpen(false)}
      title={t("shell.keyboardShortcuts")}
      size="sm"
    >
      <dl className="divide-y divide-neutral-100">
        {rows.map(([k, label]) => (
          <div key={k} className="flex items-center justify-between py-2.5">
            <dt className="text-body-sm text-neutral-900">{label}</dt>
            <dd>
              <kbd className="inline-block px-2 py-0.5 rounded border border-neutral-300 bg-neutral-50 text-caption font-bold text-neutral-700">
                {k}
              </kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}