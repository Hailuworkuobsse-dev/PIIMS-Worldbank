// qa.api.ts
import { api } from "@/lib/api/client";
import type {
  QAFlag,
  QARule,
  CollectorScorecard,
  QAStats,
  QAFlagFilters,
} from "./qa.types";

interface Envelope<T> {
  data: T;
}

export const qaApi = {
  async listFlags(f: QAFlagFilters) {
    const p = new URLSearchParams();
    if (f.waveId) p.set("wave_id", f.waveId);
    if (f.severity?.length) p.set("severity", f.severity.join(","));
    if (f.status?.length) p.set("status", f.status.join(","));
    if (f.collectorId) p.set("collector_id", f.collectorId);
    if (f.limit) p.set("limit", String(f.limit));
    if (f.cursor) p.set("cursor", f.cursor);
    const { data } = await api.get<Envelope<QAFlag[]> & { pagination: any }>(
      `/qa/flags?${p.toString()}`,
    );
    return { data: data.data, pagination: (data as any).pagination };
  },

  async review(
    flagId: string,
    decision: "ACCEPT" | "REJECT" | "BACK_CHECK",
    notes?: string,
  ): Promise<QAFlag> {
    const { data } = await api.post<Envelope<QAFlag>>(
      `/qa/flags/${flagId}/review`,
      { decision, notes },
    );
    return data.data;
  },

  async scorecards(waveId?: string): Promise<CollectorScorecard[]> {
    const p = waveId ? `?wave_id=${waveId}` : "";
    const { data } = await api.get<Envelope<CollectorScorecard[]>>(
      `/qa/scorecards${p}`,
    );
    return data.data;
  },

  async stats(waveId?: string): Promise<QAStats> {
    const p = waveId ? `?wave_id=${waveId}` : "";
    const { data } = await api.get<Envelope<QAStats>>(`/qa/stats${p}`);
    return data.data;
  },

  async rules(): Promise<QARule[]> {
    const { data } = await api.get<Envelope<QARule[]>>("/qa/rules");
    return data.data;
  },

  async toggleRule(ruleId: string, active: boolean): Promise<QARule> {
    const { data } = await api.patch<Envelope<QARule>>(`/qa/rules/${ruleId}`, {
      active,
    });
    return data.data;
  },
};