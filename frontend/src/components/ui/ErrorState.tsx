// ErrorState.tsx
import { AlertOctagon } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="text-center py-14 px-4">
      <AlertOctagon className="h-14 w-14 text-red-500 mx-auto" aria-hidden />
      <h3 className="text-h3 text-primary-900 mt-3">{title}</h3>
      {message && (
        <p className="text-body-sm text-neutral-600 mt-1">{message}</p>
      )}
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}