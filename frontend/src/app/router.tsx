import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, RequirePermission } from "@/features/auth/guards";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { LoadingState } from "@/components/ui/LoadingState";

/* ---- Lazy pages (only loaded when needed) ---- */
const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

/* Projects (M2) */
const ProjectListPage = lazy(
  () => import("@/features/projects/ProjectListPage"),
);
const ProjectNewPage = lazy(() => import("@/features/projects/ProjectNewPage"));
const ProjectDetailPage = lazy(
  () => import("@/features/projects/ProjectDetailPage"),
);
const PipelinePage = lazy(() => import("@/features/projects/PipelinePage"));

/* Inception (M3) */
const InceptionListPage = lazy(
  () => import("@/features/inception/InceptionListPage"),
);
const InceptionReviewPage = lazy(
  () => import("@/features/inception/InceptionReviewPage"),
);

/* Results (M4) */
const ResultsPage = lazy(() => import("@/features/results/ResultsPage"));
const IndicatorEntryPage = lazy(
  () => import("@/features/results/IndicatorEntryPage"),
);

/* Financial (M5) */
const FinancialPage = lazy(() => import("@/features/financial/FinancialPage"));
const DisbursementPage = lazy(
  () => import("@/features/financial/DisbursementPage"),
);
const FmisSyncPage = lazy(() => import("@/features/financial/FmisSyncPage"));

/* Procurement (M6) */
const ProcurementPage = lazy(
  () => import("@/features/procurement/ProcurementPage"),
);

/* Supplier (M7) */
const SupplierPortalPage = lazy(
  () => import("@/features/supplier/SupplierPortalPage"),
);

/* Beneficiary (M8) */
const BeneficiaryPage = lazy(
  () => import("@/features/beneficiaries/BeneficiaryListPage"),
);
const ServiceDeliveryPage = lazy(
  () => import("@/features/beneficiaries/ServiceDeliveryPage"),
);

/* GIS (M9) */
const MapPage = lazy(() => import("@/features/geo/MapPage"));

/* Documents (M10) */
const DocumentsPage = lazy(() => import("@/features/documents/DocumentsPage"));

/* Reports (M11) */
const ReportsPage = lazy(() => import("@/features/reports/ReportsPage"));

/* Grievance (M13) */
const GrievancePage = lazy(() => import("@/features/grievances/GrievancePage"));

/* Impact (M18–M23) */
const ImpactDashboardPage = lazy(
  () => import("@/features/analytics/ImpactDashboardPage"),
);
const ImpactIndicatorsPage = lazy(
  () => import("@/features/impact-indicators/ImpactIndicatorsPage"),
);
const SurveyBuilderPage = lazy(
  () => import("@/features/survey/SurveyBuilderPage"),
);
const FieldOpsPage = lazy(() => import("@/features/field/FieldOpsPage"));
const QAPage = lazy(() => import("@/features/qa/QAPage"));
const WarehousePage = lazy(() => import("@/features/warehouse/WarehousePage"));

/* Research (M22–M23) */
const ResearchCataloguePage = lazy(
  () => import("@/features/research/ResearchCataloguePage"),
);
const ResearchRequestsPage = lazy(
  () => import("@/features/research/ResearchRequestsPage"),
);

/* Admin (M16) */
const AdminHomePage = lazy(() => import("@/features/admin/AdminHomePage"));
const AdminUsersPage = lazy(() => import("@/features/admin/AdminUsersPage"));
const AdminIntegrationsPage = lazy(
  () => import("@/features/admin/AdminIntegrationsPage"),
);
const AuditPage = lazy(() => import("@/features/admin/AuditPage"));

/* Design system (dev only) */
const DesignSystemPage = lazy(() => import("@/pages/DesignSystemPage"));

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <Routes>
        {/* ---- Public ---- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ---- Protected ---- */}
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Projects */}
          <Route element={<RequirePermission perm={PERMISSIONS.projectRead} />}>
            <Route path="/projects" element={<ProjectListPage />} />
            <Route
              path="/projects/new"
              element={
                <RequirePermission
                  perm={PERMISSIONS.projectWrite}
                  fallback={<Navigate to="/projects" replace />}
                >
                  <ProjectNewPage />
                </RequirePermission>
              }
            />
            <Route
              path="/projects/:projectId"
              element={<ProjectDetailPage />}
            />
            <Route path="/pipeline" element={<PipelinePage />} />
          </Route>

          {/* Inception */}
          <Route
            element={<RequirePermission perm={PERMISSIONS.inceptionRead} />}
          >
            <Route path="/inception" element={<InceptionListPage />} />
            <Route
              path="/inception/:reportId/review"
              element={
                <RequirePermission
                  anyOf={[
                    PERMISSIONS.inceptionReview,
                    PERMISSIONS.inceptionApprove,
                  ]}
                >
                  <InceptionReviewPage />
                </RequirePermission>
              }
            />
          </Route>

          {/* Results */}
          <Route element={<RequirePermission perm={PERMISSIONS.resultRead} />}>
            <Route path="/results" element={<ResultsPage />} />
            <Route
              path="/results/:indicatorId/entry"
              element={
                <RequirePermission perm={PERMISSIONS.resultWrite}>
                  <IndicatorEntryPage />
                </RequirePermission>
              }
            />
          </Route>

          {/* Financial */}
          <Route
            element={
              <RequirePermission
                anyOf={[PERMISSIONS.budgetRead, PERMISSIONS.disbursementRead]}
              />
            }
          >
            <Route path="/financial" element={<FinancialPage />} />
            <Route
              path="/financial/disbursements"
              element={<DisbursementPage />}
            />
            <Route
              path="/financial/fmis"
              element={
                <RequirePermission perm={PERMISSIONS.financeReconcile}>
                  <FmisSyncPage />
                </RequirePermission>
              }
            />
          </Route>

          {/* Procurement */}
          <Route
            element={<RequirePermission perm={PERMISSIONS.procurementRead} />}
          >
            <Route path="/procurement" element={<ProcurementPage />} />
          </Route>

          {/* Supplier */}
          <Route
            element={<RequirePermission perm={PERMISSIONS.supplierSelfRead} />}
          >
            <Route path="/supplier" element={<SupplierPortalPage />} />
          </Route>

          {/* Beneficiaries */}
          <Route
            element={<RequirePermission perm={PERMISSIONS.beneficiaryRead} />}
          >
            <Route path="/beneficiaries" element={<BeneficiaryPage />} />
            <Route path="/services" element={<ServiceDeliveryPage />} />
          </Route>

          {/* GIS */}
          <Route element={<RequirePermission perm={PERMISSIONS.geoRead} />}>
            <Route path="/map" element={<MapPage />} />
          </Route>

          {/* Documents */}
          <Route element={<RequirePermission perm={PERMISSIONS.docRead} />}>
            <Route path="/documents" element={<DocumentsPage />} />
          </Route>

          {/* Reports */}
          <Route element={<RequirePermission perm={PERMISSIONS.reportRead} />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Grievances */}
          <Route
            element={<RequirePermission perm={PERMISSIONS.grievanceRead} />}
          >
            <Route path="/grievances" element={<GrievancePage />} />
          </Route>

          {/* Impact suite */}
          <Route
            element={
              <RequirePermission
                anyOf={[
                  PERMISSIONS.impactIndicatorRead,
                  PERMISSIONS.impactAnalyticsRead,
                ]}
              />
            }
          >
            <Route path="/impact" element={<ImpactDashboardPage />} />
            <Route
              path="/impact/indicators"
              element={<ImpactIndicatorsPage />}
            />
            <Route
              path="/impact/surveys"
              element={
                <RequirePermission perm={PERMISSIONS.surveyWrite}>
                  <SurveyBuilderPage />
                </RequirePermission>
              }
            />
            <Route path="/impact/field" element={<FieldOpsPage />} />
            <Route
              path="/impact/qa"
              element={
                <RequirePermission perm={PERMISSIONS.qaRead}>
                  <QAPage />
                </RequirePermission>
              }
            />
            <Route
              path="/impact/warehouse"
              element={
                <RequirePermission perm={PERMISSIONS.warehouseRead}>
                  <WarehousePage />
                </RequirePermission>
              }
            />
          </Route>

          {/* Research */}
          <Route
            element={<RequirePermission perm={PERMISSIONS.researchRequest} />}
          >
            <Route path="/research" element={<ResearchCataloguePage />} />
            <Route
              path="/research/requests"
              element={<ResearchRequestsPage />}
            />
          </Route>

          {/* Admin */}
          <Route
            element={
              <RequirePermission
                anyOf={[PERMISSIONS.adminUsers, PERMISSIONS.adminSettings]}
              />
            }
          >
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route
              path="/admin/integrations"
              element={<AdminIntegrationsPage />}
            />
          </Route>
          <Route element={<RequirePermission perm={PERMISSIONS.auditRead} />}>
            <Route path="/audit" element={<AuditPage />} />
          </Route>

          {/* Dev-only */}
          {import.meta.env.DEV && (
            <Route path="/design-system" element={<DesignSystemPage />} />
          )}
        </Route>

        {/* ---- Fallback ---- */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}