import { type ReactNode } from "react";
import { cn } from "./utils/cn";

export type KPITone = "default" | "success" | "warning" | "danger" | "accent";

const toneCls: Record<KPITone, string> = {
  default: "border-t-primary-700",
  success: "border-t-green-500",
  warning: "border-t-amber-500",
  danger: "border-t-red-500",
  accent: "border-t-accent-500",
};

export interface KPITileProps {
  label: string;
  value: ReactNode;
  delta?: { value: string; direction?: "up" | "down" | "flat" };
  tone?: KPITone;
  className?: string;
}

export function KPITile({
  label,
  value,
  delta,
  tone = "default",
  className,
}: KPITileProps) {
  return (
    <div
      className={cn(
        "bg-white border border-neutral-300 border-t-[3px] rounded-md p-4",
        toneCls[tone],
        className,
      )}
    >
      <div className="text-[26px] font-extrabold text-primary-900 leading-tight">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-neutral-600 font-semibold mt-1.5">
        {label}
      </div>
      {delta && (
        <div
          className={cn(
            "text-caption font-semibold mt-1",
            delta.direction === "up" && "text-green-600",
            delta.direction === "down" && "text-red-600",
            (!delta.direction || delta.direction === "flat") &&
              "text-neutral-600",
          )}
        >
          {delta.value}
        </div>
      )}
    </div>
  );
}