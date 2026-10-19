import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FolderKanban, Target, Wallet, ShoppingCart, Users, BarChart3, FileText, ShieldCheck, Bell, Map, Gavel, TrendingUp, Microscope, Cog } from "lucide-react";
import { PERMISSIONS, type Permission } from "@/features/auth/auth.types";

export interface MenuItem {
  id: string;
  label: string; // i18n key
  to: string;
  icon?: LucideIcon;
  anyOf?: Permission[];
  children?: MenuItem[];
  /** Section under which this item appears. */
  section?: "main" | "operations" | "impact" | "outputs" | "admin";
}

export interface MenuSection {
  id: MenuItem["section"];
  label: string; // i18n key or literal
}

export const MENU_SECTIONS: MenuSection[] = [
  { id: "main", label: "Main" },
  { id: "operations", label: "Operations" },
  { id: "impact", label: "Impact" },
  { id: "outputs", label: "Outputs" },
  { id: "admin", label: "Admin" },
];

export const MENU: MenuItem[] = [
  /* ---------------- MAIN ---------------- */
  {
    id: "dashboard",
    label: "nav.dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    section: "main",
    anyOf: [PERMISSIONS.dashboardRead],
  },
  {
    id: "projects",
    label: "nav.projects",
    to: "/projects",
    icon: FolderKanban,
    section: "main",
    anyOf: [PERMISSIONS.projectRead],
    children: [
      {
        id: "projects-list",
        label: "nav.projectsAll",
        to: "/projects",
        anyOf: [PERMISSIONS.projectRead],
      },
      {
        id: "projects-new",
        label: "nav.projectsNew",
        to: "/projects/new",
        anyOf: [PERMISSIONS.projectWrite],
      },
      {
        id: "pipeline",
        label: "nav.pipeline",
        to: "/pipeline",
        anyOf: [PERMISSIONS.projectRead],
      },
      {
        id: "inception",
        label: "nav.inception",
        to: "/inception",
        anyOf: [PERMISSIONS.inceptionRead],
      },
    ],
  },
  {
    id: "results",
    label: "nav.results",
    to: "/results",
    icon: Target,
    section: "main",
    anyOf: [PERMISSIONS.resultRead],
  },
  {
    id: "reports",
    label: "nav.reports",
    to: "/reports",
    icon: BarChart3,
    section: "main",
    anyOf: [PERMISSIONS.reportRead],
  },

  /* ---------------- OPERATIONS ---------------- */
  {
    id: "financial",
    label: "nav.financial",
    to: "/financial",
    icon: Wallet,
    section: "operations",
    anyOf: [PERMISSIONS.budgetRead, PERMISSIONS.disbursementRead],
    children: [
      {
        id: "financial-budget",
        label: "nav.budget",
        to: "/financial",
        anyOf: [PERMISSIONS.budgetRead],
      },
      {
        id: "financial-disbursements",
        label: "nav.disbursements",
        to: "/financial/disbursements",
        anyOf: [PERMISSIONS.disbursementRead],
      },
      {
        id: "financial-fmis",
        label: "nav.fmisSync",
        to: "/financial/fmis",
        anyOf: [PERMISSIONS.financeReconcile],
      },
    ],
  },
  {
    id: "procurement",
    label: "nav.procurement",
    to: "/procurement",
    icon: ShoppingCart,
    section: "operations",
    anyOf: [PERMISSIONS.procurementRead],
  },
  {
    id: "supplier",
    label: "nav.supplier",
    to: "/supplier",
    icon: Gavel,
    section: "operations",
    anyOf: [PERMISSIONS.supplierSelfRead],
  },
  {
    id: "beneficiaries",
    label: "nav.beneficiaries",
    to: "/beneficiaries",
    icon: Users,
    section: "operations",
    anyOf: [PERMISSIONS.beneficiaryRead],
    children: [
      {
        id: "beneficiaries-list",
        label: "nav.registry",
        to: "/beneficiaries",
        anyOf: [PERMISSIONS.beneficiaryRead],
      },
      {
        id: "beneficiaries-services",
        label: "nav.serviceDelivery",
        to: "/services",
        anyOf: [PERMISSIONS.serviceDeliveryRead],
      },
    ],
  },
  {
    id: "map",
    label: "nav.map",
    to: "/map",
    icon: Map,
    section: "operations",
    anyOf: [PERMISSIONS.geoRead],
  },
  {
    id: "documents",
    label: "nav.documents",
    to: "/documents",
    icon: FileText,
    section: "operations",
    anyOf: [PERMISSIONS.docRead],
  },
  {
    id: "grievances",
    label: "nav.grievances",
    to: "/grievances",
    icon: Bell,
    section: "operations",
    anyOf: [PERMISSIONS.grievanceRead],
  },

  /* ---------------- IMPACT ---------------- */
  {
    id: "impact",
    label: "nav.impact",
    to: "/impact",
    icon: TrendingUp,
    section: "impact",
    anyOf: [PERMISSIONS.impactIndicatorRead, PERMISSIONS.impactAnalyticsRead],
    children: [
      {
        id: "impact-dashboard",
        label: "nav.impactDashboard",
        to: "/impact",
        anyOf: [
          PERMISSIONS.impactAnalyticsRead,
          PERMISSIONS.impactIndicatorRead,
        ],
      },
      {
        id: "impact-indicators",
        label: "nav.impactIndicators",
        to: "/impact/indicators",
        anyOf: [PERMISSIONS.impactIndicatorRead],
      },
      {
        id: "impact-surveys",
        label: "nav.surveys",
        to: "/impact/surveys",
        anyOf: [PERMISSIONS.surveyRead],
      },
      {
        id: "impact-field",
        label: "nav.fieldOps",
        to: "/impact/field",
        anyOf: [
          PERMISSIONS.collectExecute,
          PERMISSIONS.collectSupervise,
          PERMISSIONS.collectAssign,
        ],
      },
      {
        id: "impact-qa",
        label: "nav.dataQuality",
        to: "/impact/qa",
        anyOf: [PERMISSIONS.qaRead],
      },
      {
        id: "impact-warehouse",
        label: "nav.warehouse",
        to: "/impact/warehouse",
        anyOf: [PERMISSIONS.warehouseRead],
      },
    ],
  },
  {
    id: "research",
    label: "nav.research",
    to: "/research",
    icon: Microscope,
    section: "impact",
    anyOf: [PERMISSIONS.researchRequest],
    children: [
      {
        id: "research-catalogue",
        label: "nav.datasetCatalogue",
        to: "/research",
        anyOf: [PERMISSIONS.warehouseRead, PERMISSIONS.researchRequest],
      },
      {
        id: "research-requests",
        label: "nav.myRequests",
        to: "/research/requests",
        anyOf: [PERMISSIONS.researchRequest],
      },
    ],
  },

  /* ---------------- ADMIN ---------------- */
  {
    id: "admin",
    label: "nav.admin",
    to: "/admin",
    icon: Cog,
    section: "admin",
    anyOf: [
      PERMISSIONS.adminUsers,
      PERMISSIONS.adminRoles,
      PERMISSIONS.adminSettings,
    ],
    children: [
      {
        id: "admin-home",
        label: "nav.overview",
        to: "/admin",
        anyOf: [PERMISSIONS.adminUsers, PERMISSIONS.adminSettings],
      },
      {
        id: "admin-users",
        label: "nav.usersRoles",
        to: "/admin/users",
        anyOf: [PERMISSIONS.adminUsers],
      },
      {
        id: "admin-integrations",
        label: "nav.integrations",
        to: "/admin/integrations",
        anyOf: [PERMISSIONS.integrationRead, PERMISSIONS.integrationManage],
      },
    ],
  },
  {
    id: "audit",
    label: "nav.audit",
    to: "/audit",
    icon: ShieldCheck,
    section: "admin",
    anyOf: [PERMISSIONS.auditRead],
  },
];

/* -------------------------------------------------------------------------
 * Breadcrumb dictionary — path → label key
 * ------------------------------------------------------------------------- */
export const BREADCRUMBS: Record<string, string> = {
  dashboard: "nav.dashboard",
  projects: "nav.projects",
  new: "nav.projectsNew",
  pipeline: "nav.pipeline",
  inception: "nav.inception",
  results: "nav.results",
  financial: "nav.financial",
  disbursements: "nav.disbursements",
  fmis: "nav.fmisSync",
  procurement: "nav.procurement",
  supplier: "nav.supplier",
  beneficiaries: "nav.beneficiaries",
  services: "nav.serviceDelivery",
  map: "nav.map",
  documents: "nav.documents",
  grievances: "nav.grievances",
  impact: "nav.impact",
  indicators: "nav.impactIndicators",
  surveys: "nav.surveys",
  field: "nav.fieldOps",
  qa: "nav.dataQuality",
  warehouse: "nav.warehouse",
  research: "nav.research",
  requests: "nav.myRequests",
  reports: "nav.reports",
  admin: "nav.admin",
  users: "nav.usersRoles",
  integrations: "nav.integrations",
  audit: "nav.audit",
};