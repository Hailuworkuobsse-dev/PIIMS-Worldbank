import { z } from "zod";
import { QA_RULE_TYPES, QA_SEVERITIES } from "./qa.types";

export const qaRuleSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code required")
    .max(40)
    .regex(/^[A-Z][A-Z0-9_]*$/, "Uppercase letters, numbers, underscores only"),
  name: z.string().trim().min(3, "Name required").max(200),
  type: z.enum(QA_RULE_TYPES),
  threshold: z.record(z.union([z.number(), z.string()])),
  severity: z.enum(QA_SEVERITIES),
  active: z.boolean().default(true),
});
export type QARuleFormData = z.infer<typeof qaRuleSchema>;

/**
 * Per-type threshold editor metadata.
 * Drives the threshold fields shown in the form.
 */
export const THRESHOLD_SCHEMA: Record<
  (typeof QA_RULE_TYPES)[number],
  {
    field: string;
    label: string;
    hint: string;
    default: number | string;
    kind: "number" | "text";
  }[]
> = {
  DURATION_SHORT: [
    {
      field: "multiplier",
      label: "Multiplier of median",
      hint: "e.g. 0.5 = flag if duration < 50% of median",
      default: 0.5,
      kind: "number",
    },
  ],
  DURATION_LONG: [
    {
      field: "multiplier",
      label: "Multiplier of median",
      hint: "e.g. 3 = flag if duration > 3× median",
      default: 3,
      kind: "number",
    },
  ],
  STRAIGHT_LINE: [
    {
      field: "minConsecutive",
      label: "Min consecutive answers",
      hint: "Flag if this many answers are identical in a row",
      default: 15,
      kind: "number",
    },
  ],
  GPS_OUTSIDE: [
    {
      field: "toleranceKm",
      label: "Tolerance (km)",
      hint: "Flag if GPS is further than this from assigned location",
      default: 5,
      kind: "number",
    },
  ],
  DUPLICATE: [
    {
      field: "windowDays",
      label: "Lookback window (days)",
      hint: "Flag duplicate submissions within this window",
      default: 1,
      kind: "number",
    },
  ],
  OUTLIER: [
    {
      field: "zScore",
      label: "Z-score threshold",
      hint: "Flag values above this z-score",
      default: 3,
      kind: "number",
    },
  ],
  SPEED: [
    {
      field: "minSeconds",
      label: "Minimum seconds per question",
      hint: "Flag if open questions answered faster than this",
      default: 2,
      kind: "number",
    },
  ],
  VARIANCE: [
    {
      field: "maxVariance",
      label: "Max variance (%)",
      hint: "Flag if scale variance below this %",
      default: 5,
      kind: "number",
    },
  ],
  LOGIC: [
    {
      field: "expression",
      label: "Logic expression",
      hint: "e.g. ${age} < ${birthYear}",
      default: "",
      kind: "text",
    },
  ],
};