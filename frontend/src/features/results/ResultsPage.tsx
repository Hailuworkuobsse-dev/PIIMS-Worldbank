import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Download } from "lucide-react";
import { useComponents, useIndicators } from "./results.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ComponentTree } from "./ComponentTree";
import { IndicatorRegister } from "./IndicatorRegister";
import { TrafficLightDashboard } from "./TrafficLightDashboard";
import { AggregationView } from "./AggregationView";
import { LogframeExport } from "./LogframeExport";
import { resultsApi } from "./results.api";
import { useToast } from "@/components/ui/Toast";

export default function ResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { push } = useToast();
  const [params] = useSearchParams();

  // In production, projectId comes from route or a project selector.
  const projectId = params.get("projectId") ?? "PIIMS-2026-0042";

  const { data: components, refetch } = useComponents(projectId);
  const { data: indicators, isLoading } = useIndicators({ projectId });

  const [selectedComponentId, setSelectedComponentId] = useState<
    string | undefined
  >();

  const exportLogframe = async () => {
    try {
      const blob = await resultsApi.exportLogframe(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logframe-${projectId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      push("success", "Logframe exported");
    } catch {
      push("error", "Export failed");
    }
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("results.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {indicators?.length ?? 0} indicators · {components?.length ?? 0}{" "}
            components
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={exportLogframe}
          >
            Export logframe
          </Button>
          {can(PERMISSIONS.resultWrite) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() =>
                navigate(`/results/new-indicator?projectId=${projectId}`)
              }
            >
              Add indicator
            </Button>
          )}
        </div>
      </header>

      <Tabs
        tabs={[
          {
            id: "register",
            label: "Indicator register",
            content: (
              <IndicatorRegister
                indicators={indicators ?? []}
                loading={isLoading}
                selectedComponentId={selectedComponentId}
              />
            ),
          },
          {
            id: "components",
            label: "Components",
            content: (
              <div className="grid md:grid-cols-[320px_1fr] gap-4">
                <Card padding="none">
                  <ComponentTree
                    projectId={projectId}
                    components={components ?? []}
                    onSelect={(id) => setSelectedComponentId(id)}
                    selectedId={selectedComponentId}
                    onChanged={() => refetch()}
                  />
                </Card>
                <Card>
                  <p className="text-body-sm text-neutral-600">
                    Select a component to see subcomponents and indicators.
                  </p>
                </Card>
              </div>
            ),
          },
          {
            id: "dashboard",
            label: "Traffic-light dashboard",
            content: <TrafficLightDashboard indicators={indicators ?? []} />,
          },
          {
            id: "aggregation",
            label: "Aggregation",
            content: <AggregationView projectId={projectId} />,
          },
          {
            id: "logframe",
            label: "Logframe export",
            content: <LogframeExport projectId={projectId} />,
          },
        ]}
      />
    </main>
  );
}