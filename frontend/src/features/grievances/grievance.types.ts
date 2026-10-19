export const GRIEVANCE_CATEGORIES = [
  "SERVICE_QUALITY",
  "DELAY",
  "PAYMENT",
  "SAFEGUARDS",
  "CONDUCT",
  "OTHER",
] as const;
export type GrievanceCategory = (typeof GRIEVANCE_CATEGORIES)[number];

export const GRIEVANCE_CHANNELS = [
  "WEB",
  "SMS",
  "USSD",
  "PHONE",
  "IN_PERSON",
  "LETTER",
] as const;
export type GrievanceChannel = (typeof GRIEVANCE_CHANNELS)[number];

export const GRIEVANCE_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "ESCALATED",
] as const;
export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];

export const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface GrievanceAction {
  actionId: string;
  grievanceId: string;
  actionType:
    | "ASSIGN"
    | "RESPOND"
    | "ESCALATE"
    | "RESOLVE"
    | "CLOSE"
    | "REOPEN";
  actorId: string;
  actorName: string;
  notes: string;
  createdAt: string;
}

export interface Grievance {
  grievanceId: string;
  ticketNo: string;
  projectId?: string;
  projectCode?: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  category: GrievanceCategory;
  subcategory?: string;
  description: string;
  channel: GrievanceChannel;
  submittedAt: string;
  location?: {
    region?: string;
    woreda?: string;
    kebele?: string;
  };
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  slaDue: string;
  severity: Severity;
  status: GrievanceStatus;
  resolution?: string;
  resolvedAt?: string;
  escalatedTo?: string;
  escalatedToName?: string;
  anonymous: boolean;
}

export interface GrievanceFilters {
  projectId?: string | undefined;
  category?: GrievanceCategory[] | undefined;
  status?: GrievanceStatus[] | undefined;
  severity?: Severity[] | undefined;
  assignedTo?: string | undefined;
  overdueOnly?: boolean | undefined;
  q?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}

export interface GrievanceStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  avgResolutionDays: number;
  byCategory: { category: GrievanceCategory; count: number }[];
  byLocation: { region: string; count: number }[];
}