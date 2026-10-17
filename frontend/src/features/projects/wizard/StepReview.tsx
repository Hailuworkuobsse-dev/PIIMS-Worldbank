import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardHeader } from "@/components/ui/Card";
import { sectorLabelKey } from "../project.utils";
import { formatMoney } from "@/lib/utils/currency";

export interface StepReviewProps {
  data: any;
  onAcknowledgeChange: (v: boolean) => void;
  formId: string;
  onAcknowledgeSubmit: () => void;
}

export function StepReview({
  data,
  onAcknowledgeChange,
  formId,
  onAcknowledgeSubmit,
}: StepReviewProps) {
  const { t } = useTranslation();
  const [ack, setAck] = useState(false);

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        if (ack) onAcknowledgeSubmit();
      }}
      className="space-y-4"
      noValidate
    >
      <h2 data-step-heading tabIndex={-1} className="text-h2 text-primary-900">
        {t("projects.wizard.review.title")}
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Identification" />
          <dl className="text-body-sm space-y-1.5">
            <Row label={t("projects.wizard.fields.name")} value={data.name} />
            {data.nameAm && (
              <Row
                label={t("projects.wizard.fields.nameAm")}
                value={data.nameAm}
              />
            )}
            {data.subsector && (
              <Row
                label={t("projects.wizard.fields.subsector")}
                value={data.subsector}
              />
            )}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Classification" />
          <dl className="text-body-sm space-y-1.5">
            <Row
              label={t("projects.wizard.fields.sector")}
              value={t(sectorLabelKey(data.sector))}
            />
            <Row
              label={t("projects.wizard.fields.ownerOrgId")}
              value={data.ownerOrgId}
            />
            <Row
              label={t("projects.wizard.fields.implementationArrangement")}
              value={data.implementationArrangement}
            />
            {data.wbCreditNo && (
              <Row
                label={t("projects.wizard.fields.wbCreditNo")}
                value={data.wbCreditNo}
              />
            )}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Location" />
          <dl className="text-body-sm space-y-1.5">
            <Row
              label={t("projects.wizard.fields.region")}
              value={data.region}
            />
            {data.zone && (
              <Row label={t("projects.wizard.fields.zone")} value={data.zone} />
            )}
            {data.woreda && (
              <Row
                label={t("projects.wizard.fields.woreda")}
                value={data.woreda}
              />
            )}
            {data.kebele && (
              <Row
                label={t("projects.wizard.fields.kebele")}
                value={data.kebele}
              />
            )}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Budget & financing" />
          <dl className="text-body-sm space-y-1.5">
            <Row
              label={t("projects.wizard.fields.totalBudget")}
              value={formatMoney(
                data.totalBudget?.amount,
                data.totalBudget?.currency,
              )}
            />
            {data.startDate && (
              <Row
                label={t("projects.wizard.fields.startDate")}
                value={data.startDate}
              />
            )}
            {data.endDate && (
              <Row
                label={t("projects.wizard.fields.endDate")}
                value={data.endDate}
              />
            )}
          </dl>
          <ul className="mt-2 text-caption text-neutral-600 space-y-0.5">
            {(data.financingSource ?? []).map((l: any, i: number) => (
              <li key={i}>
                {l.source}: {formatMoney(l.amount, l.currency)}{" "}
                {l.referenceNo ? `(${l.referenceNo})` : ""}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Checkbox
        label={t("projects.wizard.review.acknowledge")}
        checked={ack}
        onChange={(e) => {
          setAck(e.target.checked);
          onAcknowledgeChange(e.target.checked);
        }}
      />
    </form>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="font-semibold text-neutral-900 text-right truncate">
        {value ?? "—"}
      </dd>
    </div>
  );
}