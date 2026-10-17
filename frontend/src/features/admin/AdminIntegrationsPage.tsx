import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { useIntegrations, useIntegrationRuns } from "./admin.queries";
import { useTriggerIntegrationSync } from "./admin.mutations";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatDate } from "@/lib/utils/date";
import type { IntegrationCode } from "./admin.types";

const STATUS_TONE = {
  HEALTHY: "green",
  DEGRADED: "amber",
  DOWN: "red",
} as const;

export default function AdminIntegrationsPage() {
  const { t } = useTranslation();
  const { data: integrations, isLoading } = useIntegrations();
  const [selected, setSelected] = useState<IntegrationCode | undefined>(
    integrations?.[0]?.code,
  );
  const { data: runs } = useIntegrationRuns(selected);
  const trigger = useTriggerIntegrationSync();

  if (isLoading) return <LoadingState />;

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header>
        <h1 className="text-h1 text-primary-900">
          {t("admin.integrations.title")}
        </h1>
        <p className="text-body-sm text-neutral-600 mt-1">
          {t("admin.integrations.subtitle")}
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(integrations ?? []).map((int) => (
          <Card
            key={int.code}
            hoverable
            onClick={() => setSelected(int.code)}
            className={selected === int.code ? "ring-2 ring-primary-700" : ""}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="text-body-sm font-bold text-primary-900">
                  {int.code}
                </div>
                <div className="text-caption text-neutral-600 truncate">
                  {int.name}
                </div>
              </div>
              <Chip tone={STATUS_TONE[int.status]}>{int.status}</Chip>
            </div>
            <div className="text-caption text-neutral-600 space-y-0.5">
              {int.lastSync && <div>Last sync: {formatDate(int.lastSync)}</div>}
              <div>{int.recordsProcessed24h.toLocaleString()} records/24h</div>
              {int.errorCount24h > 0 && (
                <div className="text-danger font-semibold">
                  {int.errorCount24h} errors/24h
                </div>
              )}
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                fullWidth
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                loading={trigger.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  trigger.mutate(int.code);
                }}
              >
                Sync now
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selected && (
        <Card>
          <CardHeader title={`${selected} · Recent sync runs`} />
          {!runs?.length ? (
            <p className="text-body-sm text-neutral-600">
              No sync runs recorded.
            </p>
          ) : (
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left">
                  <th className="py-2 text-caption uppercase text-neutral-600">
                    Started
                  </th>
                  <th className="py-2 text-caption uppercase text-neutral-600">
                    Kind
                  </th>
                  <th className="py-2 text-right text-caption uppercase text-neutral-600">
                    Duration
                  </th>
                  <th className="py-2 text-right text-caption uppercase text-neutral-600">
                    Records
                  </th>
                  <th className="py-2 text-right text-caption uppercase text-neutral-600">
                    Errors
                  </th>
                  <th className="py-2 text-caption uppercase text-neutral-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.runId} className="border-b border-neutral-100">
                    <td className="py-2 text-caption">
                      {new Date(r.startedAt).toLocaleString()}
                    </td>
                    <td className="py-2">{r.kind}</td>
                    <td className="py-2 text-right">
                      {r.durationMs
                        ? `${(r.durationMs / 1000).toFixed(1)} s`
                        : "—"}
                    </td>
                    <td className="py-2 text-right">{r.recordsProcessed}</td>
                    <td className="py-2 text-right">{r.recordsFailed}</td>
                    <td className="py-2">
                      <Chip
                        tone={
                          r.status === "SUCCESS"
                            ? "green"
                            : r.status === "FAILED"
                              ? "red"
                              : r.status === "PARTIAL"
                                ? "amber"
                                : "blue"
                        }
                      >
                        {r.status}
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </main>
  );
}