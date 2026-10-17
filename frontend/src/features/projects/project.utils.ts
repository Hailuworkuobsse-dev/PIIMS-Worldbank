import type { ChipTone } from "@/components/ui/Chip";
import type { ProjectStatus, ProjectSector } from "./project.types";

export function statusTone(s: ProjectStatus): ChipTone {
  switch (s) {
    case "IDEA":
    case "PROFILE":
      return "grey";
    case "PRE_FEASIBILITY":
    case "FEASIBILITY":
    case "APPRAISAL":
      return "amber";
    case "APPROVED":
      return "blue";
    case "ACTIVE":
      return "green";
    case "CLOSED":
      return "teal";
    case "CANCELLED":
      return "red";
  }
}

export function statusLabelKey(s: ProjectStatus): string {
  return `projects.status.${s.toLowerCase()}`;
}

export function sectorTone(s: ProjectSector): ChipTone {
  return s === "ENERGY" ? "gold" : s === "WATER" ? "blue" : "grey";
}

export function sectorLabelKey(s: ProjectSector): string {
  return `projects.sector.${s.toLowerCase()}`;
}

export function progressTone(pct?: number): "success" | "warning" | "danger" {
  if (pct == null) return "warning";
  if (pct >= 85) return "success";
  if (pct >= 60) return "warning";
  return "danger";
}