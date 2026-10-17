import { api } from "@/lib/api/client";
import type {
  DocumentMeta,
  DocumentFilters,
  DocumentVersion,
} from "./document.types";
import type { DocumentUploadFormData } from "./document.schema";

interface Envelope<T> {
  data: T;
}

function filtersToParams(f: DocumentFilters): string {
  const p = new URLSearchParams();
  if (f.projectId) p.set("project_id", f.projectId);
  if (f.docType?.length) p.set("doc_type", f.docType.join(","));
  if (f.q) p.set("q", f.q);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.limit) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  return p.toString();
}

export const documentApi = {
  async list(f: DocumentFilters) {
    const { data } = await api.get<
      Envelope<DocumentMeta[]> & { pagination: any }
    >(`/documents?${filtersToParams(f)}`);
    return { data: data.data, pagination: (data as any).pagination };
  },

  async get(docId: string): Promise<DocumentMeta> {
    const { data } = await api.get<Envelope<DocumentMeta>>(
      `/documents/${docId}`,
    );
    return data.data;
  },

  async upload(
    input: DocumentUploadFormData,
    file: File,
  ): Promise<DocumentMeta> {
    const fd = new FormData();
    Object.entries(input).forEach(([k, v]) => {
      if (v == null || v === "") return;
      fd.append(k, Array.isArray(v) ? v.join(",") : String(v));
    });
    fd.append("file", file);
    const { data } = await api.post<Envelope<DocumentMeta>>("/documents", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    });
    return data.data;
  },

  async versions(docId: string): Promise<DocumentVersion[]> {
    const { data } = await api.get<Envelope<DocumentVersion[]>>(
      `/documents/${docId}/versions`,
    );
    return data.data;
  },

  async signedUrl(docId: string): Promise<{ url: string; expiresAt: string }> {
    const { data } = await api.get<
      Envelope<{ url: string; expiresAt: string }>
    >(`/documents/${docId}/download`);
    return data.data;
  },

  async restoreVersion(
    docId: string,
    versionId: string,
  ): Promise<DocumentMeta> {
    const { data } = await api.post<Envelope<DocumentMeta>>(
      `/documents/${docId}/restore`,
      { version_id: versionId },
    );
    return data.data;
  },
};