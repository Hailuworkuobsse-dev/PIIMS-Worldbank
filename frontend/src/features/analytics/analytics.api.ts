// analytics.api.ts
import { api } from "@/lib/api/client";
import type {
  ImpactDashboard,
  DiDResult,
  DisaggregationRow,
} from "./analytics.types";

interface Envelope<T> {
  data: T;
}

export const analyticsApi = {
  async dashboard(projectId: string): Promise<ImpactDashboard> {
    const { data } = await api.get<Envelope<ImpactDashboard>>(
      `/impact/dashboard?project_id=${projectId}`,
    );
    return data.data;
  },

  async did(
    projectId: string,
    indicatorId: string,
    treatmentGroupId: string,
    controlGroupId: string,
  ): Promise<DiDResult> {
    const { data } = await api.post<Envelope<DiDResult>>(
      "/impact/analysis/did",
      {
        project_id: projectId,
        indicator_id: indicatorId,
        treatment_group_id: treatmentGroupId,
        control_group_id: controlGroupId,
      },
    );
    return data.data;
  },

  async disaggregation(
    projectId: string,
    indicatorId: string,
    by: "gender" | "region" | "wealth_quintile",
  ): Promise<DisaggregationRow[]> {
    const { data } = await api.get<Envelope<DisaggregationRow[]>>(
      `/impact/analysis/disaggregation?project_id=${projectId}&indicator_id=${indicatorId}&by=${by}`,
    );
    return data.data;
  },
};