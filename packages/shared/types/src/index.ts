// Auth types
export interface User {
  id: number
  email: string
  full_name: string
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  device_id: string
  sync_token: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

// Family types
export interface FamilyMember {
  id: number
  user_id: number
  name: string
  age: number
  relationship: string
  blood_type?: string
  allergies?: string
  medical_conditions?: string
  created_at: string
}

// Medication types
export interface Medication {
  id: number
  family_member_id: number
  name: string
  dosage: string
  frequency: string
  reason: string
  start_date: string
  end_date?: string
  is_active: boolean
  created_at: string
}

// Lab Result types
export interface LabResult {
  id: number
  family_member_id: number
  test_name: string
  value: number
  unit: string
  reference_range: string
  status: 'normal' | 'abnormal' | 'critical'
  test_date: string
  created_at: string
}

// Appointment types
export interface Appointment {
  id: number
  family_member_id: number
  doctor_name: string
  appointment_type: string
  location: string
  scheduled_at: string
  notes?: string
  created_at: string
}

// Health Tracking types
export interface HealthLog {
  id: number
  family_member_id: number
  log_type: 'vitals' | 'wellness' | 'diet'
  data: Record<string, any>
  logged_at: string
  created_at: string
}

// Sync types
export interface SyncChange {
  id: string
  entity_type: 'medication' | 'appointment' | 'lab_result' | 'health_log' | 'family_member'
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  data: Record<string, any>
  idempotency_key: string
  timestamp: string
}

export interface SyncRequest {
  device_id: string
  changes: SyncChange[]
  last_sync: string
}

export interface SyncChangeResult {
  local_id: string
  server_id?: number
  version?: number
}

export interface SyncConflict {
  local_id: string
  reason: string
  server_data: Record<string, any>
}

export interface SyncResponse {
  success: SyncChangeResult[]
  conflicts: SyncConflict[]
  new_data: Record<string, any>[]
  last_sync: string
}

// API Error types
export interface ApiError {
  detail: string | { msg: string; loc: string[] }[]
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  skip: number
  limit: number
}
