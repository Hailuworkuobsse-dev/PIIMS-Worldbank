import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, RequirePermission } from "@/features/auth/guards";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { LoadingState } from "@/components/ui/LoadingState";

const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const AppShellRoute = lazy(() => import("@/pages/AppShellRoute"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
/* ...all other lazy imports identical to Step 3... */

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — everything below lives inside AppShell */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShellRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Projects */}
            <Route
              element={<RequirePermission perm={PERMISSIONS.projectRead} />}
            >
              <Route path="/projects" element={<ProjectListPage />} />
              <Route
                path="/projects/new"
                element={
                  <RequirePermission
                    perm={PERMISSIONS.projectWrite}
                    fallback={<Navigate to="/projects" replace />}
                  />
                }
              />
              <Route
                path="/projects/:projectId"
                element={<ProjectDetailPage />}
              />
              <Route path="/pipeline" element={<PipelinePage />} />
            </Route>

            {/* ...all other module routes unchanged from Step 3, now nested under the shell... */}

            {import.meta.env.DEV && (
              <Route path="/design-system" element={<DesignSystemPage />} />
            )}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}