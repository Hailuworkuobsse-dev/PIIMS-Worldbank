import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlayCircle, WifiOff } from "lucide-react";
import {
  useAssignments,
  useSurveyView,
  useCollectorProfile,
} from "./field.queries";
import { useSyncStore } from "@/stores/sync.store";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Progress } from "@/components/ui/Progress";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { CapiRenderer } from "./CapiRenderer";
import { SyncQueue } from "./SyncQueue";
import type { Assignment } from "./field.types";

export default function FieldOpsPage() {
  const { t } = useTranslation();
  const online = useSyncStore((s) => s.online);
  const { data: profile } = useCollectorProfile();
  const { data: assignments, isLoading } = useAssignments();
  const [active, setActive] = useState<Assignment | null>(null);

  const { data: surveyView } = useSurveyView(active?.assignmentId);

  if (active && surveyView && profile) {
    return (
      <CapiRenderer
        assignment={active}
        surveyView={surveyView}
        collectorId={profile.collectorId}
        deviceId={profile.deviceId}
        onExit={() => setActive(null)}
      />
    );
  }

  if (isLoading) return <LoadingState />;

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("field.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {profile?.fullName} · {profile?.region}
            {profile?.woreda ? ` / ${profile.woreda}` : ""}
          </p>
        </div>
        <Chip tone={online ? "green" : "amber"}>
          {online ? (
            "Online"
          ) : (
            <>
              <WifiOff className="h-3 w-3" aria-hidden /> Offline
            </>
          )}
        </Chip>
      </header>

      <SyncQueue />

      {!assignments?.length ? (
        <EmptyState
          title={t("field.empty")}
          description={t("field.emptyHint")}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {assignments.map((a) => {
            const pct =
              a.targetCount > 0 ? (a.completedCount / a.targetCount) * 100 : 0;
            return (
              <Card key={a.assignmentId}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="text-caption text-neutral-600">
                      {a.waveCode}
                    </div>
                    <div className="text-h3 text-primary-900">{a.waveName}</div>
                  </div>
                  <Chip
                    tone={
                      a.status === "COMPLETED"
                        ? "green"
                        : a.status === "IN_PROGRESS"
                          ? "blue"
                          : "grey"
                    }
                  >
                    {a.status}
                  </Chip>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-caption text-neutral-600 mb-1">
                    <span>Progress</span>
                    <span>
                      {a.completedCount} / {a.targetCount}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    tone={
                      pct >= 90 ? "success" : pct >= 50 ? "warning" : "danger"
                    }
                  />
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<PlayCircle className="h-4 w-4" />}
                  onClick={() => setActive(a)}
                  disabled={
                    a.status === "COMPLETED" || a.status === "CANCELLED"
                  }
                >
                  Start interview
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}