import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { documentApi } from "./document.api";
import type { DocumentFilters } from "./document.types";

export const documentKeys = {
  all: ["documents"] as const,
  list: (f: DocumentFilters) => [...documentKeys.all, "list", f] as const,
  detail: (id: string) => [...documentKeys.all, "detail", id] as const,
  versions: (id: string) => [...documentKeys.all, "versions", id] as const,
};

export function useDocuments(f: DocumentFilters) {
  return useQuery({
    queryKey: documentKeys.list(f),
    queryFn: () => documentApi.list(f),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useDocument(docId: string | undefined) {
  return useQuery({
    queryKey: documentKeys.detail(docId ?? ""),
    queryFn: () => documentApi.get(docId!),
    enabled: !!docId,
  });
}

export function useDocumentVersions(docId: string | undefined) {
  return useQuery({
    queryKey: documentKeys.versions(docId ?? ""),
    queryFn: () => documentApi.versions(docId!),
    enabled: !!docId,
  });
}