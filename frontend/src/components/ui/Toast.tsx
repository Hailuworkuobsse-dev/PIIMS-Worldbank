import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "./utils/cn";

export type ToastType = "success" | "info" | "warning" | "error";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastCtx {
  push: (type: ToastType, message: string, duration?: number) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden />,
  info: <Info className="h-5 w-5 text-blue-500" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />,
  error: <XCircle className="h-5 w-5 text-red-500" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback(
    (id: string) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  const push = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = crypto.randomUUID();
      setToasts((t) => [...t, { id, type, message, duration }]);
      if (duration > 0) setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[400px] px-4 py-3 rounded-md shadow-lg bg-white border-l-4",
              t.type === "success" && "border-l-green-500",
              t.type === "info" && "border-l-blue-500",
              t.type === "warning" && "border-l-amber-500",
              t.type === "error" && "border-l-red-500",
            )}
          >
            {icons[t.type]}
            <div className="flex-1 text-body-sm text-neutral-900">
              {t.message}
            </div>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
              className="text-neutral-600 hover:text-neutral-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}