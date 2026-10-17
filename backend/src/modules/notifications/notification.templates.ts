import { TEMPLATE_CODES, type NotificationTemplateDefinition, type TemplateCode } from './notification.types.js';

/**
 * Static template catalogue. On first startup, these are seeded into the
 * NotificationTemplate table via prisma/seed.ts (see seed additions below).
 */
export const TEMPLATE_CATALOGUE: NotificationTemplateDefinition[] = [
  {
    code: TEMPLATE_CODES.USER_INVITE,
    name: 'User invitation',
    description: 'Sent when an administrator creates a new user account',
    channels: ['EMAIL'],
    subject: 'Welcome to PIIMS — your account has been created',
    body: `Hello {{fullName}},

Your PIIMS account has been created.

Username: {{username}}
Temporary password: {{temporaryPassword}}

Please sign in at {{loginUrl}} and change your password immediately.

— PIIMS Team`,
    bodyAm: `ሰላም {{fullName}}፣

የPIIMS መለያዎ ተፈጥሯል።

የተጠቃሚ ስም: {{username}}
ጊዚያዊ የይለፍ ቃል: {{temporaryPassword}}

እባክዎ በ {{loginUrl}} ይግቡ እና የይለፍ ቃልዎን ወዲያውኑ ይቀይሩ።

— የPIIMS ቡድን`,
    variables: ['fullName', 'username', 'temporaryPassword', 'loginUrl']
  },
  {
    code: TEMPLATE_CODES.PASSWORD_RESET,
    name: 'Password reset',
    description: 'Sent when a user requests password reset',
    channels: ['EMAIL'],
    subject: 'Reset your PIIMS password',
    body: `Hello {{fullName}},

A password reset was requested for your account. Click the link below to set a new password:

{{resetUrl}}

This link expires in 1 hour. If you did not request this, please ignore this email.

— PIIMS Team`,
    variables: ['fullName', 'resetUrl']
  },
  {
    code: TEMPLATE_CODES.PASSWORD_CHANGED,
    name: 'Password changed',
    description: 'Confirmation after password change',
    channels: ['EMAIL'],
    subject: 'Your PIIMS password was changed',
    body: `Hello {{fullName}},

Your PIIMS password was changed on {{changedAt}}.

If you did not make this change, contact security@piims.gov.et immediately.

— PIIMS Team`,
    variables: ['fullName', 'changedAt']
  },
  {
    code: TEMPLATE_CODES.MFA_ENABLED,
    name: 'MFA enabled',
    description: 'Confirmation after MFA is enabled',
    channels: ['EMAIL'],
    subject: 'Multi-factor authentication enabled',
    body: `Hello {{fullName}},

Multi-factor authentication (MFA) has been enabled for your PIIMS account on {{enabledAt}}.

You will need to enter a 6-digit code from your authenticator app each time you sign in.

— PIIMS Team`,
    variables: ['fullName', 'enabledAt']
  },
  {
    code: TEMPLATE_CODES.PROJECT_CREATED,
    name: 'Project created',
    description: 'Notifies project owner when a project is registered',
    channels: ['IN_APP', 'EMAIL'],
    subject: 'Project {{projectCode}} created',
    body: `Hello {{fullName}},

A new project has been registered in PIIMS:

Project: {{projectName}}
Code: {{projectCode}}
Sector: {{sector}}
Budget: {{budget}}

View it at {{projectUrl}}.

— PIIMS Team`,
    variables: ['fullName', 'projectCode', 'projectName', 'sector', 'budget', 'projectUrl']
  },
  {
    code: TEMPLATE_CODES.PROJECT_STAGE_ADVANCED,
    name: 'Project stage advanced',
    description: 'Notifies stakeholders when a project advances',
    channels: ['IN_APP', 'EMAIL'],
    subject: 'Project {{projectCode}} advanced to {{newStage}}',
    body: `Project {{projectName}} ({{projectCode}}) has advanced from {{previousStage}} to {{newStage}}.

Advanced by: {{advancedBy}}
Date: {{advancedAt}}

— PIIMS Team`,
    variables: ['projectCode', 'projectName', 'previousStage', 'newStage', 'advancedBy', 'advancedAt']
  },
  {
    code: TEMPLATE_CODES.INCEPTION_SUBMITTED,
    name: 'Inception report submitted',
    description: 'Notifies reviewers when inception report arrives',
    channels: ['IN_APP', 'EMAIL'],
    subject: 'Inception report ready for review — {{projectCode}}',
    body: `Hello,

{{submitterName}} submitted inception report v{{version}} for {{projectName}} ({{projectCode}}).

Review it at {{reviewUrl}}.

— PIIMS Team`,
    variables: ['submitterName', 'version', 'projectName', 'projectCode', 'reviewUrl']
  },
  {
    code: TEMPLATE_CODES.INCEPTION_APPROVED,
    name: 'Inception report approved',
    description: 'Notifies submitter of approval',
    channels: ['IN_APP', 'EMAIL'],
    subject: 'Inception report approved — {{projectCode}}',
    body: `Hello {{fullName}},

The World Bank has granted no-objection to inception report v{{version}} for {{projectName}} ({{projectCode}}).

Effective date: {{effectiveDate}}

— PIIMS Team`,
    variables: ['fullName', 'version', 'projectName', 'projectCode', 'effectiveDate']
  },
  {
    code: TEMPLATE_CODES.INCEPTION_REVISION_REQUIRED,
    name: 'Inception revision required',
    description: 'Notifies submitter that revision is needed',
    channels: ['IN_APP', 'EMAIL'],
    subject: 'Inception report requires revision — {{projectCode}}',
    body: `Hello {{fullName}},

Reviewer {{reviewerName}} has requested revisions to inception report v{{version}} for {{projectName}} ({{projectCode}}).

Comments: {{comments}}

— PIIMS Team`,
    variables: ['fullName', 'version', 'projectName', 'projectCode', 'reviewerName', 'comments']
  },
  {
    code: TEMPLATE_CODES.BENEFICIARY_REGISTERED,
    name: 'Beneficiary registered',
    description: 'SMS to beneficiary after registration',
    channels: ['SMS'],
    subject: '',
    body: `PIIMS: You are registered. ID {{uniqueId}}. Reply CONF {{uniqueId}} to confirm.`,
    bodyAm: `PIIMS: ተመዝግበዋል። መለያ {{uniqueId}}። ለማረጋገጥ CONF {{uniqueId}} ብለው ይመልሱ።`,
    variables: ['uniqueId']
  },
  {
    code: TEMPLATE_CODES.BENEFICIARY_VERIFIED,
    name: 'Beneficiary verified',
    description: 'SMS after local government verification',
    channels: ['SMS'],
    subject: '',
    body: `PIIMS: Your registration ({{uniqueId}}) has been verified. You are now eligible for project benefits.`,
    variables: ['uniqueId']
  },
  {
    code: TEMPLATE_CODES.SERVICE_DELIVERED,
    name: 'Service delivered',
    description: 'SMS after delivery is recorded',
    channels: ['SMS'],
    subject: '',
    body: `PIIMS: Service delivered to you: {{productName}} (serial {{serialNo}}). Warranty until {{warrantyEnd}}. Call {{supportPhone}} for help.`,
    variables: ['productName', 'serialNo', 'warrantyEnd', 'supportPhone']
  },
  {
    code: TEMPLATE_CODES.GRIEVANCE_SUBMITTED,
    name: 'Grievance submitted',
    description: 'SMS to beneficiary confirming grievance receipt',
    channels: ['SMS'],
    subject: '',
    body: `PIIMS: Your grievance has been received. Ticket {{ticketNo}}. SLA: {{slaDue}}. Track status at {{trackUrl}}.`,
    variables: ['ticketNo', 'slaDue', 'trackUrl']
  },
  {
    code: TEMPLATE_CODES.GRIEVANCE_ASSIGNED,
    name: 'Grievance assigned',
    description: 'Notifies officer of assignment',
    channels: ['IN_APP', 'EMAIL'],
    subject: 'Grievance {{ticketNo}} assigned to you',
    body: `You have been assigned grievance {{ticketNo}}.

Category: {{category}}
Severity: {{severity}}
SLA due: {{slaDue}}

View it at {{grievanceUrl}}.

— PIIMS Team`,
    variables: ['ticketNo', 'category', 'severity', 'slaDue', 'grievanceUrl']
  },
  {
    code: TEMPLATE_CODES.GRIEVANCE_RESOLVED,
    name: 'Grievance resolved',
    description: 'SMS to beneficiary on resolution',
    channels: ['SMS'],
    subject: '',
    body: `PIIMS: Your grievance {{ticketNo}} has been resolved. Thank you for your patience.`,
    variables: ['ticketNo']
  },
  {
    code: TEMPLATE_CODES.DISBURSEMENT_RECORDED,
    name: 'Disbursement recorded',
    description: 'Notifies finance team of new disbursement',
    channels: ['IN_APP'],
    subject: 'Disbursement recorded for {{projectCode}}',
    body: `A disbursement of {{amount}} {{currency}} was recorded for project {{projectCode}} on {{valueDate}}.`,
    variables: ['projectCode', 'amount', 'currency', 'valueDate']
  },
  {
    code: TEMPLATE_CODES.BUDGET_EXCEPTION,
    name: 'Budget exception',
    description: 'Alerts finance team of budget overrun or anomaly',
    channels: ['IN_APP', 'EMAIL'],
    subject: 'Budget exception — {{projectCode}}',
    body: `A {{exceptionType}} exception was detected on project {{projectCode}}.

Details: {{details}}

Review at {{financeUrl}}.

— PIIMS Team`,
    variables: ['projectCode', 'exceptionType', 'details', 'financeUrl']
  },
  {
    code: TEMPLATE_CODES.QA_FLAG_RAISED,
    name: 'QA flag raised',
    description: 'Notifies QA team of flagged submission',
    channels: ['IN_APP'],
    subject: 'QA flag raised — {{ruleName}}',
    body: `A {{severity}} QA flag was raised for submission {{submissionId}} ({{ruleName}}).

Details: {{details}}

Review at {{qaUrl}}.

— PIIMS Team`,
    variables: ['ruleName', 'severity', 'submissionId', 'details', 'qaUrl']
  },
  {
    code: TEMPLATE_CODES.COLLECTOR_SCORECARD_READY,
    name: 'Collector scorecard ready',
    description: 'Notifies supervisor of updated scorecards',
    channels: ['IN_APP'],
    subject: 'Collector scorecards updated for wave {{waveCode}}',
    body: `Collector scorecards for wave {{waveCode}} have been recomputed on {{computedAt}}.`,
    variables: ['waveCode', 'computedAt']
  },
  {
    code: TEMPLATE_CODES.REPORT_READY,
    name: 'Report ready',
    description: 'Notifies requester that a generated report is ready',
    channels: ['IN_APP', 'EMAIL'],
    subject: 'Your {{reportCode}} report is ready',
    body: `Your report {{reportCode}} ({{format}}) is ready to download.

Download at {{downloadUrl}}.

— PIIMS Team`,
    variables: ['reportCode', 'format', 'downloadUrl']
  },
  {
    code: TEMPLATE_CODES.SYNC_FAILED,
    name: 'Integration sync failed',
    description: 'Alerts admins when an external sync fails',
    channels: ['IN_APP', 'EMAIL'],
    subject: 'Integration sync failed — {{integrationCode}}',
    body: `The {{integrationCode}} sync failed on {{failedAt}}.

Error: {{error}}

Review at {{adminUrl}}.

— PIIMS Team`,
    variables: ['integrationCode', 'failedAt', 'error', 'adminUrl']
  }
];

export const TEMPLATE_BY_CODE: Record<TemplateCode, NotificationTemplateDefinition> = Object.fromEntries(
  TEMPLATE_CATALOGUE.map((t) => [t.code, t])
) as Record<TemplateCode, NotificationTemplateDefinition>;

/**
 * Simple {{variable}} substitution.
 */
export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}

/**
 * Get the body/subject in the requested language, falling back to English.
 */
export function localizedTemplate(
  template: NotificationTemplateDefinition,
  language: 'en' | 'am'
): { subject: string; body: string } {
  if (language === 'am' && template.bodyAm) {
    return { subject: template.subject, body: template.bodyAm };
  }
  return { subject: template.subject, body: template.body };
}