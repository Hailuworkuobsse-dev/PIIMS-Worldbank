import { type ReactNode } from "react";
import { Info, AlertTriangle, CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "./utils/cn";

export type BannerTone = "info" | "warning" | "success" | "error";
const map: Record<BannerTone, { icon: ReactNode; cls: string }> = {
  info: {
    icon: <Info className="h-5 w-5" />,
    cls: "bg-blue-50 border-blue-200 text-blue-900",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    cls: "bg-amber-50 border-amber-200 text-amber-900",
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    cls: "bg-green-50 border-green-200 text-green-900",
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    cls: "bg-red-50 border-red-200 text-red-900",
  },
};

export interface BannerProps {
  tone?: BannerTone;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  action?: ReactNode;
  className?: string;
}

export function Banner({
  tone = "info",
  title,
  children,
  onDismiss,
  action,
  className,
}: BannerProps) {
  const cfg = map[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-md border",
        cfg.cls,
        className,
      )}
    >
      <span aria-hidden className="mt-0.5">
        {cfg.icon}
      </span>
      <div className="flex-1 text-body-sm">
        {title && <div className="font-bold mb-0.5">{title}</div>}
        {children}
      </div>
      {action}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="p-0.5 rounded hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}