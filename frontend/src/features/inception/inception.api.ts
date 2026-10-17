import { api } from "@/lib/api/client";
import type {
  InceptionReport,
  InceptionReportListFilters,
  ReviewComment,
  InceptionReportTemplate,
  SubmitInceptionInput,
  ReviewDecisionInput,
  NoObjectionInput,
  ReportVersionSummary,
  ReportStatus,
} from "./inception.types";

interface Envelope<T> {
  data: T;
}

function filtersToParams(f: InceptionReportListFilters): string {
  const p = new URLSearchParams();
  if (f.projectId) p.set("project_id", f.projectId);
  if (f.status?.length) p.set("status", f.status.join(","));
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.overdue) p.set("overdue", "true");
  if (f.q) p.set("q", f.q);
  if (f.limit) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  return p.toString();
}

export const inceptionApi = {
  async list(f: InceptionReportListFilters) {
    const { data } = await api.get<
      Envelope<InceptionReport[]> & { pagination: any }
    >(`/inception-reports?${filtersToParams(f)}`);
    return { data: data.data, pagination: (data as any).pagination };
  },

  async get(reportId: string): Promise<InceptionReport> {
    const { data } = await api.get<Envelope<InceptionReport>>(
      `/inception-reports/${reportId}`,
    );
    return data.data;
  },

  async templates(): Promise<InceptionReportTemplate[]> {
    const { data } = await api.get<Envelope<InceptionReportTemplate[]>>(
      "/inception/templates",
    );
    return data.data;
  },

  async submit(input: SubmitInceptionInput): Promise<InceptionReport> {
    const fd = new FormData();
    fd.append("project_id", input.projectId);
    fd.append("template_id", input.templateId);
    fd.append("version", String(input.version));
    fd.append("summary", input.summary);
    fd.append("file", input.file);
    const { data } = await api.post<Envelope<InceptionReport>>(
      "/inception-reports",
      fd,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 120_000 },
    );
    return data.data;
  },

  async review(
    reportId: string,
    input: ReviewDecisionInput,
  ): Promise<InceptionReport> {
    const { data } = await api.post<Envelope<InceptionReport>>(
      `/inception-reports/${reportId}/review`,
      input,
    );
    return data.data;
  },

  async noObjection(
    reportId: string,
    input: NoObjectionInput,
  ): Promise<InceptionReport> {
    const { data } = await api.post<Envelope<InceptionReport>>(
      `/inception-reports/${reportId}/no-objection`,
      input,
    );
    return data.data;
  },

  async comments(reportId: string): Promise<ReviewComment[]> {
    const { data } = await api.get<Envelope<ReviewComment[]>>(
      `/inception-reports/${reportId}/comments`,
    );
    return data.data;
  },

  async addComment(
    reportId: string,
    text: string,
    sectionId?: string,
    parentId?: string,
  ): Promise<ReviewComment> {
    const { data } = await api.post<Envelope<ReviewComment>>(
      `/inception-reports/${reportId}/comments`,
      {
        text,
        section_id: sectionId,
        parent_id: parentId,
      },
    );
    return data.data;
  },

  async resolveComment(
    reportId: string,
    commentId: string,
  ): Promise<ReviewComment> {
    const { data } = await api.post<Envelope<ReviewComment>>(
      `/inception-reports/${reportId}/comments/${commentId}/resolve`,
    );
    return data.data;
  },

  async versions(projectId: string): Promise<ReportVersionSummary[]> {
    const { data } = await api.get<Envelope<ReportVersionSummary[]>>(
      `/projects/${projectId}/inception/versions`,
    );
    return data.data;
  },

  async signedUrl(
    reportId: string,
  ): Promise<{ url: string; expiresAt: string }> {
    const { data } = await api.get<
      Envelope<{ url: string; expiresAt: string }>
    >(`/inception-reports/${reportId}/download`);
    return data.data;
  },
};