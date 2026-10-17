// EmptyState.tsx
import { type ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-14 px-4">
      <div className="text-6xl opacity-40 flex justify-center" aria-hidden>
        {icon ?? <Inbox className="h-14 w-14" />}
      </div>
      <h3 className="text-h3 text-primary-900 mt-3">{title}</h3>
      {description && (
        <p className="text-body-sm text-neutral-600 mt-1">{description}</p>
      )}
      {action && <div className="mt-5 inline-flex">{action}</div>}
    </div>
  );
}