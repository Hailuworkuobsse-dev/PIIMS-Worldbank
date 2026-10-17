import type { ChipTone } from "@/components/ui/Chip";
import type {
  GrievanceStatus,
  GrievanceCategory,
  Severity,
} from "./grievance.types";

export function statusTone(s: GrievanceStatus): ChipTone {
  switch (s) {
    case "OPEN":
      return "amber";
    case "IN_PROGRESS":
      return "blue";
    case "RESOLVED":
      return "green";
    case "CLOSED":
      return "teal";
    case "ESCALATED":
      return "red";
  }
}

export function statusKey(s: GrievanceStatus): string {
  return `grievance.status.${s.toLowerCase()}`;
}

export function categoryTone(c: GrievanceCategory): ChipTone {
  switch (c) {
    case "SAFEGUARDS":
      return "red";
    case "PAYMENT":
      return "amber";
    case "SERVICE_QUALITY":
      return "blue";
    case "DELAY":
      return "amber";
    case "CONDUCT":
      return "red";
    case "OTHER":
      return "grey";
  }
}

export function categoryKey(c: GrievanceCategory): string {
  return `grievance.category.${c.toLowerCase()}`;
}

export function severityTone(s: Severity): ChipTone {
  return s === "CRITICAL"
    ? "red"
    : s === "HIGH"
      ? "red"
      : s === "MEDIUM"
        ? "amber"
        : "grey";
}

export function slaDaysRemaining(slaDue: string): number {
  return Math.ceil((Date.parse(slaDue) - Date.now()) / (1000 * 60 * 60 * 24));
}

export function slaTone(days: number): ChipTone {
  if (days < 0) return "red";
  if (days <= 1) return "red";
  if (days <= 3) return "amber";
  return "green";
}