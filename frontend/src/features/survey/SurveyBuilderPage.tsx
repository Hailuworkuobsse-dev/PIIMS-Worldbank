import { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Rocket, Download, Lock } from "lucide-react";
import { useSurvey } from "./survey.queries";
import { usePublishSurvey } from "./survey.mutations";
import { surveyApi } from "./survey.api";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { QuestionEditor } from "./QuestionEditor";
import { SurveyPreview } from "./SurveyPreview";
import { SkipLogicEditor } from "./SkipLogicEditor";

export default function SurveyBuilderPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { can } = usePermissions();
  const { push } = useToast();
  const { data: survey, isLoading } = useSurvey(surveyId);
  const publish = usePublishSurvey(surveyId ?? "");
  const [selectedSection, setSelectedSection] = useState<string | undefined>();
  const [selectedQuestion, setSelectedQuestion] = useState<
    string | undefined
  >();
  const [questionModal, setQuestionModal] = useState(false);
  const [skipLogicModal, setSkipLogicModal] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  if (isLoading) return <LoadingState />;
  if (!survey) return <EmptyState title="Survey not found" />;

  const isLocked = survey.currentVersion?.locked ?? false;
  const canEdit = can(PERMISSIONS.surveyWrite) && !isLocked;

  const currentSection = survey.sections.find(
    (s) => s.sectionId === selectedSection,
  );
  const currentQuestion = currentSection?.questions.find(
    (q) => q.questionId === selectedQuestion,
  );

  return (
    <main id="main" tabIndex={-1} className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <code className="text-caption font-bold text-primary-700">
              {survey.code}
            </code>
            <Chip
              tone={
                survey.status === "LOCKED"
                  ? "grey"
                  : survey.status === "PUBLISHED"
                    ? "green"
                    : "blue"
              }
            >
              {survey.status}
            </Chip>
            {isLocked && (
              <Chip tone="red">
                <Lock className="h-3 w-3" aria-hidden /> Locked
              </Chip>
            )}
          </div>
          <h1 className="text-h1 text-primary-900">{survey.name}</h1>
          {survey.purpose && (
            <p className="text-body-sm text-neutral-600 mt-1">
              {survey.purpose}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={async () => {
              try {
                const blob = await surveyApi.exportXlsForm(survey.surveyId);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${survey.code}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                push("error", "Export failed");
              }
            }}
          >
            Export XLSForm
          </Button>
          {can(PERMISSIONS.surveyPublish) && !isLocked && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Rocket className="h-4 w-4" />}
              onClick={() => setConfirmPublish(true)}
            >
              Publish & lock
            </Button>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-[300px_1fr_360px] gap-3">
        {/* Sections */}
        <Card padding="none" className="max-h-[720px] overflow-y-auto">
          <CardHeader
            title="Sections"
            action={
              canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  Add
                </Button>
              )
            }
          />
          <ul className="border-t border-neutral-200">
            {survey.sections.map((s) => (
              <li key={s.sectionId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSection(s.sectionId);
                    setSelectedQuestion(undefined);
                  }}
                  className={`w-full text-left px-3 py-2.5 border-b border-neutral-100 text-body-sm ${
                    selectedSection === s.sectionId
                      ? "bg-primary-100 font-semibold text-primary-700"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <code className="text-caption text-primary-700">
                      {s.code}
                    </code>
                    <span className="truncate">{s.title}</span>
                    {s.repeatable && <Chip tone="grey">↻</Chip>}
                  </div>
                  <div className="text-caption text-neutral-500 mt-0.5">
                    {s.questions.length} questions
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Questions in selected section */}
        <Card padding="none">
          {!currentSection ? (
            <EmptyState
              title="Select a section"
              description="Choose a section to view its questions."
            />
          ) : (
            <>
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <code className="text-caption text-primary-700">
                      {currentSection.code}
                    </code>
                    <span>{currentSection.title}</span>
                  </div>
                }
                action={
                  canEdit && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => setQuestionModal(true)}
                    >
                      Add question
                    </Button>
                  )
                }
              />
              <ul className="border-t border-neutral-200 divide-y divide-neutral-100">
                {currentSection.questions.map((q) => (
                  <li key={q.questionId}>
                    <button
                      type="button"
                      onClick={() => setSelectedQuestion(q.questionId)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-neutral-50 ${
                        selectedQuestion === q.questionId
                          ? "bg-primary-100"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <code className="text-caption text-primary-700 mr-2">
                            {q.code}
                          </code>
                          <span className="text-body-sm font-semibold truncate">
                            {q.text}
                          </span>
                        </div>
                        <Chip tone="blue">{q.type}</Chip>
                      </div>
                      {q.skipLogic?.length ? (
                        <div className="text-caption text-neutral-500 mt-1">
                          ⤷ {q.skipLogic.length} skip rule(s)
                        </div>
                      ) : null}
                    </button>
                  </li>
                ))}
                {currentSection.questions.length === 0 && (
                  <li className="p-6 text-center text-caption text-neutral-600">
                    No questions yet. Add one to begin.
                  </li>
                )}
              </ul>
            </>
          )}
        </Card>

        {/* Question detail / preview */}
        <Card>
          <CardHeader title="Preview / details" />
          {currentQuestion ? (
            <div className="space-y-3">
              <div className="text-caption text-neutral-600">
                <code className="text-primary-700 font-bold">
                  {currentQuestion.code}
                </code>
                {" · "}
                {currentQuestion.type}
              </div>
              <div>
                <div className="text-body-sm font-semibold text-primary-900">
                  {currentQuestion.text}
                </div>
                {currentQuestion.textAm && (
                  <div lang="am" className="text-caption text-neutral-600">
                    {currentQuestion.textAm}
                  </div>
                )}
              </div>
              {currentQuestion.options?.length ? (
                <div className="border border-neutral-200 rounded-md divide-y divide-neutral-100">
                  {currentQuestion.options.map((o) => (
                    <div
                      key={o.code}
                      className="px-3 py-1.5 text-caption flex justify-between"
                    >
                      <span>{o.label}</span>
                      <code className="text-neutral-500">{o.value}</code>
                    </div>
                  ))}
                </div>
              ) : null}
              {canEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSkipLogicModal(true)}
                >
                  Manage skip logic
                </Button>
              )}
            </div>
          ) : (
            <SurveyPreview survey={survey} />
          )}
        </Card>
      </div>

      {currentSection && (
        <Modal
          open={questionModal}
          onClose={() => setQuestionModal(false)}
          title="Add question"
          size="md"
        >
          <QuestionEditor
            sectionId={currentSection.sectionId}
            versionId={survey.currentVersion?.versionId ?? ""}
            orderNo={currentSection.questions.length}
            onSuccess={() => setQuestionModal(false)}
          />
        </Modal>
      )}

      {currentSection && currentQuestion && (
        <Modal
          open={skipLogicModal}
          onClose={() => setSkipLogicModal(false)}
          title="Skip logic"
          size="md"
        >
          <SkipLogicEditor
            versionId={survey.currentVersion?.versionId ?? ""}
            question={currentQuestion}
            allQuestions={currentSection.questions}
            onSuccess={() => setSkipLogicModal(false)}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        title="Publish & lock survey"
        message="Once published, the current version is locked and cannot be edited. You can still create a new version later."
        confirmLabel="Publish"
        onConfirm={() => {
          publish.mutate();
          setConfirmPublish(false);
        }}
      />
    </main>
  );
}