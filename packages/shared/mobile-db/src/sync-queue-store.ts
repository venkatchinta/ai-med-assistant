import { create } from 'zustand'

interface SyncQueueStore {
  pendingCount: number
  isSyncing: boolean
  lastSyncTime: string | null
  syncError: string | null

  // Actions
  setPendingCount: (count: number) => void
  setIsSyncing: (syncing: boolean) => void
  setLastSyncTime: (time: string | null) => void
  setSyncError: (error: string | null) => void
  reset: () => void
}

export const useSyncQueueStore = create<SyncQueueStore>((set) => ({
  pendingCount: 0,
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,

  setPendingCount: (count) => set({ pendingCount: count }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setSyncError: (error) => set({ syncError: error }),
  reset: () =>
    set({
      pendingCount: 0,
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,
    }),
}))
