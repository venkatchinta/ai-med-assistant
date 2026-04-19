import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { QueuedRequest } from './types'

interface OfflineDB extends DBSchema {
  sync_queue: {
    key: string
    value: QueuedRequest
  }
  cached_data: {
    key: string
    value: {
      path: string
      data: any
      timestamp: string
      ttl: number
    }
  }
}

let db: IDBPDatabase<OfflineDB> | null = null

export async function initOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (db) return db

  db = await openDB<OfflineDB>('med-assistant', 1, {
    upgrade(db) {
      // Create sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' })
      }
      // Create cached data store
      if (!db.objectStoreNames.contains('cached_data')) {
        db.createObjectStore('cached_data', { keyPath: 'path' })
      }
    },
  })

  return db
}

export async function addToQueue(request: QueuedRequest): Promise<void> {
  const database = await initOfflineDB()
  await database.put('sync_queue', request)
}

export async function getQueue(): Promise<QueuedRequest[]> {
  const database = await initOfflineDB()
  return database.getAll('sync_queue')
}

export async function removeFromQueue(requestId: string): Promise<void> {
  const database = await initOfflineDB()
  await database.delete('sync_queue', requestId)
}

export async function clearQueue(): Promise<void> {
  const database = await initOfflineDB()
  await database.clear('sync_queue')
}

export async function cacheData(
  path: string,
  data: any,
  ttlMinutes: number = 60
): Promise<void> {
  const database = await initOfflineDB()
  await database.put('cached_data', {
    path,
    data,
    timestamp: new Date().toISOString(),
    ttl: ttlMinutes * 60 * 1000,
  })
}

export async function getCachedData(path: string): Promise<any | null> {
  const database = await initOfflineDB()
  const cached = await database.get('cached_data', path)

  if (!cached) return null

  const now = Date.now()
  const cacheTime = new Date(cached.timestamp).getTime()
  const isExpired = now - cacheTime > cached.ttl

  if (isExpired) {
    await database.delete('cached_data', path)
    return null
  }

  return cached.data
}

export async function clearCache(): Promise<void> {
  const database = await initOfflineDB()
  await database.clear('cached_data')
}

export async function getQueueSize(): Promise<number> {
  const database = await initOfflineDB()
  return database.count('sync_queue')
}
