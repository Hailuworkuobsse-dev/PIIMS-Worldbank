export const INTEGRATION_CODES = [
  'FMIS',
  'DBE',
  'WB',
  'SMS',
  'USSD',
  'MOBILE_MONEY',
  'GIS',
  'IDP',
  'ODK',
  'SAFE_ROOM'
] as const;

export type IntegrationCode = (typeof INTEGRATION_CODES)[number];

export interface IntegrationMetadata {
  code: IntegrationCode;
  name: string;
  description: string;
  direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  protocol: string;
  baseUrlEnvVar: string;
  apiKeyEnvVar?: string;
  scheduleEnvVar?: string;
  defaultSchedule?: string;
}

export interface IntegrationStatusDTO {
  code: IntegrationCode;
  name: string;
  description: string;
  direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'NOT_CONFIGURED';
  lastSync?: string;
  lastError?: string;
  errorCount24h: number;
  recordsProcessed24h: number;
  avgLatencyMs?: number;
  configured: boolean;
}

export interface SyncRunDTO {
  runId: string;
  integrationCode: IntegrationCode;
  kind: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  recordsProcessed: number;
  recordsFailed: number;
  status: 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorSummary?: string;
}

export interface AdapterHealth {
  healthy: boolean;
  latencyMs: number;
  message?: string;
}