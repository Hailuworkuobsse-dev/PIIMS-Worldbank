import type { AxiosError } from "axios";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlation_id?: string;
  errors?: { field: string; code: string; message: string }[];
}

export function normalizeApiError(err: unknown): ProblemDetails {
  const e = err as AxiosError<ProblemDetails>;
  if (e?.response?.data) return e.response.data;
  if (e?.code === "ERR_NETWORK") {
    return {
      type: "network",
      title: "Network error",
      status: 0,
      detail: "Check your connection.",
    };
  }
  return { type: "unknown", title: "Unexpected error", status: 500 };
}