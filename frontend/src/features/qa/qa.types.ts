export const QA_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type QASeverity = (typeof QA_SEVERITIES)[number];

export const QA_RULE_TYPES = [
  "DURATION_SHORT",
  "DURATION_LONG",
  "STRAIGHT_LINE",
  "GPS_OUTSIDE",
  "DUPLICATE",
  "OUTLIER",
  "SPEED",
  "VARIANCE",
  "LOGIC",
] as const;
export type QARuleType = (typeof QA_RULE_TYPES)[number];

export interface QARule {
  ruleId: string;
  code: string;
  name: string;
  type: QARuleType;
  threshold: Record<string, number | string>;
  severity: QASeverity;
  active: boolean;
}

export interface QAFlag {
  flagId: string;
  submissionId: string;
  collectorId: string;
  collectorName: string;
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  severity: QASeverity;
  details: Record<string, any>;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "ESCALATED";
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  resolution?: string;
  createdAt: string;
}

export interface CollectorScorecard {
  collectorId: string;
  collectorName: string;
  region?: string;
  submissionsCount: number;
  flaggedCount: number;
  backcheckPassRate?: number;
  avgDurationSeconds?: number;
  compositeScore: number;
}

export interface QAStats {
  total: number;
  open: number;
  inReview: number;
  resolved: number;
  bySeverity: Record<QASeverity, number>;
  byRule: { ruleType: QARuleType; count: number }[];
}

export interface QAFlagFilters {
  waveId?: string | undefined;
  severity?: QASeverity[] | undefined;
  status?: QAFlag["status"][] | undefined;
  collectorId?: string | undefined;
  limit?: number | undefined;
  cursor?: string | undefined;
}