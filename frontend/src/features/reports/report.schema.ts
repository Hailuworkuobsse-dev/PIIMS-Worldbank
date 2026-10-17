import { z } from "zod";
import { REPORT_TYPES } from "./report.types";

export const generateReportSchema = z.object({
  reportCode: z.enum(REPORT_TYPES),
  projectId: z.string().uuid().optional().or(z.literal("")),
  period: z.string().optional().or(z.literal("")),
  fiscalYear: z.number().int().min(2000).max(3000).optional(),
  format: z.enum(["PDF", "EXCEL", "CSV"]),
});
export type GenerateReportFormData = z.infer<typeof generateReportSchema>;

export const scheduleReportSchema = z.object({
  reportCode: z.enum(REPORT_TYPES),
  cron: z.string().min(5, "Enter a valid cron expression"),
  recipients: z.string().email("Enter a valid email"),
  format: z.enum(["PDF", "EXCEL", "CSV"]),
});
export type ScheduleReportFormData = z.infer<typeof scheduleReportSchema>;