import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowRight, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

export interface SyncConflict<T> {
  entityName: string;
  entityId: string;
  local: T;
  remote: T;
  localModifiedAt: string;
  remoteModifiedAt: string;
  fields: { name: string; localValue: unknown; remoteValue: unknown }[];
}

export interface SyncConflictModalProps<T> {
  open: boolean;
  conflict: SyncConflict<T> | null;
  onResolve: (choice: "local" | "remote" | "merge") => void;
  onCancel: () => void;
}

export function SyncConflictModal<T>({
  open,
  conflict,
  onResolve,
  onCancel,
}: SyncConflictModalProps<T>) {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<"local" | "remote" | "merge">("remote");

  if (!conflict) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t("syncConflict.title")}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Resolve later
          </Button>
          <Button variant="primary" onClick={() => onResolve(choice)}>
            Apply choice
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
          <div>
            <p className="text-body-sm font-semibold text-primary-900">
              {t("syncConflict.subtitle", { entity: conflict.entityName })}
            </p>
            <p className="text-caption text-neutral-600 mt-1">
              <code>{conflict.entityId}</code>
            </p>
          </div>
        </div>

        <table className="w-full text-body-sm border border-neutral-300 rounded-md overflow-hidden">
          <thead>
            <tr className="bg-neutral-100">
              <th className="text-left px-3 py-2 text-caption font-bold uppercase text-neutral-600">
                Field
              </th>
              <th className="text-left px-3 py-2 text-caption font-bold uppercase text-neutral-600">
                <div className="flex items-center gap-2">
                  Local
                  <Chip tone="amber">
                    {conflict.localModifiedAt.slice(0, 16).replace("T", " ")}
                  </Chip>
                </div>
              </th>
              <th className="text-left px-3 py-2 text-caption font-bold uppercase text-neutral-600">
                <div className="flex items-center gap-2">
                  Server
                  <Chip tone="blue">
                    {conflict.remoteModifiedAt.slice(0, 16).replace("T", " ")}
                  </Chip>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {conflict.fields.map((f) => (
              <tr key={f.name} className="border-t border-neutral-200">
                <td className="px-3 py-2 font-semibold">{f.name}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      f.localValue !== f.remoteValue ? "text-amber-700" : ""
                    }
                  >
                    {String(f.localValue ?? "—")}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      f.localValue !== f.remoteValue
                        ? "text-primary-700 font-semibold"
                        : ""
                    }
                  >
                    {String(f.remoteValue ?? "—")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <fieldset className="space-y-2">
          <legend className="text-caption font-semibold text-primary-900">
            Choose resolution
          </legend>
          {[
            {
              value: "local",
              label: t("syncConflict.useLocal"),
              hint: "Keep your offline edits",
            },
            {
              value: "remote",
              label: t("syncConflict.useRemote"),
              hint: "Accept the server version",
            },
            {
              value: "merge",
              label: t("syncConflict.merge"),
              hint: "Combine non-conflicting fields",
            },
          ].map((o) => (
            <label
              key={o.value}
              className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer ${
                choice === o.value
                  ? "border-primary-700 bg-primary-100"
                  : "border-neutral-300 hover:border-primary-300"
              }`}
            >
              <input
                type="radio"
                name="resolution"
                value={o.value}
                checked={choice === o.value}
                onChange={() => setChoice(o.value as any)}
                className="mt-1"
              />
              <div>
                <div className="text-body-sm font-semibold">{o.label}</div>
                <div className="text-caption text-neutral-600">{o.hint}</div>
              </div>
              {choice === o.value && (
                <Check
                  className="h-4 w-4 text-primary-700 ml-auto"
                  aria-hidden
                />
              )}
            </label>
          ))}
        </fieldset>
      </div>
    </Modal>
  );
}