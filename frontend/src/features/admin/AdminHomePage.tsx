import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  Plug,
  ShieldCheck,
  Activity,
  Database,
  Server,
} from "lucide-react";
import { useSystemHealth, useIntegrations } from "./admin.queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { KPITile } from "@/components/ui/KPITile";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Progress } from "@/components/ui/Progress";
import { LoadingState } from "@/components/ui/LoadingState";

export default function AdminHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const { data: integrations } = useIntegrations();

  if (healthLoading || !health)
    return <LoadingState message="Loading system health…" />;

  const statusTone = (s: "HEALTHY" | "DEGRADED" | "DOWN") =>
    s === "HEALTHY" ? "green" : s === "DEGRADED" ? "amber" : "red";

  const healthyCount = (integrations ?? []).filter(
    (i) => i.status === "HEALTHY",
  ).length;
  const degradedCount = (integrations ?? []).filter(
    (i) => i.status === "DEGRADED",
  ).length;
  const downCount = (integrations ?? []).filter(
    (i) => i.status === "DOWN",
  ).length;

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("admin.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {t("admin.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Users className="h-4 w-4" />}
            onClick={() => navigate("/admin/users")}
          >
            {t("admin.manageUsers")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plug className="h-4 w-4" />}
            onClick={() => navigate("/admin/integrations")}
          >
            {t("admin.manageIntegrations")}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile
          label="API uptime (30d)"
          value={`${health.api.uptime30d.toFixed(2)}%`}
          tone={health.api.uptime30d >= 99.5 ? "success" : "warning"}
        />
        <KPITile
          label="Active users (24h)"
          value={health.activeUsers24h.toLocaleString()}
          tone="accent"
        />
        <KPITile
          label="API calls (24h)"
          value={health.apiCalls24h.toLocaleString()}
        />
        <KPITile
          label="Integrations healthy"
          value={`${healthyCount}/${integrations?.length ?? 0}`}
          tone={
            downCount > 0 ? "danger" : degradedCount > 0 ? "warning" : "success"
          }
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Server className="h-4 w-4" aria-hidden /> API
              </span>
            }
          />
          <div className="space-y-2">
            <div className="flex justify-between text-body-sm">
              <span className="text-neutral-600">Status</span>
              <Chip tone={statusTone(health.api.status)}>
                {health.api.status}
              </Chip>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-neutral-600">p95 latency</span>
              <span className="font-semibold">
                {health.api.p95LatencyMs} ms
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Database className="h-4 w-4" aria-hidden /> Database
              </span>
            }
          />
          <div className="space-y-2">
            <div className="flex justify-between text-body-sm">
              <span className="text-neutral-600">Status</span>
              <Chip tone={statusTone(health.database.status)}>
                {health.database.status}
              </Chip>
            </div>
            <div className="text-body-sm">
              <div className="flex justify-between mb-1">
                <span className="text-neutral-600">Connections</span>
                <span className="font-semibold">
                  {health.database.connections}/{health.database.maxConnections}
                </span>
              </div>
              <Progress
                value={
                  (health.database.connections /
                    health.database.maxConnections) *
                  100
                }
                tone={
                  health.database.connections / health.database.maxConnections >
                  0.8
                    ? "danger"
                    : "success"
                }
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Activity className="h-4 w-4" aria-hidden /> Storage & Queue
              </span>
            }
          />
          <div className="space-y-2 text-body-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-600">Storage</span>
                <span className="font-semibold">
                  {health.storage.usedGb} / {health.storage.totalGb} GB
                </span>
              </div>
              <Progress
                value={(health.storage.usedGb / health.storage.totalGb) * 100}
                tone={
                  health.storage.usedGb / health.storage.totalGb > 0.85
                    ? "warning"
                    : "primary"
                }
              />
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Queue depth</span>
              <span className="font-semibold">{health.queue.depth}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Plug className="h-4 w-4" aria-hidden /> Integrations
            </span>
          }
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/admin/integrations")}
            >
              Manage →
            </Button>
          }
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(integrations ?? []).map((int) => (
            <div
              key={int.code}
              className="flex items-center justify-between gap-2 p-2 border border-neutral-200 rounded-md"
            >
              <div className="min-w-0">
                <div className="text-body-sm font-semibold">{int.code}</div>
                <div className="text-caption text-neutral-600 truncate">
                  {int.name}
                </div>
              </div>
              <Chip tone={statusTone(int.status)}>{int.status}</Chip>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden /> Governance
            </span>
          }
        />
        <div className="grid sm:grid-cols-2 gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate("/audit")}
          >
            {t("admin.openAuditLog")}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate("/admin/users")}
          >
            {t("admin.manageUsers")}
          </Button>
        </div>
      </Card>
    </main>
  );
}