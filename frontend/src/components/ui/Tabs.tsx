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
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length]!;
      setActive(next.id);
      onChange?.(next.id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length]!;
      setActive(prev.id);
      onChange?.(prev.id);
    }
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