import { useEffect, useState, useCallback } from 'react'
import {
  getHealthMetrics,
  getStepCount,
  getHeartRate,
  getActiveEnergy,
  getWorkouts,
  getBloodPressure,
  getWeight,
  getBodyTemperature,
  requestHealthKitPermissions,
  initializeHealthKit,
} from '@med-assistant/health-kit-bridge'
import type { HealthMetrics, HealthKitPermissions } from '@med-assistant/health-kit-bridge'

interface UseHealthKitOptions {
  autoInit?: boolean
  refreshInterval?: number // in milliseconds
}

interface UseHealthKitReturn {
  metrics: HealthMetrics
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  requestPermissions: (permissions: HealthKitPermissions) => Promise<boolean>
}

export function useHealthKit(options: UseHealthKitOptions = {}): UseHealthKitReturn {
  const { autoInit = true, refreshInterval = 0 } = options

  const [metrics, setMetrics] = useState<HealthMetrics>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const newMetrics = await getHealthMetrics(today, new Date())
      setMetrics(newMetrics)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Error refreshing health metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const requestPermissions = useCallback(async (permissions: HealthKitPermissions) => {
    try {
      return await requestHealthKitPermissions(permissions)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Permission request failed')
      setError(error)
      return false
    }
  }, [])

  useEffect(() => {
    if (autoInit) {
      const init = async () => {
        try {
          await initializeHealthKit()
          await refresh()
        } catch (err) {
          console.error('Error initializing HealthKit:', err)
        }
      }

      init()
    }
  }, [autoInit, refresh])

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, refresh])

  return {
    metrics,
    loading,
    error,
    refresh,
    requestPermissions,
  }
}

/**
 * Hook for getting specific health metric
 */
export function useHealthMetric(
  metricType: 'steps' | 'heart_rate' | 'active_energy' | 'blood_pressure' | 'weight' | 'temperature',
  options: { refreshInterval?: number } = {}
) {
  const [value, setValue] = useState<number | object | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let result: number | object | null = null

      switch (metricType) {
        case 'steps':
          result = await getStepCount(today)
          break
        case 'heart_rate':
          result = await getHeartRate(today)
          break
        case 'active_energy':
          result = await getActiveEnergy(today)
          break
        case 'blood_pressure':
          result = await getBloodPressure(today)
          break
        case 'weight':
          result = await getWeight(today)
          break
        case 'temperature':
          result = await getBodyTemperature(today)
          break
      }

      setValue(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [metricType])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (options.refreshInterval && options.refreshInterval > 0) {
      const interval = setInterval(refresh, options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [options.refreshInterval, refresh])

  return {
    value,
    loading,
    error,
    refresh,
  }
}
