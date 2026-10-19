/* =========================================================================
 * Role Codes — mirrors Role Register across 14 stakeholders (43 roles)
 * ========================================================================= */
export const ROLE_CODES = [
  // World Bank (6)
  "WB-TTL",
  "WB-IE",
  "WB-FM",
  "WB-PROC",
  "WB-ES",
  "WB-M&E",
  // MoWE (9)
  "MW-SA",
  "MW-PIU",
  "MW-ME",
  "MW-TL",
  "MW-PM",
  "MW-IE",
  "MW-DM",
  "MW-QA",
  "MW-FO",
  // MoF (3)
  "MF-BO",
  "MF-FM",
  "MF-AUD",
  // DBE (4)
  "DB-LO",
  "DB-DO",
  "DB-PM",
  "DB-AUD",
  // Suppliers (3)
  "SP-AD",
  "SP-OPS",
  "SP-SVC",
  // Beneficiaries (2)
  "BN-SR",
  "BN-REP",
  // Local Government (4)
  "LG-RO",
  "LG-ZO",
  "LG-WO",
  "LG-KO",
  // Data Collection Team (2)
  "DC-EN",
  "DC-SV",
  // Researchers (1)
  "RS-EX",
  // Steering Committee (1)
  "SC-MB",
  // Auditors / Evaluators (2)
  "AU-EX",
  "AU-EV",
  // System / Support (4)
  "SYS-DBA",
  "SYS-OPS",
  "SYS-SEC",
  "SYS-HELP",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

/* =========================================================================
 * Permissions — dotted action strings, grouped by domain
 * ========================================================================= */
export const PERMISSIONS = {
  // Project (M2)
  projectRead: "project:read",
  projectWrite: "project:write",
  projectApprove: "project:approve",
  projectDelete: "project:delete",

  // Inception (M3)
  inceptionRead: "inception:read",
  inceptionSubmit: "inception:submit",
  inceptionReview: "inception:review",
  inceptionApprove: "inception:approve",

  // Results (M4)
  resultRead: "result:read",
  resultWrite: "result:write",
  resultAggregate: "result:aggregate",

  // Financial (M5)
  budgetRead: "budget:read",
  budgetWrite: "budget:write",
  disbursementRead: "disbursement:read",
  disbursementWrite: "disbursement:write",
  financeReconcile: "finance:reconcile",

  // Procurement (M6)
  procurementRead: "procurement:read",
  procurementWrite: "procurement:write",
  contractRead: "contract:read",
  contractWrite: "contract:write",

  // Supplier (M7)
  supplierSelfRead: "supplier:self:read",
  supplierSelfWrite: "supplier:self:write",
  supplierDelivery: "supplier:delivery",

  // Beneficiary (M8)
  beneficiaryRead: "beneficiary:read",
  beneficiaryWrite: "beneficiary:write",
  beneficiaryVerify: "beneficiary:verify",
  beneficiaryExport: "beneficiary:export",
  serviceDeliveryRead: "service:read",
  serviceDeliveryWrite: "service:write",

  // GIS (M9)
  geoRead: "geo:read",
  geoWrite: "geo:write",

  // Documents (M10)
  docRead: "doc:read",
  docWrite: "doc:write",
  docRestore: "doc:restore",

  // Reporting (M11)
  reportRead: "report:read",
  reportGenerate: "report:generate",
  reportSchedule: "report:schedule",
  reportWBExport: "report:wb-export",

  // Dashboard (M12)
  dashboardRead: "dashboard:read",

  // Grievance (M13)
  grievanceRead: "grievance:read",
  grievanceWrite: "grievance:write",
  grievanceResolve: "grievance:resolve",
  grievanceEscalate: "grievance:escalate",

  // Notification (M14)
  notificationRead: "notification:read",
  notificationBroadcast: "notification:broadcast",

  // Integration (M15)
  integrationRead: "integration:read",
  integrationManage: "integration:manage",

  // Admin (M16)
  adminUsers: "admin:users",
  adminRoles: "admin:roles",
  adminOrgs: "admin:orgs",
  adminMasterData: "admin:master-data",
  adminWorkflows: "admin:workflows",
  adminSettings: "admin:settings",

  // Mobile/Offline (M17)
  fieldCapture: "field:capture",
  fieldSync: "field:sync",
  fieldSupervise: "field:supervise",

  // Impact Indicators (M18)
  impactIndicatorRead: "impact:indicator:read",
  impactIndicatorWrite: "impact:indicator:write",
  impactDesign: "impact:design",

  // Survey (M19)
  surveyRead: "survey:read",
  surveyWrite: "survey:write",
  surveyPublish: "survey:publish",
  surveyAssign: "survey:assign",

  // Field Collection (M20)
  collectAssign: "collect:assign",
  collectExecute: "collect:execute",
  collectSupervise: "collect:supervise",

  // QA (M21)
  qaRead: "qa:read",
  qaReview: "qa:review",
  qaRules: "qa:rules",
  qaBackcheck: "qa:backcheck",

  // Warehouse & Research (M22)
  warehouseRead: "warehouse:read",
  warehouseManage: "warehouse:manage",
  warehouseAnonymize: "warehouse:anonymize",
  warehouseRelease: "warehouse:release",
  researchRequest: "research:request",
  researchDownload: "research:download",

  // Impact Analytics (M23)
  impactAnalyticsRead: "impact:analytics:read",
  impactAnalyticsRun: "impact:analytics:run",
  researchProjectManage: "research:project",

  // Audit
  auditRead: "audit:read",

  // System
  systemMonitor: "system:monitor",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/* =========================================================================
 * Scope — data visibility bound by org / geography
 * ========================================================================= */
export interface AuthScope {
  orgId: string;
  orgLevel: "FEDERAL" | "REGIONAL" | "ZONAL" | "WOREDA" | "KEBELE" | "EXTERNAL";
  regions?: string[]; // e.g. ['Oromia', 'Amhara']
  zones?: string[];
  woredas?: string[];
  kebeles?: string[];
  ownRecordsOnly?: boolean; // e.g. suppliers see only own contracts
}

/* =========================================================================
 * User
 * ========================================================================= */
export interface AuthUser {
  userId: string;
  username: string;
  fullName: string;
  fullNameAm?: string;
  email: string;
  orgId: string;
  orgName: string;
  role: RoleCode;
  roleName: string;
  permissions: Permission[];
  scope: AuthScope;
  mfaEnabled: boolean;
  mfaSetupRequired?: boolean;
  mustChangePassword?: boolean;
  acceptedPolicyVersion?: string | null;
  locale: "en" | "am";
  lastLoginAt: string;
}

/* =========================================================================
 * Sessions & Tokens
 * ========================================================================= */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  refreshExpiresAt: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  mfaCode?: string;
  rememberDevice?: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  mfa_required?: boolean;
  mfa_token?: string; // short-lived, for MFA challenge
  mfa_setup_required?: boolean;
}

export interface MFAChallengeRequest {
  mfa_token: string;
  mfa_code: string;
  remember_device?: boolean;
}

/* =========================================================================
 * Role → Permission catalog
 * The single source of truth for RBAC in the frontend.
 * Backend enforces the same map server-side; this copy drives UI gating only.
 * ========================================================================= */
export const ROLE_PERMISSIONS: Record<RoleCode, Permission[]> = {
  // ---------- World Bank ----------
  "WB-TTL": [
    PERMISSIONS.projectRead,
    PERMISSIONS.inceptionRead,
    PERMISSIONS.inceptionReview,
    PERMISSIONS.inceptionApprove,
    PERMISSIONS.resultRead,
    PERMISSIONS.budgetRead,
    PERMISSIONS.disbursementRead,
    PERMISSIONS.procurementRead,
    PERMISSIONS.contractRead,
    PERMISSIONS.beneficiaryRead,
    PERMISSIONS.serviceDeliveryRead,
    PERMISSIONS.docRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.reportWBExport,
    PERMISSIONS.dashboardRead,
    PERMISSIONS.grievanceRead,
    PERMISSIONS.impactIndicatorRead,
    PERMISSIONS.auditRead,
  ],
  "WB-IE": [
    PERMISSIONS.projectRead,
    PERMISSIONS.resultRead,
    PERMISSIONS.impactIndicatorRead,
    PERMISSIONS.impactIndicatorWrite,
    PERMISSIONS.impactDesign,
    PERMISSIONS.surveyRead,
    PERMISSIONS.surveyWrite,
    PERMISSIONS.warehouseRead,
    PERMISSIONS.impactAnalyticsRead,
    PERMISSIONS.docRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],
  "WB-FM": [
    PERMISSIONS.projectRead,
    PERMISSIONS.budgetRead,
    PERMISSIONS.disbursementRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],
  "WB-PROC": [
    PERMISSIONS.projectRead,
    PERMISSIONS.procurementRead,
    PERMISSIONS.contractRead,
    PERMISSIONS.reportRead,
  ],
  "WB-ES": [
    PERMISSIONS.projectRead,
    PERMISSIONS.grievanceRead,
    PERMISSIONS.beneficiaryRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],
  "WB-M&E": [
    PERMISSIONS.projectRead,
    PERMISSIONS.resultRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],

  // ---------- MoWE ----------
  "MW-SA": Object.values(PERMISSIONS) as Permission[], // full system administrator
  "MW-PIU": [
    PERMISSIONS.projectRead,
    PERMISSIONS.projectWrite,
    PERMISSIONS.projectApprove,
    PERMISSIONS.inceptionRead,
    PERMISSIONS.inceptionSubmit,
    PERMISSIONS.resultRead,
    PERMISSIONS.resultWrite,
    PERMISSIONS.beneficiaryRead,
    PERMISSIONS.beneficiaryWrite,
    PERMISSIONS.beneficiaryVerify,
    PERMISSIONS.serviceDeliveryRead,
    PERMISSIONS.serviceDeliveryWrite,
    PERMISSIONS.procurementRead,
    PERMISSIONS.procurementWrite,
    PERMISSIONS.contractRead,
    PERMISSIONS.contractWrite,
    PERMISSIONS.docRead,
    PERMISSIONS.docWrite,
    PERMISSIONS.reportRead,
    PERMISSIONS.reportGenerate,
    PERMISSIONS.dashboardRead,
    PERMISSIONS.grievanceRead,
    PERMISSIONS.grievanceWrite,
    PERMISSIONS.notificationRead,
  ],
  "MW-ME": [
    PERMISSIONS.projectRead,
    PERMISSIONS.resultRead,
    PERMISSIONS.resultWrite,
    PERMISSIONS.resultAggregate,
    PERMISSIONS.reportRead,
    PERMISSIONS.reportGenerate,
    PERMISSIONS.dashboardRead,
  ],
  "MW-TL": [
    PERMISSIONS.projectRead,
    PERMISSIONS.projectWrite,
    PERMISSIONS.resultRead,
    PERMISSIONS.docRead,
    PERMISSIONS.docWrite,
  ],
  "MW-PM": [
    PERMISSIONS.projectRead,
    PERMISSIONS.projectApprove,
    PERMISSIONS.inceptionRead,
    PERMISSIONS.inceptionReview,
    PERMISSIONS.resultRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],
  "MW-IE": [
    PERMISSIONS.projectRead,
    PERMISSIONS.resultRead,
    PERMISSIONS.impactIndicatorRead,
    PERMISSIONS.impactIndicatorWrite,
    PERMISSIONS.impactDesign,
    PERMISSIONS.surveyRead,
    PERMISSIONS.surveyWrite,
    PERMISSIONS.surveyPublish,
    PERMISSIONS.surveyAssign,
    PERMISSIONS.collectAssign,
    PERMISSIONS.collectSupervise,
    PERMISSIONS.qaRead,
    PERMISSIONS.qaReview,
    PERMISSIONS.warehouseRead,
    PERMISSIONS.researchRequest,
    PERMISSIONS.impactAnalyticsRead,
    PERMISSIONS.impactAnalyticsRun,
    PERMISSIONS.reportRead,
    PERMISSIONS.reportGenerate,
    PERMISSIONS.docRead,
    PERMISSIONS.dashboardRead,
  ],
  "MW-DM": [
    PERMISSIONS.impactIndicatorRead,
    PERMISSIONS.surveyRead,
    PERMISSIONS.qaRead,
    PERMISSIONS.warehouseRead,
    PERMISSIONS.warehouseManage,
    PERMISSIONS.warehouseAnonymize,
    PERMISSIONS.warehouseRelease,
    PERMISSIONS.impactAnalyticsRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.reportGenerate,
    PERMISSIONS.auditRead,
  ],
  "MW-QA": [
    PERMISSIONS.impactIndicatorRead,
    PERMISSIONS.surveyRead,
    PERMISSIONS.collectSupervise,
    PERMISSIONS.qaRead,
    PERMISSIONS.qaReview,
    PERMISSIONS.qaRules,
    PERMISSIONS.qaBackcheck,
    PERMISSIONS.warehouseRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],
  "MW-FO": [
    PERMISSIONS.collectAssign,
    PERMISSIONS.collectSupervise,
    PERMISSIONS.qaRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],

  // ---------- MoF ----------
  "MF-BO": [
    PERMISSIONS.projectRead,
    PERMISSIONS.budgetRead,
    PERMISSIONS.budgetWrite,
    PERMISSIONS.reportRead,
    PERMISSIONS.reportGenerate,
    PERMISSIONS.dashboardRead,
  ],
  "MF-FM": [
    PERMISSIONS.projectRead,
    PERMISSIONS.budgetRead,
    PERMISSIONS.disbursementRead,
    PERMISSIONS.disbursementWrite,
    PERMISSIONS.financeReconcile,
    PERMISSIONS.reportRead,
    PERMISSIONS.reportGenerate,
    PERMISSIONS.dashboardRead,
  ],
  "MF-AUD": [
    PERMISSIONS.projectRead,
    PERMISSIONS.budgetRead,
    PERMISSIONS.disbursementRead,
    PERMISSIONS.auditRead,
    PERMISSIONS.reportRead,
  ],

  // ---------- DBE ----------
  "DB-LO": [
    PERMISSIONS.projectRead,
    PERMISSIONS.disbursementRead,
    PERMISSIONS.disbursementWrite,
    PERMISSIONS.contractRead,
    PERMISSIONS.reportRead,
  ],
  "DB-DO": [
    PERMISSIONS.projectRead,
    PERMISSIONS.disbursementRead,
    PERMISSIONS.disbursementWrite,
    PERMISSIONS.reportRead,
  ],
  "DB-PM": [
    PERMISSIONS.projectRead,
    PERMISSIONS.disbursementRead,
    PERMISSIONS.contractRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],
  "DB-AUD": [
    PERMISSIONS.projectRead,
    PERMISSIONS.disbursementRead,
    PERMISSIONS.auditRead,
    PERMISSIONS.reportRead,
  ],

  // ---------- Suppliers ----------
  "SP-AD": [
    PERMISSIONS.supplierSelfRead,
    PERMISSIONS.supplierSelfWrite,
    PERMISSIONS.contractRead,
    PERMISSIONS.docRead,
    PERMISSIONS.docWrite,
  ],
  "SP-OPS": [
    PERMISSIONS.supplierSelfRead,
    PERMISSIONS.supplierDelivery,
    PERMISSIONS.serviceDeliveryWrite,
    PERMISSIONS.docRead,
    PERMISSIONS.docWrite,
  ],
  "SP-SVC": [
    PERMISSIONS.supplierSelfRead,
    PERMISSIONS.serviceDeliveryRead,
    PERMISSIONS.serviceDeliveryWrite,
    PERMISSIONS.docRead,
  ],

  // ---------- Beneficiaries ----------
  "BN-SR": [],
  "BN-REP": [],

  // ---------- Local Government ----------
  "LG-RO": [
    PERMISSIONS.projectRead,
    PERMISSIONS.resultRead,
    PERMISSIONS.beneficiaryRead,
    PERMISSIONS.beneficiaryWrite,
    PERMISSIONS.beneficiaryVerify,
    PERMISSIONS.serviceDeliveryRead,
    PERMISSIONS.geoRead,
    PERMISSIONS.geoWrite,
    PERMISSIONS.grievanceRead,
    PERMISSIONS.grievanceWrite,
    PERMISSIONS.reportRead,
    PERMISSIONS.reportGenerate,
    PERMISSIONS.dashboardRead,
  ],
  "LG-ZO": [
    PERMISSIONS.projectRead,
    PERMISSIONS.resultRead,
    PERMISSIONS.beneficiaryRead,
    PERMISSIONS.beneficiaryWrite,
    PERMISSIONS.beneficiaryVerify,
    PERMISSIONS.geoRead,
    PERMISSIONS.grievanceRead,
    PERMISSIONS.grievanceWrite,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],
  "LG-WO": [
    PERMISSIONS.projectRead,
    PERMISSIONS.resultRead,
    PERMISSIONS.resultWrite,
    PERMISSIONS.beneficiaryRead,
    PERMISSIONS.beneficiaryWrite,
    PERMISSIONS.beneficiaryVerify,
    PERMISSIONS.serviceDeliveryRead,
    PERMISSIONS.serviceDeliveryWrite,
    PERMISSIONS.geoRead,
    PERMISSIONS.geoWrite,
    PERMISSIONS.grievanceRead,
    PERMISSIONS.grievanceWrite,
    PERMISSIONS.grievanceResolve,
    PERMISSIONS.docRead,
    PERMISSIONS.docWrite,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],
  "LG-KO": [
    PERMISSIONS.beneficiaryRead,
    PERMISSIONS.beneficiaryWrite,
    PERMISSIONS.beneficiaryVerify,
    PERMISSIONS.serviceDeliveryRead,
    PERMISSIONS.serviceDeliveryWrite,
    PERMISSIONS.geoRead,
    PERMISSIONS.grievanceRead,
    PERMISSIONS.grievanceWrite,
    PERMISSIONS.fieldCapture,
  ],

  // ---------- Data Collection Team ----------
  "DC-EN": [
    PERMISSIONS.fieldCapture,
    PERMISSIONS.fieldSync,
    PERMISSIONS.collectExecute,
    PERMISSIONS.beneficiaryRead,
    PERMISSIONS.beneficiaryWrite,
    PERMISSIONS.surveyRead,
  ],
  "DC-SV": [
    PERMISSIONS.fieldCapture,
    PERMISSIONS.fieldSupervise,
    PERMISSIONS.collectSupervise,
    PERMISSIONS.qaRead,
    PERMISSIONS.qaReview,
    PERMISSIONS.qaBackcheck,
    PERMISSIONS.surveyRead,
    PERMISSIONS.beneficiaryRead,
  ],

  // ---------- Researchers ----------
  "RS-EX": [
    PERMISSIONS.warehouseRead,
    PERMISSIONS.researchRequest,
    PERMISSIONS.researchDownload,
    PERMISSIONS.impactAnalyticsRead,
  ],

  // ---------- Steering Committee ----------
  "SC-MB": [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.resultRead,
    PERMISSIONS.budgetRead,
    PERMISSIONS.impactAnalyticsRead,
  ],

  // ---------- Auditors ----------
  "AU-EX": [
    PERMISSIONS.projectRead,
    PERMISSIONS.budgetRead,
    PERMISSIONS.disbursementRead,
    PERMISSIONS.procurementRead,
    PERMISSIONS.contractRead,
    PERMISSIONS.beneficiaryRead,
    PERMISSIONS.serviceDeliveryRead,
    PERMISSIONS.docRead,
    PERMISSIONS.auditRead,
    PERMISSIONS.reportRead,
  ],
  "AU-EV": [
    PERMISSIONS.projectRead,
    PERMISSIONS.resultRead,
    PERMISSIONS.impactIndicatorRead,
    PERMISSIONS.impactAnalyticsRead,
    PERMISSIONS.reportRead,
    PERMISSIONS.dashboardRead,
  ],

  // ---------- System / Support ----------
  "SYS-DBA": [PERMISSIONS.systemMonitor, PERMISSIONS.auditRead],
  "SYS-OPS": [
    PERMISSIONS.systemMonitor,
    PERMISSIONS.integrationRead,
    PERMISSIONS.integrationManage,
  ],
  "SYS-SEC": [
    PERMISSIONS.systemMonitor,
    PERMISSIONS.auditRead,
    PERMISSIONS.adminUsers,
    PERMISSIONS.adminRoles,
  ],
  "SYS-HELP": [PERMISSIONS.adminUsers, PERMISSIONS.systemMonitor],
};

/* =========================================================================
 * Role → Default home route
 * ========================================================================= */
export const ROLE_HOME: Record<RoleCode, string> = Object.fromEntries(
  ROLE_CODES.map((role) => [role, "/home"]),
) as Record<RoleCode, string>;

/* =========================================================================
 * Helpers
 * ========================================================================= */
export function isRoleCode(value: string): value is RoleCode {
  return (ROLE_CODES as readonly string[]).includes(value);
}

export function rolePermissions(role: RoleCode): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHome(role: RoleCode): string {
  return ROLE_HOME[role] ?? "/dashboard";
}

export function roleLabel(role: RoleCode): string {
  const labels: Record<RoleCode, string> = {
    "WB-TTL": "World Bank Task Team Leader",
    "WB-IE": "World Bank Impact Evaluation Lead",
    "WB-FM": "World Bank Financial Management Specialist",
    "WB-PROC": "World Bank Procurement Specialist",
    "WB-ES": "World Bank Environmental & Social Specialist",
    "WB-M&E": "World Bank M&E Specialist",
    "MW-SA": "System Administrator (MoWE)",
    "MW-PIU": "MoWE PIU Officer",
    "MW-ME": "MoWE M&E Officer",
    "MW-TL": "MoWE Technical Lead",
    "MW-PM": "MoWE Project Manager",
    "MW-IE": "Impact Evaluation Specialist",
    "MW-DM": "Data Manager",
    "MW-QA": "Data Quality Officer",
    "MW-FO": "Field Operations Coordinator",
    "MF-BO": "MoF Budget Officer",
    "MF-FM": "MoF Financial Management Officer",
    "MF-AUD": "MoF Internal Auditor",
    "DB-LO": "DBE Loan Officer",
    "DB-DO": "DBE Disbursement Officer",
    "DB-PM": "DBE Portfolio Manager",
    "DB-AUD": "DBE Internal Auditor",
    "SP-AD": "Supplier Administrator",
    "SP-OPS": "Supplier Operations Officer",
    "SP-SVC": "Supplier Service Officer",
    "BN-SR": "Self-Registered Beneficiary",
    "BN-REP": "Household Representative",
    "LG-RO": "Regional Officer",
    "LG-ZO": "Zonal Officer",
    "LG-WO": "Woreda Officer",
    "LG-KO": "Kebele Officer",
    "DC-EN": "Data Collector (Enumerator)",
    "DC-SV": "Field Supervisor",
    "RS-EX": "External Researcher",
    "SC-MB": "Steering Committee Member",
    "AU-EX": "External Auditor",
    "AU-EV": "Independent Evaluator",
    "SYS-DBA": "Database Administrator",
    "SYS-OPS": "DevOps Engineer",
    "SYS-SEC": "Security Officer",
    "SYS-HELP": "Help Desk Officer",
  };
  return labels[role];
}