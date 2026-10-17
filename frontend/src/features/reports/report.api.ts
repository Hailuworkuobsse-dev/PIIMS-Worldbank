import { api } from "@/lib/api/client";
import type {
  ReportDefinition,
  ReportInstance,
  GenerateReportInput,
  ReportSchedule,
  ScheduleInput,
} from "./report.types";

interface Envelope<T> {
  data: T;
}

export const reportApi = {
  async catalogue(): Promise<ReportDefinition[]> {
    const { data } =
      await api.get<Envelope<ReportDefinition[]>>("/reports/catalogue");
    return data.data;
  },

  async generate(input: GenerateReportInput): Promise<ReportInstance> {
    const { data } = await api.post<Envelope<ReportInstance>>(
      "/reports/generate",
      input,
    );
    return data.data;
  },

  async getInstance(instanceId: string): Promise<ReportInstance> {
    const { data } = await api.get<Envelope<ReportInstance>>(
      `/reports/instances/${instanceId}`,
    );
    return data.data;
  },

  async instances(limit = 50): Promise<ReportInstance[]> {
    const { data } = await api.get<Envelope<ReportInstance[]>>(
      `/reports/instances?limit=${limit}`,
    );
    return data.data;
  },

  async download(instanceId: string): Promise<{ url: string }> {
    const { data } = await api.get<Envelope<{ url: string }>>(
      `/reports/instances/${instanceId}/download`,
    );
    return data.data;
  },

  async schedules(): Promise<ReportSchedule[]> {
    const { data } =
      await api.get<Envelope<ReportSchedule[]>>("/reports/schedules");
    return data.data;
  },

  async createSchedule(input: ScheduleInput): Promise<ReportSchedule> {
    const { data } = await api.post<Envelope<ReportSchedule>>(
      "/reports/schedules",
      input,
    );
    return data.data;
  },

  async deleteSchedule(scheduleId: string): Promise<void> {
    await api.delete(`/reports/schedules/${scheduleId}`);
  },

  async exportWB(
    period: string,
    projectIds?: string[],
  ): Promise<{ url: string }> {
    const { data } = await api.get<Envelope<{ url: string }>>(
      `/reports/export/wb?period=${encodeURIComponent(period)}${projectIds?.length ? "&project_ids=" + projectIds.join(",") : ""}`,
    );
    return data.data;
  },
};