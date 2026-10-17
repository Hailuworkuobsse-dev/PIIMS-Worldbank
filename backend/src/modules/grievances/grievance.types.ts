import type {
  GrievanceCategory, GrievanceChannel, GrievanceStatus, Severity, GrievanceActionType
} from '@prisma/client';

export interface GrievanceDTO {
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
  location?: { region?: string; woreda?: string; kebele?: string };
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

export interface GrievanceActionDTO {
  actionId: string;
  grievanceId: string;
  actionType: GrievanceActionType;
  actorId: string;
  actorName: string;
  notes: string;
  createdAt: string;
}

export interface GrievanceStatsDTO {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  avgResolutionDays: number;
  byCategory: { category: GrievanceCategory; count: number }[];
  byLocation: { region: string; count: number }[];
}