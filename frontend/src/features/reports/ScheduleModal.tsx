import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  scheduleReportSchema,
  type ScheduleReportFormData,
} from "./report.schema";
import { useCreateSchedule } from "./report.mutations";
import type { ReportType } from "./report.types";

const CRON_PRESETS = [
  { value: "0 8 1 * *", label: "Monthly · 1st at 08:00" },
  { value: "0 8 1 */3 *", label: "Quarterly · 1st of quarter at 08:00" },
  { value: "0 8 1 1,7 *", label: "Semi-annual · Jan & Jul" },
  { value: "0 8 1 1 *", label: "Annual · 1st of Jan" },
];

export function ScheduleModal({
  open,
  onClose,
  reportCode,
}: {
  open: boolean;
  onClose: () => void;
  reportCode: ReportType;
}) {
  const { t } = useTranslation();
  const create = useCreateSchedule();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ScheduleReportFormData>({
    resolver: zodResolver(scheduleReportSchema),
    defaultValues: {
      reportCode,
      cron: "0 8 1 */3 *",
      recipients: "",
      format: "PDF",
    },
  });

  const onSubmit = async (v: ScheduleReportFormData) => {
    await create.mutateAsync({
      reportCode: v.reportCode,
      cron: v.cron,
      recipients: v.recipients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      format: v.format,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Schedule ${reportCode}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            loading={create.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {t("reports.schedule.save")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <input type="hidden" {...register("reportCode")} />
        <Select
          {...register("cron")}
          label="Frequency"
          required
          options={CRON_PRESETS}
        />
        <Input
          {...register("recipients")}
          label="Recipients"
          placeholder="user1@example.gov.et, user2@example.gov.et"
          hint="Comma-separated list of email addresses"
          required
          error={errors.recipients?.message}
        />
        <Select
          {...register("format")}
          label="Format"
          required
          options={[
            { value: "PDF", label: "PDF" },
            { value: "EXCEL", label: "Excel (.xlsx)" },
            { value: "CSV", label: "CSV" },
          ]}
        />
      </form>
    </Modal>
  );
}