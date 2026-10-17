import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportApi } from "./report.api";
import { reportKeys } from "./report.queries";
import { useToast } from "@/components/ui/Toast";
import { normalizeApiError } from "@/lib/api/errors";
import type { GenerateReportInput, ScheduleInput } from "./report.types";

export function useGenerateReport() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: GenerateReportInput) => reportApi.generate(input),
    onSuccess: (inst) => {
      qc.invalidateQueries({ queryKey: reportKeys.instances() });
      push("info", `Report ${inst.reportCode} queued for generation`);
    },
    onError: (err) =>
      push("error", normalizeApiError(err).detail ?? "Generation failed"),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (input: ScheduleInput) => reportApi.createSchedule(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.schedules() });
      push("success", "Schedule created");
    },
    onError: (err) =>
      push(
        "error",
        normalizeApiError(err).detail ?? "Schedule creation failed",
      ),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  const { push } = useToast();
  return useMutation({
    mutationFn: (scheduleId: string) => reportApi.deleteSchedule(scheduleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.schedules() });
      push("success", "Schedule deleted");
    },
  });
}