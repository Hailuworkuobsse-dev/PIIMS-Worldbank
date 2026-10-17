import { useState } from "react";
import { Check, MessageSquare } from "lucide-react";
import { useReportComments } from "./inception.queries";
import { useAddComment, useResolveComment } from "./inception.mutations";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useAuthStore } from "@/stores/auth.store";
import { formatDate } from "@/lib/utils/date";

export function CommentThread({
  reportId,
  sectionId,
}: {
  reportId: string;
  sectionId?: string;
}) {
  const { data, isLoading } = useReportComments(reportId);
  const addComment = useAddComment(reportId);
  const resolveComment = useResolveComment(reportId);
  const user = useAuthStore((s) => s.user);
  const { canAny } = usePermissions();
  const [text, setText] = useState("");

  const canComment = canAny(
    PERMISSIONS.inceptionReview,
    PERMISSIONS.inceptionApprove,
    PERMISSIONS.inceptionSubmit,
  );

  if (isLoading) return <LoadingState message="Loading comments…" />;

  const list = (data ?? []).filter(
    (c) => !sectionId || c.sectionId === sectionId,
  );

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await addComment.mutateAsync({ text: trimmed, sectionId });
    setText("");
  };

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <EmptyState
          title="No comments yet"
          icon={<MessageSquare className="h-10 w-10" />}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((c) => (
            <li
              key={c.commentId}
              className={`rounded-md border p-3 ${c.resolved ? "bg-green-50 border-green-200" : "bg-neutral-50 border-neutral-300"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-body-sm font-bold text-primary-900">
                    {c.authorName}
                  </div>
                  <div className="text-caption text-neutral-600">
                    {c.authorRole} · {formatDate(c.createdAt)}
                  </div>
                </div>
                {c.resolved ? (
                  <span className="inline-flex items-center gap-1 text-caption font-bold text-green-700">
                    <Check className="h-3.5 w-3.5" aria-hidden /> Resolved
                  </span>
                ) : (
                  canAny(
                    PERMISSIONS.inceptionReview,
                    PERMISSIONS.inceptionApprove,
                  ) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolveComment.mutate(c.commentId)}
                    >
                      Resolve
                    </Button>
                  )
                )}
              </div>
              <p className="mt-2 text-body-sm text-neutral-900 whitespace-pre-wrap">
                {c.text}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canComment && user && (
        <div className="pt-2 border-t border-neutral-200">
          <Textarea
            label="Add comment"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <Button
              variant="primary"
              size="sm"
              disabled={!text.trim()}
              loading={addComment.isPending}
              onClick={submit}
            >
              Post comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}