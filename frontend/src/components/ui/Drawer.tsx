import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "./utils/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "left" | "right";
  width?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
  width = "max-w-md",
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-neutral-900/55" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-white shadow-lg h-full w-full flex flex-col",
          width,
          side === "right" ? "ml-auto" : "mr-auto",
        )}
      >
        <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-neutral-300">
          <h2 id="drawer-title" className="text-h2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-neutral-600 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}