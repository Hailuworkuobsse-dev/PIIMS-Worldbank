import { useId, useState, type ReactNode } from "react";
import { cn } from "./utils/cn";

export interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  className,
}: {
  tabs: TabDef[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const uid = useId();
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  const onKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    let next = idx;
    for (let i = 0; i < tabs.length; i++) {
      next = (next + dir + tabs.length) % tabs.length;
      if (!tabs[next]!.disabled) break;
    }
    const nextTab = tabs[next]!;
    if (nextTab.disabled) return;
    setActive(nextTab.id);
    onChange?.(nextTab.id);
    // roving tabindex: focus follows selection (ARIA tabs pattern)
    document.getElementById(`${uid}-tab-${nextTab.id}`)?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Tabs"
        className="flex gap-1 border-b border-neutral-300 overflow-x-auto"
      >
        {tabs.map((t, i) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={t.disabled}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => {
                setActive(t.id);
                onChange?.(t.id);
              }}
              className={cn(
                "px-4 py-2.5 text-body-sm font-semibold whitespace-nowrap border-b-2 -mb-px",
                selected
                  ? "border-primary-700 text-primary-700"
                  : "border-transparent text-neutral-600 hover:text-primary-700",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${uid}-panel-${t.id}`}
          aria-labelledby={`${uid}-tab-${t.id}`}
          hidden={active !== t.id}
          className="pt-4"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}