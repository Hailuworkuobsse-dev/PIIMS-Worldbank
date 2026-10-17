import { cn } from "./utils/cn";

export function Progress({
  value,
  max = 100,
  label,
  tone = "primary",
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  tone?: "primary" | "success" | "warning" | "danger";
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barCls = {
    primary: "bg-primary-700",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  }[tone];

  return (
    <div className={className}>
      <div
        className="h-2.5 w-full bg-neutral-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        <div
          className={cn("h-full transition-all", barCls)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && (
        <div className="text-caption text-neutral-600 mt-1">{label}</div>
      )}
    </div>
  );
}