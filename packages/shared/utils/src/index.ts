// UUID generation for offline records
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Get device ID (browser fingerprint)
export function getDeviceId(): string {
  const stored = localStorage.getItem('device_id')
  if (stored) return stored

  const deviceId = `web-${generateUUID()}`
  localStorage.setItem('device_id', deviceId)
  return deviceId
}

// Create idempotency key from data
export function createIdempotencyKey(data: Record<string, any>): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `${Math.abs(hash)}-${Date.now()}`
}

// Date utilities
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// Token utilities
export function getTokenFromStorage(): string | null {
  return localStorage.getItem('access_token')
}

export function setTokenInStorage(token: string): void {
  localStorage.setItem('access_token', token)
}

export function getRefreshTokenFromStorage(): string | null {
  return localStorage.getItem('refresh_token')
}

export function setRefreshTokenInStorage(token: string): void {
  localStorage.setItem('refresh_token', token)
}

export function clearTokens(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

// Network detection
export function isOnline(): boolean {
  return navigator.onLine
}

// Retry logic
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, initialDelayMs * Math.pow(2, i))
        )
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}
