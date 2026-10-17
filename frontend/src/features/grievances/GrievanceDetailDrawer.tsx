import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Drawer } from "@/components/ui/Drawer";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import {
  useAssignGrievance,
  useResolveGrievance,
  useEscalateGrievance,
} from "./grievance.mutations";
import { useGrievanceActions } from "./grievance.queries";
import {
  statusTone,
  statusKey,
  categoryTone,
  categoryKey,
  severityTone,
  slaDaysRemaining,
  slaTone,
} from "./grievance.utils";
import { formatDate } from "@/lib/utils/date";
import type { Grievance } from "./grievance.types";

const OFFICERS = [
  { value: "00000000-0000-0000-0000-000000000101", label: "Meron Haile · QA" },
  {
    value: "00000000-0000-0000-0000-000000000102",
    label: "Selam Bekele · Woreda",
  },
  { value: "00000000-0000-0000-0000-000000000103", label: "Tigist Alemu · IE" },
];

export function GrievanceDetailDrawer({
  grievance,
  open,
  onClose,
}: {
  grievance: Grievance | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { can } = usePermissions();

  if (!grievance)
    return (
      <Drawer open={false} onClose={onClose} title="" width="max-w-xl">
        <span />
      </Drawer>
    );

  const canAssign =
    can(PERMISSIONS.grievanceWrite) && grievance.status === "OPEN";
  const canResolve =
    can(PERMISSIONS.grievanceResolve) &&
    ["OPEN", "IN_PROGRESS", "ESCALATED"].includes(grievance.status);
  const canEscalate =
    can(PERMISSIONS.grievanceEscalate) &&
    !["CLOSED", "RESOLVED"].includes(grievance.status);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`${grievance.ticketNo}`}
      width="max-w-xl"
    >
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Chip tone={statusTone(grievance.status)}>
              {t(statusKey(grievance.status))}
            </Chip>
            <Chip tone={categoryTone(grievance.category)}>
              {t(categoryKey(grievance.category))}
            </Chip>
            <Chip tone={severityTone(grievance.severity)}>
              {grievance.severity}
            </Chip>
            <Chip tone={slaTone(slaDaysRemaining(grievance.slaDue))}>
              SLA {formatDate(grievance.slaDue)}
            </Chip>
          </div>
          <p className="text-body-sm text-neutral-900 whitespace-pre-wrap mt-2">
            {grievance.description}
          </p>
          <div className="text-caption text-neutral-600 mt-3 grid grid-cols-2 gap-1">
            <span>Submitted: {formatDate(grievance.submittedAt)}</span>
            <span>Channel: {grievance.channel}</span>
            {grievance.assignedToName && (
              <span>Assigned to: {grievance.assignedToName}</span>
            )}
            {grievance.escalatedToName && (
              <span>Escalated to: {grievance.escalatedToName}</span>
            )}
            {grievance.location?.region && (
              <span>Region: {grievance.location.region}</span>
            )}
          </div>
        </div>

        {canAssign && <AssignPanel grievanceId={grievance.grievanceId} />}
        {canResolve && <ResolvePanel grievanceId={grievance.grievanceId} />}
        {canEscalate && <EscalatePanel grievanceId={grievance.grievanceId} />}

        <HistoryPanel grievanceId={grievance.grievanceId} />
      </div>
    </Drawer>
  );
}

function AssignPanel({ grievanceId }: { grievanceId: string }) {
  const { t } = useTranslation();
  const assign = useAssignGrievance(grievanceId);
  const [assignedTo, setAssignedTo] = useState(OFFICERS[0]!.value);
  const [notes, setNotes] = useState("");

  return (
    <Card>
      <CardHeader title={t("grievance.actions.assign")} />
      <div className="space-y-2">
        <div className="text-caption text-neutral-600">Assign to</div>
        <select
          className="w-full h-9 rounded-md border border-neutral-300 px-2 text-body-sm"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          {OFFICERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Textarea
          label="Notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button
          variant="primary"
          size="sm"
          loading={assign.isPending}
          onClick={() => assign.mutate({ assignedTo, notes })}
        >
          {t("grievance.actions.assignCta")}
        </Button>
      </div>
    </Card>
  );
}

function ResolvePanel({ grievanceId }: { grievanceId: string }) {
  const { t } = useTranslation();
  const resolve = useResolveGrievance(grievanceId);
  const [resolution, setResolution] = useState("");

  return (
    <Card>
      <CardHeader title={t("grievance.actions.resolve")} />
      <div className="space-y-2">
        <Textarea
          label={t("grievance.actions.resolution")}
          rows={3}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          required
        />
        <Button
          variant="primary"
          size="sm"
          loading={resolve.isPending}
          disabled={resolution.trim().length < 20}
          onClick={() => resolve.mutate({ resolution })}
        >
          {t("grievance.actions.resolveCta")}
        </Button>
      </div>
    </Card>
  );
}

function EscalatePanel({ grievanceId }: { grievanceId: string }) {
  const { t } = useTranslation();
  const escalate = useEscalateGrievance(grievanceId);
  const [escalatedTo, setEscalatedTo] = useState(OFFICERS[0]!.value);
  const [reason, setReason] = useState("");

  return (
    <Card>
      <CardHeader title={t("grievance.actions.escalate")} />
      <div className="space-y-2">
        <select
          className="w-full h-9 rounded-md border border-neutral-300 px-2 text-body-sm"
          value={escalatedTo}
          onChange={(e) => setEscalatedTo(e.target.value)}
        >
          {OFFICERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Textarea
          label="Reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <Button
          variant="danger"
          size="sm"
          loading={escalate.isPending}
          disabled={reason.trim().length < 10}
          onClick={() => escalate.mutate({ escalatedTo, reason })}
        >
          {t("grievance.actions.escalateCta")}
        </Button>
      </div>
    </Card>
  );
}

function HistoryPanel({ grievanceId }: { grievanceId: string }) {
  const { t } = useTranslation();
  const { data } = useGrievanceActions(grievanceId);
  return (
    <Card>
      <CardHeader title={t("grievance.actions.history")} />
      {!data?.length ? (
        <p className="text-caption text-neutral-600">
          {t("grievance.actions.noHistory")}
        </p>
      ) : (
        <ol className="space-y-3 relative border-l-2 border-neutral-200 ml-2">
          {data.map((a) => (
            <li key={a.actionId} className="ml-4">
              <span
                aria-hidden
                className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-primary-700"
              />
              <div className="text-caption text-neutral-600">
                <strong>{a.actorName}</strong> · {a.actionType} ·{" "}
                {formatDate(a.createdAt)}
              </div>
              {a.notes && <p className="text-body-sm mt-1">{a.notes}</p>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}