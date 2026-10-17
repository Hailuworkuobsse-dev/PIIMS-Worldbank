import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./utils/cn";

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export function Accordion({
  items,
  defaultOpen = [],
  allowMultiple = true,
}: {
  items: AccordionItem[];
  defaultOpen?: string[];
  allowMultiple?: boolean;
}) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const toggle = (id: string) =>
    setOpen((cur) => {
      const isOpen = cur.includes(id);
      if (isOpen) return cur.filter((x) => x !== id);
      return allowMultiple ? [...cur, id] : [id];
    });

  return (
    <div className="divide-y divide-neutral-300 border border-neutral-300 rounded-md bg-white">
      {items.map((it) => {
        const isOpen = open.includes(it.id);
        return (
          <div key={it.id}>
            <h3>
              <button
                type="button"
                onClick={() => toggle(it.id)}
                aria-expanded={isOpen}
                aria-controls={`acc-${it.id}`}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50"
              >
                <span className="text-body-sm font-semibold text-primary-900">
                  {it.title}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-neutral-600 transition-transform",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            </h3>
            <div
              id={`acc-${it.id}`}
              role="region"
              hidden={!isOpen}
              className="px-4 pb-4 text-body-sm text-neutral-600"
            >
              {it.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}