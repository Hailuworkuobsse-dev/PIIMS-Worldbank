// LoadingState.tsx
import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-14 gap-3 text-neutral-600"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary-700" aria-hidden />
      <span className="text-body-sm">{message}</span>
    </div>
  );
}