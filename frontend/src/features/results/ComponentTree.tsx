import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Pencil } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { useSubcomponents } from "./results.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { ComponentFormModal } from "./ComponentFormModal";
import type { Component } from "./results.types";

export interface ComponentTreeProps {
  projectId: string;
  components: Component[];
  onSelect: (id: string) => void;
  selectedId?: string;
  onChanged: () => void;
}

export function ComponentTree({
  projectId,
  components,
  onSelect,
  selectedId,
  onChanged,
}: ComponentTreeProps) {
  const { can } = usePermissions();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<
    { mode: "create" } | { mode: "edit"; component: Component } | null
  >(null);

  return (
    <div className="p-2">
      <header className="flex items-center justify-between px-2 py-2">
        <h3 className="text-h3 text-primary-900">Components</h3>
        {can(PERMISSIONS.resultWrite) && (
          <IconButton
            label="Add component"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setModal({ mode: "create" })}
          />
        )}
      </header>

      {components.length === 0 ? (
        <p className="px-2 py-4 text-caption text-neutral-600">
          No components yet.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {components.map((c) => (
            <ComponentNode
              key={c.componentId}
              component={c}
              expanded={!!expanded[c.componentId]}
              onToggle={() =>
                setExpanded((s) => ({
                  ...s,
                  [c.componentId]: !s[c.componentId],
                }))
              }
              selected={selectedId === c.componentId}
              onSelect={() => onSelect(c.componentId)}
              onEdit={() => setModal({ mode: "edit", component: c })}
              canEdit={can(PERMISSIONS.resultWrite)}
            />
          ))}
        </ul>
      )}

      {modal && (
        <ComponentFormModal
          open
          onClose={() => setModal(null)}
          projectId={projectId}
          initial={modal.mode === "edit" ? modal.component : undefined}
          onSuccess={() => {
            setModal(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function ComponentNode({
  component,
  expanded,
  onToggle,
  selected,
  onSelect,
  onEdit,
  canEdit,
}: {
  component: Component;
  expanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const { data: subs } = useSubcomponents(
    expanded ? component.componentId : undefined,
  );

  return (
    <li>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md ${selected ? "bg-primary-100" : "hover:bg-neutral-100"}`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="p-0.5 rounded hover:bg-neutral-200"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 text-left text-body-sm font-semibold truncate"
        >
          <code className="text-caption text-primary-700 mr-1">
            {component.code}
          </code>
          {component.name}
        </button>
        {canEdit && (
          <IconButton
            label="Edit component"
            size="sm"
            icon={<Pencil className="h-3.5 w-3.5" />}
            onClick={onEdit}
          />
        )}
      </div>

      {expanded && subs && (
        <ul className="ml-6 mt-0.5 space-y-0.5">
          {subs.map((s) => (
            <li
              key={s.subcomponentId}
              className="text-caption text-neutral-600 px-2 py-1"
            >
              <code className="text-primary-700 mr-1">{s.code}</code>
              {s.name}
            </li>
          ))}
          {subs.length === 0 && (
            <li className="text-caption text-neutral-500 px-2 py-1">
              No subcomponents
            </li>
          )}
        </ul>
      )}
    </li>
  );
}