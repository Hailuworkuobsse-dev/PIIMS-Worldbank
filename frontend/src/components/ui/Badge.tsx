// Badge.tsx
import { cn } from "./utils/cn";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "spi"
  | "rs"
  | "cf"
  | "in"
  | "pu"
  | "rd"
  | "rg";

const map: Record<BadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-600 border-neutral-300",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  danger: "bg-red-100 text-red-800 border-red-200",
  spi: "bg-purple-100 text-purple-800 border-purple-200",
  rs: "bg-red-100 text-red-800 border-red-200",
  cf: "bg-amber-100 text-amber-800 border-amber-200",
  in: "bg-blue-100 text-blue-800 border-blue-200",
  pu: "bg-green-100 text-green-800 border-green-200",
  rd: "bg-teal-100 text-teal-800 border-teal-200",
  rg: "bg-slate-800 text-slate-50 border-slate-700",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide border",
        map[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}