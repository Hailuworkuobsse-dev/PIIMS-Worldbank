import { useState } from "react";
import { FileText, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { CommentThread } from "./CommentThread";
import { NoObjectionModal } from "./NoObjectionModal";
import { VersionCompare } from "./VersionCompare";
import { useReportVersions } from "./inception.queries";
import { useReviewInception } from "./inception.mutations";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import type { InceptionReport } from "./inception.types";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/components/ui/utils/cn";

export function ReviewWorkspace({
  report,
  canReview,
}: {
  report: InceptionReport;
  canReview: boolean;
}) {
  const { can } = usePermissions();
  const { data: versions } = useReportVersions(report.projectId);
  const [decisionOpen, setDecisionOpen] = useState<
    null | "APPROVE" | "REQUEST_REVISION" | "REJECT"
  >(null);
  const [noObjOpen, setNoObjOpen] = useState(false);
  const [comments, setComments] = useState("");
  const reviewMutation = useReviewInception(report.reportId);

  const onConfirmDecision = async () => {
    if (!decisionOpen) return;
    await reviewMutation.mutateAsync({ decision: decisionOpen, comments });
    setDecisionOpen(null);
    setComments("");
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-4">
      {/* Left — document + comments */}
      <div className="space-y-4 min-w-0">
        <Card padding="none">
          <Tabs
            tabs={[
              {
                id: "doc",
                label: "Document",
                content: (
                  <div className="p-4">
                    <div className="aspect-[8.5/11] bg-neutral-100 border border-neutral-300 rounded-md flex flex-col items-center justify-center text-neutral-600">
                      <FileText className="h-16 w-16 opacity-40" aria-hidden />
                      <p className="mt-3 text-body-sm">PDF preview</p>
                      <p className="text-caption">
                        In browsers where PDF.js is configured, the document
                        renders here.
                      </p>
                      <a
                        href={report.documentPath ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 text-primary-700 text-caption font-semibold hover:underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                ),
              },
              {
                id: "compare",
                label: "Compare versions",
                content: <VersionCompare versions={versions ?? []} />,
              },
            ]}
          />
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4" aria-hidden /> Review
                comments
              </span>
            }
          />
          <CommentThread reportId={report.reportId} />
        </Card>
      </div>

      {/* Right — actions */}
      <aside className="space-y-4 lg:sticky lg:top-4 self-start">
        <Card>
          <CardHeader title="Decision" />
          {!canReview ? (
            <p className="text-body-sm text-neutral-600">
              You do not have permission to record a review decision.
            </p>
          ) : (
            <div className="space-y-2">
              {can(PERMISSIONS.inceptionApprove) && (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => setDecisionOpen("APPROVE")}
                  disabled={report.status === "APPROVED"}
                >
                  Approve report
                </Button>
              )}
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setDecisionOpen("REQUEST_REVISION")}
                disabled={!can(PERMISSIONS.inceptionReview)}
              >
                Request revision
              </Button>
              <Button
                variant="danger"
                fullWidth
                leftIcon={<XCircle className="h-4 w-4" />}
                onClick={() => setDecisionOpen("REJECT")}
                disabled={!can(PERMISSIONS.inceptionReview)}
              >
                Reject
              </Button>
              {can(PERMISSIONS.inceptionApprove) &&
                !report.noObjection &&
                report.status === "APPROVED" && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => setNoObjOpen(true)}
                  >
                    Record no-objection
                  </Button>
                )}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Metadata" />
          <dl className="text-caption space-y-2">
            <Row label="Template" value={report.templateName} />
            <Row label="Version" value={`v${report.version}`} />
            <Row label="Submitted" value={report.submissionDate ?? "—"} />
            <Row label="Submitted by" value={report.submittedByName ?? "—"} />
            <Row label="Reviewed" value={report.reviewedAt ?? "—"} />
            <Row label="Reviewed by" value={report.reviewedByName ?? "—"} />
          </dl>
        </Card>
      </aside>

      {/* Decision confirmation */}
      <Modal
        open={!!decisionOpen}
        onClose={() => setDecisionOpen(null)}
        title={
          decisionOpen === "APPROVE"
            ? "Approve inception report"
            : decisionOpen === "REQUEST_REVISION"
              ? "Request revision"
              : "Reject report"
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDecisionOpen(null)}>
              Cancel
            </Button>
            <Button
              variant={decisionOpen === "REJECT" ? "danger" : "primary"}
              loading={reviewMutation.isPending}
              onClick={onConfirmDecision}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Textarea
          label={
            decisionOpen === "APPROVE"
              ? "Comments (optional)"
              : "Comments (required)"
          }
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          required={decisionOpen !== "APPROVE"}
          className={cn(
            decisionOpen !== "APPROVE" &&
              comments.trim().length < 10 &&
              "border-danger",
          )}
        />
      </Modal>

      <NoObjectionModal
        open={noObjOpen}
        onClose={() => setNoObjOpen(false)}
        reportId={report.reportId}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="font-semibold text-neutral-900 truncate text-right">
        {value ?? "—"}
      </dd>
    </div>
  );
}