import { cn } from "./utils/cn";

export type TLStatus = "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | "NOT_STARTED";

const cfg: Record<TLStatus, { label: string; cls: string; dot: string }> = {
  ON_TRACK: { label: "On-track", cls: "text-green-700", dot: "bg-green-500" },
  AT_RISK: { label: "At-risk", cls: "text-amber-700", dot: "bg-amber-500" },
  OFF_TRACK: { label: "Off-track", cls: "text-red-700", dot: "bg-red-500" },
  NOT_STARTED: {
    label: "Not started",
    cls: "text-neutral-600",
    dot: "bg-slate-400",
  },
};

export function TrafficLight({
  status,
  percent,
  className,
}: {
  status: TLStatus;
  percent?: number | undefined;
  className?: string | undefined;
}) {
  const c = cfg[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-caption font-bold",
        c.cls,
        className,
      )}
      aria-label={`Status: ${c.label}${percent != null ? ` (${percent}%)` : ""}`}
    >
      <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", c.dot)} />
      {c.label}
      {percent != null && <span className="opacity-70">· {percent}%</span>}
    </span>
  );
}