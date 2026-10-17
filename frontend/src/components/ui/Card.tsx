import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

const pad = { none: "p-0", sm: "p-3", md: "p-4", lg: "p-6" };

export function Card({
  padding = "md",
  hoverable,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-neutral-300 rounded-md shadow-sm",
        pad[padding],
        hoverable &&
          "hover:border-primary-300 hover:shadow-md transition cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-3">
      <div>
        <h3 className="text-h3 text-primary-900">{title}</h3>
        {subtitle && (
          <p className="text-caption text-neutral-600 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}