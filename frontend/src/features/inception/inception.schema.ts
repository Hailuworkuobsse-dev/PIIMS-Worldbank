import { z } from "zod";
import { REPORT_STATUSES } from "./inception.types";

export const MAX_REPORT_SIZE_MB = 20;

export const submitInceptionSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  templateId: z.string().uuid("Select a template"),
  summary: z
    .string()
    .trim()
    .min(20, "Summary must be at least 20 characters")
    .max(2000),
  version: z.number().int().min(1),
});
export type SubmitInceptionFormData = z.infer<typeof submitInceptionSchema>;

export const reviewDecisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REQUEST_REVISION", "REJECT"]),
    comments: z.string().max(2000).optional(),
    sectionComments: z.record(z.string().max(1000)).optional(),
  })
  .refine(
    (d) =>
      d.decision === "APPROVE" ||
      (d.comments && d.comments.trim().length >= 10),
    {
      path: ["comments"],
      message: "Comments (min 10 chars) required for revision or rejection",
    },
  );
export type ReviewDecisionFormData = z.infer<typeof reviewDecisionSchema>;

export const noObjectionSchema = z.object({
  noObjection: z.literal(true, {
    errorMap: () => ({ message: "You must confirm no-objection" }),
  }),
  effectiveDate: z.string().min(1, "Effective date is required"),
  comments: z.string().max(1000).optional(),
});
export type NoObjectionFormData = z.infer<typeof noObjectionSchema>;

export const inceptionFiltersSchema = z.object({
  projectId: z.string().optional(),
  status: z.array(z.enum(REPORT_STATUSES)).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  overdue: z.boolean().optional(),
  q: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
});