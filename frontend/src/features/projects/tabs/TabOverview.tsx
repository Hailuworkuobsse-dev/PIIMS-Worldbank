import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { TrafficLight } from "@/components/ui/TrafficLight";
import type { Project } from "../project.types";

export function TabOverview({ project }: { project: Project }) {
  const { t } = useTranslation();
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader title="Description" />
        <p className="text-body-sm text-neutral-600">
          {project.description || "—"}
        </p>
      </Card>

      <Card>
        <CardHeader title="Key facts" />
        <dl className="text-body-sm space-y-1.5">
          <Row
            label={t("projects.detail.fields.sector")}
            value={project.sector}
          />
          <Row
            label={t("projects.detail.fields.subsector")}
            value={project.subsector ?? "—"}
          />
          <Row
            label={t("projects.detail.fields.arrangement")}
            value={project.implementationArrangement ?? "—"}
          />
          <Row
            label={t("projects.detail.fields.created")}
            value={project.createdAt.slice(0, 10)}
          />
          <Row
            label={t("projects.detail.fields.updated")}
            value={project.updatedAt.slice(0, 10)}
          />
        </dl>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader title="Location" />
        <dl className="text-body-sm grid grid-cols-2 md:grid-cols-4 gap-2">
          <Row
            label={t("projects.detail.fields.region")}
            value={project.location?.region ?? "—"}
          />
          <Row
            label={t("projects.detail.fields.zone")}
            value={project.location?.zone ?? "—"}
          />
          <Row
            label={t("projects.detail.fields.woreda")}
            value={project.location?.woreda ?? "—"}
          />
          <Row
            label={t("projects.detail.fields.kebele")}
            value={project.location?.kebele ?? "—"}
          />
        </dl>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader title="Indicator health" />
        <div className="flex flex-wrap gap-4">
          <TrafficLight status="ON_TRACK" percent={72} />
          <TrafficLight status="AT_RISK" percent={55} />
          <TrafficLight status="OFF_TRACK" percent={32} />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="font-semibold text-neutral-900 text-right truncate">
        {value}
      </dd>
    </div>
  );
}