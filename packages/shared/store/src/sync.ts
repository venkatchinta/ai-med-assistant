import { create } from 'zustand'

interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  queuedChanges: number
  lastSyncTime: string | null
  syncError: string | null
  deviceId: string | null

  // Actions
  setOnline: (online: boolean) => void
  setSyncing: (syncing: boolean) => void
  setQueuedChanges: (count: number) => void
  setLastSyncTime: (time: string | null) => void
  setSyncError: (error: string | null) => void
  setDeviceId: (id: string) => void
  reset: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  queuedChanges: 0,
  lastSyncTime: localStorage.getItem('last_sync'),
  syncError: null,
  deviceId: localStorage.getItem('device_id'),

  setOnline: (online) => set({ isOnline: online }),

  setSyncing: (syncing) => set({ isSyncing: syncing }),

  setQueuedChanges: (count) => set({ queuedChanges: count }),

  setLastSyncTime: (time) => {
    if (time) {
      localStorage.setItem('last_sync', time)
    }
    set({ lastSyncTime: time })
  },

  setSyncError: (error) => set({ syncError: error }),

  setDeviceId: (id) => {
    localStorage.setItem('device_id', id)
    set({ deviceId: id })
  },

  reset: () =>
    set({
      isOnline: navigator.onLine,
      isSyncing: false,
      queuedChanges: 0,
      lastSyncTime: null,
      syncError: null,
    }),
}))

// Listen to online/offline events
window.addEventListener('online', () => {
  useSyncStore.getState().setOnline(true)
})

window.addEventListener('offline', () => {
  useSyncStore.getState().setOnline(false)
})
