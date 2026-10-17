import type { ChipTone } from "@/components/ui/Chip";
import type { DisbursementStatus } from "./financial.types";

export function disbursementStatusTone(s: DisbursementStatus): ChipTone {
  switch (s) {
    case "PLANNED":
      return "grey";
    case "REQUESTED":
      return "blue";
    case "APPROVED":
      return "blue";
    case "DISBURSED":
      return "green";
    case "RECONCILED":
      return "teal";
    case "REJECTED":
      return "red";
  }
}

export function disbursementStatusKey(s: DisbursementStatus): string {
  return `financial.disbursement.status.${s.toLowerCase()}`;
}

export function executionTone(pct: number): "success" | "warning" | "danger" {
  if (pct >= 85) return "success";
  if (pct >= 60) return "warning";
  return "danger";
}

export function exceptionTone(
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): ChipTone {
  return severity === "CRITICAL"
    ? "red"
    : severity === "HIGH"
      ? "red"
      : severity === "MEDIUM"
        ? "amber"
        : "grey";
}

/** Convert any currency amount to ETB using a fixed reporting rate for display. */
export function toEtb(amount: string, currency: string): string {
  const n = Number(amount);
  const rate = currency === "USD" ? 57 : currency === "EUR" ? 62 : 1;
  return (n * rate).toFixed(2);
}