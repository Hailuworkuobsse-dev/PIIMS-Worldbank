import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
  Clock,
  WifiOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DateInput } from "@/components/ui/DateInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { Banner } from "@/components/ui/Banner";
import { useToast } from "@/components/ui/Toast";
import { useSyncStore } from "@/stores/sync.store";
import { computeVisibility } from "@/features/survey/skipLogic";
import { offlineStore } from "./offlineStore";
import { useSubmitInterview } from "./field.mutations";
import type {
  Assignment,
  ConsentPayload,
  ParadataEntry,
  Question,
  Submission,
  SubmissionAnswer,
  SurveyView,
} from "./field.types";

const CONSENT_VERSION = "v1.2";

export interface CapiRendererProps {
  assignment: Assignment;
  surveyView: SurveyView;
  collectorId: string;
  deviceId?: string;
  onExit: () => void;
}

export function CapiRenderer({
  assignment,
  surveyView,
  collectorId,
  deviceId,
  onExit,
}: CapiRendererProps) {
  const { t } = useTranslation();
  const { push } = useToast();
  const online = useSyncStore((s) => s.online);
  const submitMutation = useSubmitInterview();

  /* ---------------- Session state ---------------- */
  const [phase, setPhase] = useState<"consent" | "interview" | "complete">(
    "consent",
  );
  const [consent, setConsent] = useState<ConsentPayload>({
    participation: false,
    data_use: false,
    future_research: false,
    media: false,
    contact: false,
    consent_version: CONSENT_VERSION,
    language: "en",
  });
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [paradata, setParadata] = useState<Record<string, ParadataEntry>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gpsStart, setGpsStart] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [gpsEnd, setGpsEnd] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [photoData, setPhotoData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [localId] = useState(() => crypto.randomUUID());

  const startedAtRef = useRef(new Date().toISOString());
  const questionEnteredAtRef = useRef<number>(Date.now());

  /* ---------------- Compute visible questions ---------------- */
  const flatQuestions = useMemo(() => {
    const list: Question[] = [];
    for (const s of surveyView.sections) {
      for (const q of s.questions) list.push(q);
    }
    return list;
  }, [surveyView]);

  const visibility = useMemo(
    () =>
      computeVisibility(
        flatQuestions.map((q) => ({
          questionId: q.questionId,
          skipLogic: q.skipLogic?.map((l) => ({
            condition: l.condition,
            action: l.action,
            targetQuestionId: l.targetQuestionId,
          })),
        })),
        answers,
      ),
    [flatQuestions, answers],
  );

  const visibleQuestions = useMemo(
    () => flatQuestions.filter((q) => visibility.visible.has(q.questionId)),
    [flatQuestions, visibility.visible],
  );

  const currentQuestion = visibleQuestions[currentIndex];
  const progress =
    visibleQuestions.length > 0
      ? ((currentIndex + 1) / visibleQuestions.length) * 100
      : 0;

  /* ---------------- Capture GPS at start ---------------- */
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setGpsStart({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => {
        /* GPS is best-effort */
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  /* ---------------- Track paradata per question ---------------- */
  useEffect(() => {
    if (!currentQuestion) return;
    questionEnteredAtRef.current = Date.now();
    return () => {
      const elapsed = Date.now() - questionEnteredAtRef.current;
      setParadata((prev) => ({
        ...prev,
        [currentQuestion.questionId]: {
          ...(prev[currentQuestion.questionId] ?? {
            editCount: 0,
            interrupted: false,
          }),
          questionId: currentQuestion.questionId,
          timeSpentMs:
            (prev[currentQuestion.questionId]?.timeSpentMs ?? 0) + elapsed,
          editCount: prev[currentQuestion.questionId]?.editCount ?? 0,
          interrupted: prev[currentQuestion.questionId]?.interrupted ?? false,
        },
      }));
    };
  }, [currentQuestion]);

  /* ---------------- Autosave draft ---------------- */
  useEffect(() => {
    if (phase !== "interview") return;
    const id = window.setInterval(async () => {
      await offlineStore.saveDraft({
        localId,
        assignmentId: assignment.assignmentId,
        answers,
        startedAt: startedAtRef.current,
        lastSavedAt: new Date().toISOString(),
        sectionIndex: 0,
        questionIndex: currentIndex,
      });
    }, 20_000);
    return () => window.clearInterval(id);
  }, [phase, localId, assignment.assignmentId, answers, currentIndex]);

  /* ---------------- Handlers ---------------- */
  const setAnswer = (question: Question, value: any) => {
    const prev = answers[question.code];
    if (prev !== undefined && prev !== value) {
      setParadata((p) => ({
        ...p,
        [question.questionId]: {
          ...(p[question.questionId] ?? {
            questionId: question.questionId,
            timeSpentMs: 0,
            interrupted: false,
          }),
          questionId: question.questionId,
          timeSpentMs: p[question.questionId]?.timeSpentMs ?? 0,
          editCount: (p[question.questionId]?.editCount ?? 0) + 1,
          interrupted: false,
        },
      }));
    }
    setAnswers({ ...answers, [question.code]: value });
    setError(null);
  };

  const validateQuestion = (question: Question): boolean => {
    const value = answers[question.code];
    const isRequired =
      question.required || visibility.required.has(question.questionId);
    if (
      isRequired &&
      (value == null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0))
    ) {
      setError(t("field.required"));
      return false;
    }
    return true;
  };

  const next = () => {
    if (!currentQuestion) return;
    if (!validateQuestion(currentQuestion)) return;
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const capturePhoto = (question: Question) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoData((p) => ({
          ...p,
          [question.questionId]: String(reader.result),
        }));
        setAnswer(question, file.name);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const captureGpsForQuestion = (question: Question) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setAnswer(question, {
          lat: p.coords.latitude,
          lon: p.coords.longitude,
        }),
      () => setError("GPS capture failed"),
      { enableHighAccuracy: true },
    );
  };

  const finish = async () => {
    /* Capture end GPS */
    let endGps = gpsEnd;
    if (navigator.geolocation) {
      endGps = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
          () => resolve(gpsStart),
          { enableHighAccuracy: true, timeout: 5000 },
        );
      });
      setGpsEnd(endGps);
    }

    const submissionAnswers: SubmissionAnswer[] = [];
    for (const q of flatQuestions) {
      if (!visibility.visible.has(q.questionId)) continue;
      const val = answers[q.code];
      if (val === undefined || val === null || val === "") continue;

      let answer: SubmissionAnswer = {
        questionId: q.questionId,
        valueType: "TEXT",
      };
      if (q.type === "NUMERIC" || q.type === "DECIMAL") {
        answer = {
          questionId: q.questionId,
          valueType: "NUMERIC",
          valueNumeric: Number(val),
        };
      } else if (q.type === "DATE") {
        answer = {
          questionId: q.questionId,
          valueType: "DATE",
          valueDate: String(val),
        };
      } else if (q.type === "GPS") {
        answer = {
          questionId: q.questionId,
          valueType: "GPS",
          valueGps: val as any,
        };
      } else if (q.type === "MULTI") {
        answer = {
          questionId: q.questionId,
          valueType: "JSON",
          valueJson: { selections: val },
        };
      } else if (q.type === "PHOTO" || q.type === "AUDIO") {
        answer = {
          questionId: q.questionId,
          valueType: "MEDIA",
          valueText: String(val),
        };
      } else {
        answer = {
          questionId: q.questionId,
          valueType: "TEXT",
          valueText: String(val),
        };
      }
      submissionAnswers.push(answer);
    }

    const submission: Submission = {
      assignmentId: assignment.assignmentId,
      collectorId,
      waveId: assignment.waveId,
      surveyVersionId: assignment.surveyVersionId,
      startedAt: startedAtRef.current,
      endedAt: new Date().toISOString(),
      gpsStart: gpsStart ?? undefined,
      gpsEnd: endGps ?? undefined,
      deviceId,
      consent,
      answers: submissionAnswers,
      paradata: Object.values(paradata),
      status: "SUBMITTED",
    };

    try {
      if (online) {
        await submitMutation.mutateAsync(submission);
      } else {
        await offlineStore.enqueue(submission);
        push("info", "Offline — interview saved to queue");
      }
      await offlineStore.deleteDraft(localId);
      setPhase("complete");
      setTimeout(() => onExit(), 1500);
    } catch {
      // Failsafe: still queue it locally
      await offlineStore.enqueue(submission);
      push("warning", "Sync failed — saved to offline queue");
      setPhase("complete");
      setTimeout(() => onExit(), 1500);
    }
  };

  /* ---------------- Render ---------------- */

  if (phase === "consent") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-300 rounded-lg max-w-lg w-full p-6 space-y-4">
          <header>
            <h1 className="text-h2 text-primary-900">Consent · ስምምነት</h1>
            <p className="text-body-sm text-neutral-600 mt-1">
              {assignment.waveCode} · {assignment.waveName}
            </p>
          </header>

          <Banner tone="info">
            Read the following aloud to the respondent. Participation is
            voluntary. They may withdraw at any time.
          </Banner>

          <div className="space-y-2">
            <Checkbox
              label="Respondent agrees to participate"
              checked={consent.participation}
              onChange={(e) =>
                setConsent({ ...consent, participation: e.target.checked })
              }
            />
            <Checkbox
              label="Respondent agrees to data use for M&E"
              checked={consent.data_use}
              onChange={(e) =>
                setConsent({ ...consent, data_use: e.target.checked })
              }
            />
            <Checkbox
              label="Respondent agrees to future research use (optional)"
              checked={consent.future_research}
              onChange={(e) =>
                setConsent({ ...consent, future_research: e.target.checked })
              }
            />
            <Checkbox
              label="Respondent agrees to photo/audio (optional)"
              checked={consent.media}
              onChange={(e) =>
                setConsent({ ...consent, media: e.target.checked })
              }
            />
            <Checkbox
              label="Respondent agrees to follow-up contact (optional)"
              checked={consent.contact}
              onChange={(e) =>
                setConsent({ ...consent, contact: e.target.checked })
              }
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={onExit}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!consent.participation || !consent.data_use}
              onClick={() => setPhase("interview")}
              fullWidth
            >
              Begin interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-300 rounded-lg max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-3">✓</div>
          <h2 className="text-h2 text-primary-900">Interview complete</h2>
          <p className="text-body-sm text-neutral-600 mt-2">
            {online ? "Submitted to server." : "Queued for sync when online."}
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-body-sm text-neutral-600">
            No questions to display.
          </p>
          <Button className="mt-3" variant="secondary" onClick={onExit}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  const q = currentQuestion;
  const value = answers[q.code];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-primary-900 text-white">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <button
            onClick={onExit}
            aria-label="Exit interview"
            className="hover:bg-white/10 p-1 rounded"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="text-caption opacity-70">
              {assignment.waveCode} · {assignment.waveName}
            </div>
            <div className="text-body-sm font-semibold">
              Q {currentIndex + 1} / {visibleQuestions.length}
            </div>
          </div>
          {!online && (
            <WifiOff className="h-4 w-4 text-accent-300" aria-label="Offline" />
          )}
        </div>
        <div className="h-1 bg-primary-700">
          <div
            className="h-full bg-accent-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Question */}
      <main id="main" className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="text-body-sm font-semibold text-primary-700 mb-1">
          {q.code}
        </div>
        <div className="text-h2 text-primary-900 leading-snug">{q.text}</div>
        {q.textAm && (
          <div lang="am" className="text-body-sm text-neutral-600 mt-1">
            {q.textAm}
          </div>
        )}
        {(q.required || visibility.required.has(q.questionId)) && (
          <div className="text-caption text-danger mt-1">* Required</div>
        )}

        <div className="mt-6">
          {q.type === "TEXT" && (
            <Textarea
              rows={3}
              value={value ?? ""}
              onChange={(e) => setAnswer(q, e.target.value)}
              label="Answer"
            />
          )}
          {q.type === "NUMERIC" && (
            <Input
              type="number"
              inputMode="numeric"
              label="Answer"
              value={value ?? ""}
              onChange={(e) =>
                setAnswer(
                  q,
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          )}
          {q.type === "DECIMAL" && (
            <Input
              type="number"
              step="any"
              label="Answer"
              value={value ?? ""}
              onChange={(e) =>
                setAnswer(
                  q,
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          )}
          {q.type === "DATE" && (
            <DateInput
              label="Answer"
              value={value ?? ""}
              onChange={(e) => setAnswer(q, e.target.value)}
            />
          )}
          {q.type === "SINGLE" && (
            <div className="space-y-2">
              {(q.options ?? []).map((opt) => (
                <label
                  key={opt.code}
                  className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition ${
                    value === opt.code
                      ? "border-primary-700 bg-primary-100"
                      : "border-neutral-300 hover:border-primary-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.code}
                    value={opt.code}
                    checked={value === opt.code}
                    onChange={() => setAnswer(q, opt.code)}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded-full border-2 ${value === opt.code ? "border-primary-700 bg-primary-700" : "border-neutral-400"}`}
                  />
                  <span className="text-body-sm">
                    {opt.label}
                    {opt.labelAm && (
                      <span lang="am" className="text-neutral-600 ml-1">
                        · {opt.labelAm}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
          {q.type === "MULTI" && (
            <div className="space-y-2">
              {(q.options ?? []).map((opt) => {
                const arr = Array.isArray(value) ? value : [];
                const checked = arr.includes(opt.code);
                return (
                  <label
                    key={opt.code}
                    className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition ${
                      checked
                        ? "border-primary-700 bg-primary-100"
                        : "border-neutral-300 hover:border-primary-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setAnswer(
                          q,
                          e.target.checked
                            ? [...arr, opt.code]
                            : arr.filter((x: string) => x !== opt.code),
                        )
                      }
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded border-2 ${checked ? "border-primary-700 bg-primary-700" : "border-neutral-400"}`}
                    />
                    <span className="text-body-sm">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          )}
          {q.type === "GPS" && (
            <div className="space-y-2">
              <Button
                variant="secondary"
                leftIcon={<MapPin className="h-4 w-4" />}
                onClick={() => captureGpsForQuestion(q)}
              >
                Capture current location
              </Button>
              {value && (
                <div className="text-caption text-green-700 font-semibold">
                  ✓ {value.lat?.toFixed(5)}, {value.lon?.toFixed(5)}
                </div>
              )}
            </div>
          )}
          {q.type === "PHOTO" && (
            <div className="space-y-2">
              <Button
                variant="secondary"
                leftIcon={<Camera className="h-4 w-4" />}
                onClick={() => capturePhoto(q)}
              >
                Take photo
              </Button>
              {photoData[q.questionId] && (
                <img
                  src={photoData[q.questionId]}
                  alt="Captured"
                  className="max-h-48 rounded-md border border-neutral-300"
                />
              )}
            </div>
          )}
          {q.type === "CALCULATED" && (
            <div className="text-body-sm bg-neutral-100 rounded-md p-3">
              Calculated: <strong>{value ?? "—"}</strong>
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="text-danger text-body-sm mt-3">
            {error}
          </div>
        )}
      </main>

      {/* Nav */}
      <footer className="bg-white border-t border-neutral-300 p-3 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={currentIndex === 0}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={next}
            fullWidth
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            {currentIndex === visibleQuestions.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
        <div className="max-w-2xl mx-auto mt-1 text-center text-caption text-neutral-500">
          <Clock className="h-3 w-3 inline" aria-hidden /> Autosaves every 20 s
          · {online ? "Online" : "Offline"}
        </div>
      </footer>
    </div>
  );
}