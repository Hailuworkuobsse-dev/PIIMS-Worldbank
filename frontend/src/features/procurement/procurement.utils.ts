import type { ChipTone } from "@/components/ui/Chip";
import type {
  ProcurementStatus,
  ContractStatus,
  ProcurementMethod,
} from "./procurement.types";

export function procurementStatusTone(s: ProcurementStatus): ChipTone {
  switch (s) {
    case "PLANNED":
      return "grey";
    case "ADVERTISED":
      return "blue";
    case "BID_OPEN":
      return "blue";
    case "EVALUATED":
      return "amber";
    case "AWARDED":
      return "green";
    case "CANCELLED":
      return "red";
  }
}

export function contractStatusTone(s: ContractStatus): ChipTone {
  switch (s) {
    case "DRAFT":
      return "grey";
    case "SIGNED":
      return "blue";
    case "ACTIVE":
      return "green";
    case "COMPLETED":
      return "teal";
    case "TERMINATED":
      return "red";
  }
}

export function methodTone(_m: ProcurementMethod): ChipTone {
  return "grey";
}

export function delaySeverityTone(
  s: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): ChipTone {
  return s === "CRITICAL" || s === "HIGH"
    ? "red"
    : s === "MEDIUM"
      ? "amber"
      : "grey";
}