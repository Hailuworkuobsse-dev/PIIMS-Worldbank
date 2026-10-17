import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectApi } from "./project.api";
import { projectKeys } from "./project.queries";
import { useToast } from "@/components/ui/Toast";
import { useSyncStore } from "@/stores/sync.store";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  CreateProjectInput,
  Project,
  StageAdvanceRequest,
} from "./project.types";

/* -------------------------------------------------------------------------
 * Offline mutation queue (localStorage-backed; idb preferred in prod)
 * ------------------------------------------------------------------------- */
interface QueuedMutation {
  id: string;
  kind: "create" | "update" | "advance";
  projectId?: string;
  payload: unknown;
  queuedAt: number;
}

const QUEUE_KEY = "piims.mutation.queue";

function readQueue(): QueuedMutation[] {
  try {
    return JSON.parse(
      localStorage.getItem(QUEUE_KEY) ?? "[]",
    ) as QueuedMutation[];
  } catch {
    return [];
  }
}
function writeQueue(q: QueuedMutation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  useSyncStore.getState().setPending(q.length);
}

export function enqueueMutation(m: Omit<QueuedMutation, "id" | "queuedAt">) {
  const q = readQueue();
  q.push({ ...m, id: crypto.randomUUID(), queuedAt: Date.now() });
  writeQueue(q);
}

export function clearQueue() {
  writeQueue([]);
}
export function queueSize() {
  return readQueue().length;
}

/* -------------------------------------------------------------------------
 * CREATE
 * ------------------------------------------------------------------------- */
export function useCreateProject() {
  const qc = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const idempotencyKey = crypto.randomUUID();
      if (!navigator.onLine) {
        enqueueMutation({
          kind: "create",
          payload: { ...input, idempotencyKey },
        });
        throw Object.assign(new Error("OFFLINE_QUEUED"), {
          offlineQueued: true,
        });
      }
      return projectApi.create({ ...input, idempotencyKey });
    },
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      push("success", `Project ${project.projectCode} created`);
    },
    onError: (err: any) => {
      if (err?.offlineQueued) {
        push(
          "info",
          "You are offline. Project will be submitted when reconnected.",
        );
        return;
      }
      const p = normalizeApiError(err);
      push("error", p.detail ?? p.title ?? "Failed to create project");
    },
  });
}

/* -------------------------------------------------------------------------
 * UPDATE — optimistic
 * ------------------------------------------------------------------------- */
export function useUpdateProject(projectId: string) {
  const qc = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: ({
      patch,
      version,
    }: {
      patch: Partial<CreateProjectInput>;
      version: number;
    }) => projectApi.update(projectId, patch, version),

    onMutate: async ({ patch }) => {
      await qc.cancelQueries({ queryKey: projectKeys.detail(projectId) });
      const previous = qc.getQueryData<Project>(projectKeys.detail(projectId));
      if (previous) {
        qc.setQueryData<Project>(projectKeys.detail(projectId), {
          ...previous,
          ...patch,
        } as Project);
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(projectKeys.detail(projectId), ctx.previous);
      const p = normalizeApiError(err);
      push("error", p.detail ?? "Failed to save changes");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      push("success", "Project updated");
    },
  });
}

/* -------------------------------------------------------------------------
 * ADVANCE STAGE
 * ------------------------------------------------------------------------- */
export function useAdvanceStage(projectId: string) {
  const qc = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (req: StageAdvanceRequest) =>
      projectApi.advance(projectId, req),
    onSuccess: (project) => {
      qc.setQueryData(projectKeys.detail(projectId), project);
      qc.invalidateQueries({ queryKey: projectKeys.all });
      push(
        "success",
        `Advanced to ${project.status.replace(/_/g, " ").toLowerCase()}`,
      );
    },
    onError: (err) => {
      const p = normalizeApiError(err);
      push("error", p.detail ?? "Failed to advance stage");
    },
  });
}

/* -------------------------------------------------------------------------
 * FLUSH — replay queued mutations when online
 * ------------------------------------------------------------------------- */
export async function flushMutationQueue() {
  const q = readQueue();
  if (!q.length) return;
  const remaining: QueuedMutation[] = [];
  for (const m of q) {
    try {
      if (m.kind === "create") await projectApi.create(m.payload as any);
      if (m.kind === "update")
        await projectApi.update(m.projectId!, m.payload as any, 1);
      if (m.kind === "advance")
        await projectApi.advance(m.projectId!, m.payload as any);
    } catch {
      remaining.push(m);
    }
  }
  writeQueue(remaining);
}

/* Wire: replay on reconnect */
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void flushMutationQueue();
  });
}