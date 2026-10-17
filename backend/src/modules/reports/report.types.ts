import type { ReportType, ReportFormat } from '@prisma/client';

export interface ReportDefinitionDTO {
  code: ReportType;
  name: string;
  description: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'ON_DEMAND';
  requiredParams: string[];
  formats: ReportFormat[];
}

export interface ReportInstanceDTO {
  instanceId: string;
  reportCode: ReportType;
  projectId?: string;
  projectCode?: string;
  period?: string;
  format: ReportFormat;
  status: 'QUEUED' | 'GENERATING' | 'READY' | 'FAILED';
  filePath?: string;
  fileSize?: number;
  generatedAt?: string;
  generatedById: string;
  generatedByName: string;
  error?: string;
}

export interface ReportScheduleDTO {
  scheduleId: string;
  reportCode: ReportType;
  cron: string;
  recipients: string[];
  format: ReportFormat;
  active: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface WbExportDTO {
  url: string;
  expiresAt: string;
  period: string;
  projectCount: number;
}