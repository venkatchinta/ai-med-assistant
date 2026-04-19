import { SQLiteDatabase } from 'expo-sqlite'
import { SyncQueueItem } from './types'
import { getDatabase } from './database'

export class SyncQueueDB {
  private db: SQLiteDatabase

  constructor(database?: SQLiteDatabase) {
    this.db = database || getDatabase()
  }

  async addToQueue(item: Omit<SyncQueueItem, 'retries' | 'created_at'>): Promise<void> {
    const createdAt = new Date().toISOString()
    await this.db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, operation, data, idempotency_key, timestamp, retries, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        item.id,
        item.entity_type,
        item.operation,
        JSON.stringify(item.data),
        item.idempotency_key,
        item.timestamp,
        createdAt,
      ]
    )
  }

  async getQueue(limit: number = 100): Promise<SyncQueueItem[]> {
    const result = await this.db.getAllAsync<any>(
      'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT ?',
      [limit]
    )

    return result.map((row) => ({
      id: row.id,
      entity_type: row.entity_type,
      operation: row.operation,
      data: JSON.parse(row.data),
      idempotency_key: row.idempotency_key,
      timestamp: row.timestamp,
      retries: row.retries,
      created_at: row.created_at,
    }))
  }

  async getQueueItem(id: string): Promise<SyncQueueItem | null> {
    const result = await this.db.getFirstAsync<any>(
      'SELECT * FROM sync_queue WHERE id = ?',
      [id]
    )

    if (!result) return null

    return {
      id: result.id,
      entity_type: result.entity_type,
      operation: result.operation,
      data: JSON.parse(result.data),
      idempotency_key: result.idempotency_key,
      timestamp: result.timestamp,
      retries: result.retries,
      created_at: result.created_at,
    }
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id])
  }

  async updateRetries(id: string, retries: number): Promise<void> {
    await this.db.runAsync('UPDATE sync_queue SET retries = ? WHERE id = ?', [retries, id])
  }

  async getQueueCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue'
    )
    return result?.count ?? 0
  }

  async clearQueue(): Promise<void> {
    await this.db.runAsync('DELETE FROM sync_queue')
  }

  async clearOldItems(olderThanHours: number = 24): Promise<void> {
    await this.db.runAsync(
      `DELETE FROM sync_queue WHERE datetime(created_at) < datetime('now', '-${olderThanHours} hours')`
    )
  }

  async getPendingByType(entityType: string): Promise<SyncQueueItem[]> {
    const result = await this.db.getAllAsync<any>(
      'SELECT * FROM sync_queue WHERE entity_type = ? ORDER BY created_at ASC',
      [entityType]
    )

    return result.map((row) => ({
      id: row.id,
      entity_type: row.entity_type,
      operation: row.operation,
      data: JSON.parse(row.data),
      idempotency_key: row.idempotency_key,
      timestamp: row.timestamp,
      retries: row.retries,
      created_at: row.created_at,
    }))
  }
}
