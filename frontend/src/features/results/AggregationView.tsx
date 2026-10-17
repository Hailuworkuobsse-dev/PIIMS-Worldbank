import { useState } from "react";
import { useAggregation } from "./results.queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Progress } from "@/components/ui/Progress";
import { Tabs } from "@/components/ui/Tabs";
import type { AggregationRow } from "./results.types";

export function AggregationView({ projectId }: { projectId: string }) {
  const [groupBy, setGroupBy] = useState<"component" | "region" | "gender">(
    "component",
  );

  return (
    <Tabs
      tabs={[
        {
          id: "component",
          label: "By component",
          content: <AggTable projectId={projectId} groupBy="component" />,
        },
        {
          id: "region",
          label: "By region",
          content: <AggTable projectId={projectId} groupBy="region" />,
        },
        {
          id: "gender",
          label: "By gender",
          content: <AggTable projectId={projectId} groupBy="gender" />,
        },
      ]}
      onChange={(id) => setGroupBy(id as any)}
      defaultTab={groupBy}
    />
  );
}

function AggTable({
  projectId,
  groupBy,
}: {
  projectId: string;
  groupBy: "component" | "region" | "gender";
}) {
  const { data, isLoading } = useAggregation(projectId, groupBy);
  if (isLoading) return <LoadingState />;

  const columns: Column<AggregationRow & { id: string }>[] = [
    {
      id: "label",
      header: "Group",
      render: (r) => <span className="font-semibold">{r.label}</span>,
    },
    { id: "indicatorCount", header: "Indicators", align: "right" },
    {
      id: "onTrack",
      header: "On-track",
      align: "right",
      render: (r) => (
        <span className="text-green-700 font-bold">{r.onTrack}</span>
      ),
    },
    {
      id: "atRisk",
      header: "At-risk",
      align: "right",
      render: (r) => (
        <span className="text-amber-700 font-bold">{r.atRisk}</span>
      ),
    },
    {
      id: "offTrack",
      header: "Off-track",
      align: "right",
      render: (r) => (
        <span className="text-red-700 font-bold">{r.offTrack}</span>
      ),
    },
    {
      id: "avgAchievement",
      header: "Avg achievement",
      render: (r) => (
        <div className="min-w-[140px]">
          <Progress
            value={r.avgAchievement}
            tone={
              r.avgAchievement >= 85
                ? "success"
                : r.avgAchievement >= 60
                  ? "warning"
                  : "danger"
            }
          />
          <div className="text-caption text-neutral-600 mt-0.5">
            {r.avgAchievement.toFixed(1)}%
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader title={`Aggregated by ${groupBy}`} />
      <DataGrid
        columns={columns}
        rows={(data ?? []).map((r) => ({ ...r, id: r.key }))}
        ariaLabel="Aggregation"
      />
    </Card>
  );
}