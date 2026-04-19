import axios, { AxiosInstance, AxiosError } from 'axios'
import { getDeviceId, generateUUID, getCurrentTimestamp, getTokenFromStorage, isOnline } from '@med-assistant/utils'
import { addToQueue, getQueue, removeFromQueue, cacheData, getCachedData } from './offline-db'
import { QueuedRequest } from './types'
import type { SyncRequest, SyncResponse } from '@med-assistant/types'

export interface ApiClientConfig {
  baseURL: string
  timeout?: number
}

export class ApiClient {
  private axiosInstance: AxiosInstance
  private baseURL: string
  private isSyncing: boolean = false
  private syncInterval: NodeJS.Timeout | null = null

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
    })

    this.setupInterceptors()
    this.startPeriodicSync()
  }

  private setupInterceptors(): void {
    // Request interceptor: add auth token and device ID
    this.axiosInstance.interceptors.request.use((config) => {
      const token = getTokenFromStorage()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      config.headers['x-device-id'] = getDeviceId()
      config.headers['x-app-version'] = '0.1.0'
      return config
    })

    // Response interceptor: handle errors and offline mode
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (!isOnline() || error.code === 'ECONNABORTED') {
          // Queue for later sync
          if (error.config) {
            void this.queueRequest(error.config)
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private async queueRequest(config: any): Promise<void> {
    const request: QueuedRequest = {
      id: generateUUID(),
      method: (config.method || 'GET').toUpperCase() as any,
      path: config.url,
      data: config.data ? JSON.parse(config.data) : undefined,
      timestamp: getCurrentTimestamp(),
      retries: 0,
    }
    await addToQueue(request)
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (isOnline()) {
        void this.processSyncQueue()
      }
    }, 30000)

    // Also sync when coming back online
    window.addEventListener('online', () => {
      void this.processSyncQueue()
    })
  }

  async processSyncQueue(): Promise<void> {
    if (this.isSyncing) return
    this.isSyncing = true

    try {
      const queue = await getQueue()
      if (queue.length === 0) {
        this.isSyncing = false
        return
      }

      // Process queued requests
      for (const request of queue) {
        try {
          await this.executeRequest(request)
          await removeFromQueue(request.id)
        } catch (error) {
          request.retries++
          if (request.retries >= 3) {
            await removeFromQueue(request.id)
            console.error(`Dropped request after 3 retries: ${request.id}`)
          } else {
            await addToQueue(request)
          }
        }
      }
    } finally {
      this.isSyncing = false
    }
  }

  private async executeRequest(request: QueuedRequest): Promise<void> {
    const config: any = {
      method: request.method,
      url: request.path,
    }
    if (request.data) {
      config.data = request.data
    }
    await this.axiosInstance.request(config)
  }

  // GET request with caching
  async get<T = any>(path: string, options?: { cache?: boolean; cacheTtl?: number }): Promise<T> {
    const cached = options?.cache ? await getCachedData(path) : null
    if (cached) return cached

    try {
      const response = await this.axiosInstance.get<T>(path)
      if (options?.cache) {
        await cacheData(path, response.data, options.cacheTtl)
      }
      return response.data
    } catch (error) {
      if (!isOnline()) {
        const fallback = await getCachedData(path)
        if (fallback) return fallback
      }
      throw error
    }
  }

  async post<T = any>(path: string, data?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(path, data)
      return response.data
    } catch (error) {
      if (!isOnline()) {
        // Queue for later sync
        await this.queueRequest({ method: 'POST', url: path, data: JSON.stringify(data) })
        return { success: true, queued: true } as any
      }
      throw error
    }
  }

  async put<T = any>(path: string, data?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(path, data)
      return response.data
    } catch (error) {
      if (!isOnline()) {
        await this.queueRequest({ method: 'PUT', url: path, data: JSON.stringify(data) })
        return { success: true, queued: true } as any
      }
      throw error
    }
  }

  async delete<T = any>(path: string): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(path)
      return response.data
    } catch (error) {
      if (!isOnline()) {
        await this.queueRequest({ method: 'DELETE', url: path })
        return { success: true, queued: true } as any
      }
      throw error
    }
  }

  // Batch sync endpoint (Phase 1 - server implementation pending)
  async syncChanges(changes: any[]): Promise<SyncResponse> {
    try {
      return await this.post<SyncResponse>('/api/v1/sync', {
        device_id: getDeviceId(),
        changes,
        last_sync: localStorage.getItem('last_sync') || new Date(0).toISOString(),
      })
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    }
  }

  getQueueStatus() {
    return {
      isSyncing: this.isSyncing,
    }
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

// Singleton instance
let clientInstance: ApiClient | null = null

export function initializeApiClient(config: ApiClientConfig): ApiClient {
  if (!clientInstance) {
    clientInstance = new ApiClient(config)
  }
  return clientInstance
}

export function getApiClient(): ApiClient {
  if (!clientInstance) {
    throw new Error('API client not initialized. Call initializeApiClient first.')
  }
  return clientInstance
}
