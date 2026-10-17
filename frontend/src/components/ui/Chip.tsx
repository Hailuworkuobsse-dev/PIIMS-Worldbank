// Chip.tsx
import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils/cn";

export type ChipTone =
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "purple"
  | "teal"
  | "grey"
  | "dark"
  | "gold";
const toneCls: Record<ChipTone, string> = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  teal: "bg-teal-100 text-teal-800",
  grey: "bg-slate-200 text-slate-700",
  dark: "bg-slate-800 text-slate-50",
  gold: "bg-accent-300 text-primary-900",
};

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  icon?: ReactNode;
}

export function Chip({
  tone = "grey",
  icon,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-bold whitespace-nowrap",
        toneCls[tone],
        className,
      )}
      {...rest}
    >
      {icon && (
        <span aria-hidden className="shrink-0">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}