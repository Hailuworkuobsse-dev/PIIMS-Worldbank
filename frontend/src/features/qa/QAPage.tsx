import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQAFlags, useScorecards, useQAStats } from "./qa.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardHeader } from "@/components/ui/Card";
import { KPITile } from "@/components/ui/KPITile";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Drawer } from "@/components/ui/Drawer";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { useReviewFlag } from "./qa.mutations";
import { QA_SEVERITIES, type QAFlag, type QASeverity } from "./qa.types";
import { formatDate } from "@/lib/utils/date";

const SEVERITY_TONE: Record<QASeverity, any> = {
  LOW: "grey",
  MEDIUM: "amber",
  HIGH: "red",
  CRITICAL: "red",
};

export default function QAPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [severity, setSeverity] = useState<QASeverity | "ALL">("ALL");
  const [selected, setSelected] = useState<QAFlag | null>(null);
  const [notes, setNotes] = useState("");

  const { data: stats } = useQAStats();
  const { data: flags, isLoading } = useQAFlags({
    severity: severity === "ALL" ? undefined : [severity],
    status: ["OPEN", "IN_REVIEW"] as any,
    limit: 100,
  });
  const { data: scorecards } = useScorecards();
  const reviewMutation = useReviewFlag();

  const handleReview = async (decision: "ACCEPT" | "REJECT" | "BACK_CHECK") => {
    if (!selected) return;
    await reviewMutation.mutateAsync({
      flagId: selected.flagId,
      decision,
      notes,
    });
    setSelected(null);
    setNotes("");
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header>
        <h1 className="text-h1 text-primary-900">{t("qa.title")}</h1>
        <p className="text-body-sm text-neutral-600 mt-1">{t("qa.subtitle")}</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile label="Total flags" value={String(stats?.total ?? 0)} />
        <KPITile label="Open" value={String(stats?.open ?? 0)} tone="warning" />
        <KPITile
          label="Resolved"
          value={String(stats?.resolved ?? 0)}
          tone="success"
        />
        <KPITile
          label="Critical"
          value={String(stats?.bySeverity?.CRITICAL ?? 0)}
          tone="danger"
        />
      </div>

      <Tabs
        tabs={[
          {
            id: "flags",
            label: t("qa.tabs.flags"),
            content: (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSeverity("ALL")}
                    aria-pressed={severity === "ALL"}
                  >
                    <Chip tone={severity === "ALL" ? "blue" : "grey"}>
                      All severities
                    </Chip>
                  </button>
                  {QA_SEVERITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      aria-pressed={severity === s}
                    >
                      <Chip tone={severity === s ? SEVERITY_TONE[s] : "grey"}>
                        {s}
                      </Chip>
                    </button>
                  ))}
                </div>

                {isLoading && <LoadingState />}
                {!isLoading && !flags?.data.length && (
                  <EmptyState
                    title={t("qa.empty")}
                    description="All flags reviewed. Great work!"
                  />
                )}
                {!isLoading && flags?.data.length ? (
                  <Card padding="none">
                    <ul className="divide-y divide-neutral-100">
                      {flags.data.map((f) => (
                        <li key={f.flagId}>
                          <button
                            type="button"
                            onClick={() => setSelected(f)}
                            className="w-full text-left px-4 py-3 hover:bg-neutral-50"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Chip tone={SEVERITY_TONE[f.severity]}>
                                    {f.severity}
                                  </Chip>
                                  <span className="text-body-sm font-semibold">
                                    {f.ruleName}
                                  </span>
                                </div>
                                <div className="text-caption text-neutral-600">
                                  Submission{" "}
                                  <code>{f.submissionId.slice(0, 8)}…</code> ·
                                  Collector {f.collectorName}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <Chip
                                  tone={f.status === "OPEN" ? "amber" : "blue"}
                                >
                                  {f.status}
                                </Chip>
                                <div className="text-caption text-neutral-500 mt-1">
                                  {formatDate(f.createdAt)}
                                </div>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : null}
              </div>
            ),
          },
          {
            id: "scorecards",
            label: t("qa.tabs.scorecards"),
            content: (
              <Card>
                <CardHeader title="Collector scorecards" />
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="border-b border-neutral-300 text-left">
                      <th className="py-2 text-caption uppercase text-neutral-600">
                        Collector
                      </th>
                      <th className="py-2 text-right text-caption uppercase text-neutral-600">
                        Submissions
                      </th>
                      <th className="py-2 text-right text-caption uppercase text-neutral-600">
                        Flags
                      </th>
                      <th className="py-2 text-right text-caption uppercase text-neutral-600">
                        Pass rate
                      </th>
                      <th className="py-2 text-caption uppercase text-neutral-600">
                        Composite
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(scorecards ?? []).map((s) => (
                      <tr
                        key={s.collectorId}
                        className="border-b border-neutral-100"
                      >
                        <td className="py-2 font-semibold">
                          {s.collectorName}
                        </td>
                        <td className="py-2 text-right">
                          {s.submissionsCount}
                        </td>
                        <td className="py-2 text-right text-amber-700 font-bold">
                          {s.flaggedCount}
                        </td>
                        <td className="py-2 text-right">
                          {s.backcheckPassRate
                            ? `${s.backcheckPassRate.toFixed(0)}%`
                            : "—"}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-24">
                              <Progress
                                value={s.compositeScore}
                                tone={
                                  s.compositeScore >= 85
                                    ? "success"
                                    : s.compositeScore >= 65
                                      ? "warning"
                                      : "danger"
                                }
                              />
                            </div>
                            <span className="text-caption font-bold">
                              {s.compositeScore.toFixed(0)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ),
          },
          {
            id: "hfc",
            label: t("qa.tabs.hfc"),
            content: <HFCDashboard stats={stats} />,
          },
        ]}
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.ruleName ?? ""}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Chip tone={SEVERITY_TONE[selected.severity]}>
                {selected.severity}
              </Chip>
              <Chip tone="grey">{selected.ruleCode}</Chip>
            </div>
            <div className="text-body-sm">
              <div className="text-neutral-600">Submission</div>
              <code className="text-primary-700 font-bold">
                {selected.submissionId}
              </code>
            </div>
            <div>
              <div className="text-caption font-semibold text-neutral-600 mb-1">
                Details
              </div>
              <pre className="bg-neutral-100 rounded-md p-3 text-caption overflow-x-auto">
                {JSON.stringify(selected.details, null, 2)}
              </pre>
            </div>
            {can(PERMISSIONS.qaReview) && (
              <>
                <div>
                  <label className="block text-caption font-semibold text-primary-900 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="w-full rounded-md border border-neutral-300 p-2 text-body-sm"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={reviewMutation.isPending}
                    onClick={() => handleReview("ACCEPT")}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={reviewMutation.isPending}
                    onClick={() => handleReview("REJECT")}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={reviewMutation.isPending}
                    onClick={() => handleReview("BACK_CHECK")}
                  >
                    Back-check
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>
    </main>
  );
}

function HFCDashboard({ stats }: { stats?: any }) {
  if (!stats) return <LoadingState />;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader title="Flag distribution by rule" />
        <ul className="space-y-2">
          {(stats.byRule ?? []).map((r: any) => (
            <li
              key={r.ruleType}
              className="flex items-center justify-between text-body-sm"
            >
              <span className="text-neutral-600">{r.ruleType}</span>
              <span className="font-bold">{r.count}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="By severity" />
        <ul className="space-y-2">
          {QA_SEVERITIES.map((s) => (
            <li
              key={s}
              className="flex items-center justify-between text-body-sm"
            >
              <Chip tone={SEVERITY_TONE[s]}>{s}</Chip>
              <span className="font-bold">{stats.bySeverity?.[s] ?? 0}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}