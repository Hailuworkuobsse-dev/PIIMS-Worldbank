import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { LocalDraft, Submission } from "./field.types";

interface CapiDB extends DBSchema {
  drafts: { key: string; value: LocalDraft };
  queue: { key: string; value: Submission & { localId: string } };
  meta: { key: string; value: { key: string; value: any } };
}

const DB_NAME = "piims-capi";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CapiDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<CapiDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("drafts"))
          database.createObjectStore("drafts", { keyPath: "localId" });
        if (!database.objectStoreNames.contains("queue"))
          database.createObjectStore("queue", { keyPath: "localId" });
        if (!database.objectStoreNames.contains("meta"))
          database.createObjectStore("meta", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

export const offlineStore = {
  async saveDraft(draft: LocalDraft) {
    const d = await db();
    await d.put("drafts", draft);
  },

  async getDraft(localId: string): Promise<LocalDraft | undefined> {
    const d = await db();
    return d.get("drafts", localId);
  },

  async listDrafts(): Promise<LocalDraft[]> {
    const d = await db();
    return d.getAll("drafts");
  },

  async deleteDraft(localId: string) {
    const d = await db();
    await d.delete("drafts", localId);
  },

  async enqueue(submission: Submission) {
    const d = await db();
    const localId = crypto.randomUUID();
    await d.put("queue", { ...submission, localId });
    return localId;
  },

  async listQueue(): Promise<(Submission & { localId: string })[]> {
    const d = await db();
    return d.getAll("queue");
  },

  async removeFromQueue(localId: string) {
    const d = await db();
    await d.delete("queue", localId);
  },

  async queueSize(): Promise<number> {
    const d = await db();
    return d.count("queue");
  },
};