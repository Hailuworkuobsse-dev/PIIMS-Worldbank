import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import {
  generateReportSchema,
  type GenerateReportFormData,
} from "./report.schema";
import { useGenerateReport } from "./report.mutations";
import { useProjects } from "@/features/projects/project.queries";
import type { ReportType } from "./report.types";

export function ReportGenerateModal({
  open,
  onClose,
  reportCode,
}: {
  open: boolean;
  onClose: () => void;
  reportCode: ReportType;
}) {
  const { t } = useTranslation();
  const generate = useGenerateReport();
  const { data: projects } = useProjects({ limit: 200 });

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<GenerateReportFormData>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      reportCode,
      projectId: "",
      period: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`,
      fiscalYear: new Date().getFullYear(),
      format: "PDF",
    },
  });

  const onSubmit = async (v: GenerateReportFormData) => {
    await generate.mutateAsync({
      reportCode: v.reportCode,
      projectId: v.projectId || undefined,
      period: v.period || undefined,
      fiscalYear: v.fiscalYear,
      format: v.format,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Generate ${reportCode}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            loading={generate.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {t("reports.generate")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <input type="hidden" {...register("reportCode")} />
        <Select
          {...register("projectId")}
          label="Project"
          placeholder="All projects (portfolio report)"
          options={(projects?.data ?? []).map((p) => ({
            value: p.projectId,
            label: `${p.projectCode} · ${p.name}`,
          }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("period")} label="Period" placeholder="Q3-2026" />
          <Input
            {...register("fiscalYear", { valueAsNumber: true })}
            type="number"
            label="Fiscal year"
          />
        </div>
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
        <p className="text-caption text-neutral-600">
          Generation typically takes 10–60 seconds. You'll be notified when
          ready.
        </p>
      </form>
    </Modal>
  );
}