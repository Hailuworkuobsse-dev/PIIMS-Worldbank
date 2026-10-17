import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useInceptionReport } from "./inception.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ReviewWorkspace } from "./ReviewWorkspace";
import { reportStatusTone, reportStatusKey } from "./inception.utils";
import { formatDate } from "@/lib/utils/date";

export default function InceptionReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const { data: report, isLoading, isError } = useInceptionReport(reportId);
  const { canAny } = usePermissions();

  if (isLoading) return <LoadingState message="Loading report…" />;
  if (isError || !report) {
    return (
      <EmptyState
        title="Report not found"
        description="The report may have been removed."
      />
    );
  }

  const canReview = canAny(
    PERMISSIONS.inceptionReview,
    PERMISSIONS.inceptionApprove,
  );

  return (
    <main id="main" tabIndex={-1} className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate("/inception")}
        >
          Back
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-caption text-neutral-600">
            <code className="font-bold text-primary-700">
              {report.projectCode}
            </code>{" "}
            · Inception report v{report.version}
          </div>
          <h1 className="text-h1 text-primary-900 mt-1">
            {report.projectName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Chip tone={reportStatusTone(report.status)}>
              {t(reportStatusKey(report.status))}
            </Chip>
            {report.submissionDate && (
              <span className="text-caption text-neutral-600">
                Submitted {formatDate(report.submissionDate)}
              </span>
            )}
            {report.noObjection && (
              <Chip tone="green">No-objection granted</Chip>
            )}
          </div>
        </div>
      </header>

      <ReviewWorkspace report={report} canReview={canReview} />
    </main>
  );
}