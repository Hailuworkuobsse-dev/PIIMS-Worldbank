export const REPORT_TYPES = [
  "PPMR",
  "ISR",
  "FINANCIAL",
  "PROCUREMENT",
  "BENEFICIARY",
  "GRIEVANCE",
  "IMPACT",
  "INCEPTION",
  "AD_HOC",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export interface ReportDefinition {
  code: ReportType;
  name: string;
  description: string;
  frequency: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL" | "ON_DEMAND";
  requiredParams: string[];
  formats: ("PDF" | "EXCEL" | "CSV")[];
}

export interface ReportInstance {
  instanceId: string;
  reportCode: ReportType;
  projectId?: string;
  projectCode?: string;
  period?: string;
  format: "PDF" | "EXCEL" | "CSV";
  status: "QUEUED" | "GENERATING" | "READY" | "FAILED";
  filePath?: string;
  fileSize?: number;
  generatedAt?: string;
  generatedBy: string;
  error?: string;
}

export interface GenerateReportInput {
  reportCode: ReportType;
  projectId?: string | undefined;
  period?: string | undefined;
  fiscalYear?: number | undefined;
  format: "PDF" | "EXCEL" | "CSV";
  parameters?: Record<string, unknown> | undefined;
}

export interface ReportSchedule {
  scheduleId: string;
  reportCode: ReportType;
  cron: string;
  recipients: string[];
  format: "PDF" | "EXCEL" | "CSV";
  active: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface ScheduleInput {
  reportCode: ReportType;
  cron: string;
  recipients: string[];
  format: "PDF" | "EXCEL" | "CSV";
}