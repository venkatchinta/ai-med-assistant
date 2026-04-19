export interface QueuedRequest {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  data?: Record<string, any>
  timestamp: string
  retries: number
}

export interface OfflineState {
  isOnline: boolean
  queuedCount: number
  lastSync: string | null
}
