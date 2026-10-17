import { create } from "zustand";

interface SyncState {
  online: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  setOnline: (v: boolean) => void;
  setPending: (n: number) => void;
  markSynced: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  online: navigator.onLine,
  pendingCount: 0,
  lastSyncAt: null,
  setOnline: (online) => set({ online }),
  setPending: (pendingCount) => set({ pendingCount }),
  markSynced: () => set({ lastSyncAt: Date.now(), pendingCount: 0 }),
}));

// Wire browser online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () =>
    useSyncStore.getState().setOnline(true),
  );
  window.addEventListener("offline", () =>
    useSyncStore.getState().setOnline(false),
  );
}