import { api } from "@/lib/api/client";
import type {
  Grievance,
  GrievanceFilters,
  GrievanceAction,
  GrievanceStats,
} from "./grievance.types";
import type {
  GrievanceIntakeFormData,
  GrievanceAssignFormData,
  GrievanceResolveFormData,
  GrievanceEscalateFormData,
} from "./grievance.schema";

interface Envelope<T> {
  data: T;
}

function filtersToParams(f: GrievanceFilters): string {
  const p = new URLSearchParams();
  if (f.projectId) p.set("project_id", f.projectId);
  if (f.category?.length) p.set("category", f.category.join(","));
  if (f.status?.length) p.set("status", f.status.join(","));
  if (f.severity?.length) p.set("severity", f.severity.join(","));
  if (f.assignedTo) p.set("assigned_to", f.assignedTo);
  if (f.overdueOnly) p.set("overdue", "true");
  if (f.q) p.set("q", f.q);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.limit) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  return p.toString();
}

export const grievanceApi = {
  async list(f: GrievanceFilters) {
    const { data } = await api.get<Envelope<Grievance[]> & { pagination: any }>(
      `/grievances?${filtersToParams(f)}`,
    );
    return { data: data.data, pagination: (data as any).pagination };
  },

  async get(grievanceId: string): Promise<Grievance> {
    const { data } = await api.get<Envelope<Grievance>>(
      `/grievances/${grievanceId}`,
    );
    return data.data;
  },

  async create(input: GrievanceIntakeFormData): Promise<Grievance> {
    const { data } = await api.post<Envelope<Grievance>>("/grievances", input);
    return data.data;
  },

  async assign(
    grievanceId: string,
    input: GrievanceAssignFormData,
  ): Promise<Grievance> {
    const { data } = await api.post<Envelope<Grievance>>(
      `/grievances/${grievanceId}/assign`,
      input,
    );
    return data.data;
  },

  async resolve(
    grievanceId: string,
    input: GrievanceResolveFormData,
  ): Promise<Grievance> {
    const { data } = await api.post<Envelope<Grievance>>(
      `/grievances/${grievanceId}/resolve`,
      input,
    );
    return data.data;
  },

  async escalate(
    grievanceId: string,
    input: GrievanceEscalateFormData,
  ): Promise<Grievance> {
    const { data } = await api.post<Envelope<Grievance>>(
      `/grievances/${grievanceId}/escalate`,
      input,
    );
    return data.data;
  },

  async actions(grievanceId: string): Promise<GrievanceAction[]> {
    const { data } = await api.get<Envelope<GrievanceAction[]>>(
      `/grievances/${grievanceId}/actions`,
    );
    return data.data;
  },

  async stats(projectId?: string): Promise<GrievanceStats> {
    const p = projectId ? `?project_id=${projectId}` : "";
    const { data } = await api.get<Envelope<GrievanceStats>>(
      `/grievances/stats${p}`,
    );
    return data.data;
  },
};