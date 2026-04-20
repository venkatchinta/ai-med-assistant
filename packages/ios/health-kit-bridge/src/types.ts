/**
 * HealthKit data types and interfaces
 */

export interface HealthMetrics {
  steps?: number
  heart_rate?: number
  active_energy?: number
  distance?: number
  water?: number
  sleep_duration?: number
  workouts?: Workout[]
  blood_pressure?: BloodPressure
  weight?: number
  body_temperature?: number
}

export interface Workout {
  id?: string
  type: string
  duration: number // in minutes
  calories?: number
  distance?: number
  start_date: string
  end_date: string
}

export interface BloodPressure {
  systolic: number
  diastolic: number
}

export interface HealthKitPermissions {
  read: HealthKitType[]
  write?: HealthKitType[]
}

export enum HealthKitType {
  STEP_COUNT = 'HKQuantityTypeIdentifierStepCount',
  HEART_RATE = 'HKQuantityTypeIdentifierHeartRate',
  ACTIVE_ENERGY = 'HKQuantityTypeIdentifierActiveEnergyBurned',
  DISTANCE = 'HKQuantityTypeIdentifierDistanceWalkingRunning',
  WATER = 'HKQuantityTypeIdentifierDietaryWater',
  WORKOUT = 'HKWorkoutTypeIdentifier',
  BLOOD_PRESSURE_SYSTOLIC = 'HKQuantityTypeIdentifierBloodPressureSystolic',
  BLOOD_PRESSURE_DIASTOLIC = 'HKQuantityTypeIdentifierBloodPressureDiastolic',
  BODY_TEMPERATURE = 'HKQuantityTypeIdentifierBodyTemperature',
  BODY_MASS = 'HKQuantityTypeIdentifierBodyMass',
  SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis',
}

export interface HealthQueryOptions {
  startDate: Date
  endDate?: Date
  limit?: number
  ascending?: boolean
}

export enum HealthKitAuthorizationStatus {
  NOT_DETERMINED = 'notDetermined',
  DENIED = 'denied',
  AUTHORIZED = 'authorized',
}

export interface HealthKitError extends Error {
  code?: string
  isPermissionError?: boolean
}
