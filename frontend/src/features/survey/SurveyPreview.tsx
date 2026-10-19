import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { computeVisibility } from "./skipLogic";
import type { Survey } from "./survey.types";

export function SurveyPreview({ survey }: { survey: Survey }) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const allQuestions = survey.sections.flatMap((s) => s.questions);
  const { visible } = computeVisibility(allQuestions, answers);

  return (
    <Card>
      <CardHeader
        title="Interactive preview"
        subtitle="Fill answers to see skip logic in action"
      />
      <div className="space-y-4">
        {survey.sections.map((section) => {
          const visibleQs = section.questions.filter((q) =>
            visible.has(q.questionId),
          );
          if (visibleQs.length === 0) return null;
          return (
            <div key={section.sectionId}>
              <h3 className="text-body-sm font-bold text-primary-900 mb-2">
                {section.title}
              </h3>
              <div className="space-y-3">
                {visibleQs.map((q) => (
                  <div key={q.questionId}>
                    <div className="block text-caption font-semibold text-neutral-900 mb-1">
                      <code className="text-primary-700 mr-1">{q.code}</code>
                      {q.text}
                      {q.required && (
                        <span className="text-danger ml-0.5">*</span>
                      )}
                    </div>
                    {q.type === "TEXT" ||
                    q.type === "NUMERIC" ||
                    q.type === "DECIMAL" ? (
                      <Input
                        label={q.text}
                        value={String(answers[q.code] ?? "")
                        onChange={(e) =>
                          setAnswers({ ...answers, [q.code]: e.target.value })
                        }
                      />
                    ) : q.type === "DATE" ? (
                      <Input
                        label={q.text}
                        type="date"
                        value={String(answers[q.code] ?? "")}
                        onChange={(e) =>
                          setAnswers({ ...answers, [q.code]: e.target.value })
                        }
                      />
                    ) : q.type === "SINGLE" ? (
                      <div className="space-y-1">
                        {(q.options ?? []).map((opt) => (
                          <label
                            key={opt.code}
                            className="flex items-center gap-2 text-caption"
                          >
                            <input
                              type="radio"
                              name={q.code}
                              value={opt.code}
                              onChange={() =>
                                setAnswers({ ...answers, [q.code]: opt.code })
                              }
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    ) : q.type === "MULTI" ? (
                      <div className="space-y-1">
                        {(q.options ?? []).map((opt) => (
                          <label
                            key={opt.code}
                            className="flex items-center gap-2 text-caption"
                          >
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                const cur = Array.isArray(answers[q.code])
                                  ? answers[q.code]
                                  : [];
                                setAnswers({
                                  ...answers,
                                  [q.code]: e.target.checked
                                    ? [...cur, opt.code]
                                    : cur.filter((x: string) => x !== opt.code),
                                });
                              }}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Input label={q.text} disabled placeholder={q.type} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-neutral-200">
        <Button variant="ghost" size="sm" onClick={() => setAnswers({})}>
          Reset answers
        </Button>
      </div>
    </Card>
  );
}