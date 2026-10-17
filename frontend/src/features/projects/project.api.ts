import { api } from "@/lib/api/client";
import type {
  Project,
  ProjectSummary,
  Paginated,
  ProjectFilters,
  StageAdvanceRequest,
  ProjectHistoryEntry,
  CreateProjectInput,
} from "./project.types";

interface Envelope<T> {
  data: T;
}

function filtersToParams(f: ProjectFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status?.length) p.set("status", f.status.join(","));
  if (f.sector?.length) p.set("sector", f.sector.join(","));
  if (f.region) p.set("region", f.region);
  if (f.ownerOrgId) p.set("owner_org_id", f.ownerOrgId);
  if (f.createdAfter) p.set("created_after", f.createdAfter);
  if (f.createdBefore) p.set("created_before", f.createdBefore);
  if (f.sort) p.set("sort", f.sort);
  if (f.cursor) p.set("cursor", f.cursor);
  if (f.limit) p.set("limit", String(f.limit));
  return p;
}

export const projectApi = {
  async list(f: ProjectFilters): Promise<Paginated<ProjectSummary>> {
    const { data } = await api.get<
      Envelope<ProjectSummary[]> & {
        pagination: Paginated<ProjectSummary>["pagination"];
      }
    >(`/projects?${filtersToParams(f).toString()}`);
    return { data: data.data, pagination: (data as any).pagination };
  },

  async get(projectId: string): Promise<Project> {
    const { data } = await api.get<Envelope<Project>>(`/projects/${projectId}`);
    return data.data;
  },

  async create(
    input: CreateProjectInput & { idempotencyKey: string },
  ): Promise<Project> {
    const { idempotencyKey, ...body } = input;
    const { data } = await api.post<Envelope<Project>>("/projects", body, {
      headers: { "X-Idempotency-Key": idempotencyKey },
    });
    return data.data;
  },

  async update(
    projectId: string,
    patch: Partial<CreateProjectInput>,
    version: number,
  ): Promise<Project> {
    const { data } = await api.put<Envelope<Project>>(
      `/projects/${projectId}`,
      { ...patch, version },
    );
    return data.data;
  },

  async advance(projectId: string, req: StageAdvanceRequest): Promise<Project> {
    const { data } = await api.post<Envelope<Project>>(
      `/projects/${projectId}/advance`,
      req,
    );
    return data.data;
  },

  async history(projectId: string): Promise<ProjectHistoryEntry[]> {
    const { data } = await api.get<Envelope<ProjectHistoryEntry[]>>(
      `/projects/${projectId}/history`,
    );
    return data.data;
  },

  async pipeline(): Promise<Record<string, number>> {
    const { data } =
      await api.get<Envelope<Record<string, number>>>("/pipeline");
    return data.data;
  },

  async bulkImport(file: File): Promise<{ jobId: string; statusUrl: string }> {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post<
      Envelope<{ job_id: string; status_url: string }>
    >("/projects/bulk-import", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { jobId: data.data.job_id, statusUrl: data.data.status_url };
  },
};