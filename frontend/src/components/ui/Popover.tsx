import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "./utils/cn";

export interface PopoverProps {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function Popover({
  trigger,
  children,
  align = "left",
  className,
}: PopoverProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      {trigger({
        open,
        toggle: () => setOpen((s) => !s),
        "aria-expanded": open,
        "aria-controls": id,
      })}
      {open && (
        <div
          id={id}
          role="dialog"
          className={cn(
            "absolute z-40 top-full mt-2 min-w-[220px] rounded-md bg-white border border-neutral-300 shadow-lg p-3",
            align === "left" ? "left-0" : "right-0",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}