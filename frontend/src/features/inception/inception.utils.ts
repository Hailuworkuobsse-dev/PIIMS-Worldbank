import type { ChipTone } from "@/components/ui/Chip";
import type { ReportStatus } from "./inception.types";

export function reportStatusTone(s: ReportStatus): ChipTone {
  switch (s) {
    case "DRAFT":
      return "grey";
    case "SUBMITTED":
      return "blue";
    case "UNDER_REVIEW":
      return "amber";
    case "REVISION_REQUIRED":
      return "amber";
    case "APPROVED":
      return "green";
    case "REJECTED":
      return "red";
  }
}

export function reportStatusKey(s: ReportStatus): string {
  return `inception.status.${s.toLowerCase()}`;
}

export function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function deadlineTone(days: number): ChipTone {
  if (days < 0) return "red";
  if (days <= 7) return "red";
  if (days <= 30) return "amber";
  return "green";
}