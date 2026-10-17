import { z } from 'zod';
import { ReportType, ReportFormat } from '@prisma/client';

const reportTypeValues = Object.values(ReportType) as [ReportType, ...ReportType[]];
const formatValues = Object.values(ReportFormat) as [ReportFormat, ...ReportFormat[]];

export const generateReportSchema = z.object({
  reportCode: z.enum(reportTypeValues),
  projectId: z.string().uuid().optional().or(z.literal('')),
  period: z.string().max(30).optional().or(z.literal('')),
  fiscalYear: z.coerce.number().int().min(2000).max(3000).optional(),
  format: z.enum(formatValues)
});
export type GenerateReportInput = z.infer<typeof generateReportSchema>;

export const scheduleReportSchema = z.object({
  reportCode: z.enum(reportTypeValues),
  cron: z.string().min(5, 'Cron expression required').max(100),
  recipients: z.array(z.string().email('Valid email required')).min(1, 'At least one recipient'),
  format: z.enum(formatValues)
});
export type ScheduleReportInput = z.infer<typeof scheduleReportSchema>;

export const listInstancesQuerySchema = z.object({
  report_code: z.string().optional(),
  status: z.string().optional(),
  project_id: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});
export type ListInstancesQuery = z.infer<typeof listInstancesQuerySchema>;