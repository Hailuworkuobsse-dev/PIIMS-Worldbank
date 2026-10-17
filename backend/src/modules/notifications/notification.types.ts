import type { NotificationChannel, NotificationStatus } from '@prisma/client';

export const TEMPLATE_CODES = {
  // Auth
  USER_INVITE: 'USER_INVITE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  MFA_ENABLED: 'MFA_ENABLED',
  // Projects
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_STAGE_ADVANCED: 'PROJECT_STAGE_ADVANCED',
  // Inception
  INCEPTION_SUBMITTED: 'INCEPTION_SUBMITTED',
  INCEPTION_APPROVED: 'INCEPTION_APPROVED',
  INCEPTION_REVISION_REQUIRED: 'INCEPTION_REVISION_REQUIRED',
  // Beneficiaries
  BENEFICIARY_REGISTERED: 'BENEFICIARY_REGISTERED',
  BENEFICIARY_VERIFIED: 'BENEFICIARY_VERIFIED',
  SERVICE_DELIVERED: 'SERVICE_DELIVERED',
  // Grievances
  GRIEVANCE_SUBMITTED: 'GRIEVANCE_SUBMITTED',
  GRIEVANCE_ASSIGNED: 'GRIEVANCE_ASSIGNED',
  GRIEVANCE_RESOLVED: 'GRIEVANCE_RESOLVED',
  // Financial
  DISBURSEMENT_RECORDED: 'DISBURSEMENT_RECORDED',
  BUDGET_EXCEPTION: 'BUDGET_EXCEPTION',
  // Impact
  QA_FLAG_RAISED: 'QA_FLAG_RAISED',
  COLLECTOR_SCORECARD_READY: 'COLLECTOR_SCORECARD_READY',
  // Reports
  REPORT_READY: 'REPORT_READY',
  SYNC_FAILED: 'SYNC_FAILED'
} as const;

export type TemplateCode = (typeof TEMPLATE_CODES)[keyof typeof TEMPLATE_CODES];

export interface NotificationContext {
  userIds?: string[];
  beneficiaryIds?: string[];
  emails?: string[]; // for pre-registration notifications
}

export interface NotifyOptions {
  recipients: NotificationContext;
  templateCode: TemplateCode;
  variables: Record<string, string | number>;
  channels?: NotificationChannel[]; // override template defaults
  language?: 'en' | 'am';
  priority?: 'NORMAL' | 'HIGH';
}

export interface NotificationTemplateDefinition {
  code: TemplateCode;
  name: string;
  description: string;
  channels: NotificationChannel[];
  subject: string;
  body: string;
  bodyAm?: string;
  variables: string[];
}

export interface NotificationDTO {
  notificationId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  subject?: string;
  body: string;
  language: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface NotificationPreferenceDTO {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inappEnabled: boolean;
  language: 'en' | 'am';
}