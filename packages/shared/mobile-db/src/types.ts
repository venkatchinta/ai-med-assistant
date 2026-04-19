export interface SyncQueueItem {
  id: string
  entity_type: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  data: Record<string, any>
  idempotency_key: string
  timestamp: string
  retries: number
  created_at: string
}

export interface LocalMedication {
  id: number
  family_member_id: number
  name: string
  dosage: string
  frequency: string
  reason: string
  start_date: string
  end_date?: string
  is_active: number
  synced: number
  updated_at?: string
  created_at: string
}

export interface LocalFamilyMember {
  id: number
  user_id: number
  name: string
  age: number
  relationship: string
  blood_type?: string
  allergies?: string
  medical_conditions?: string
  synced: number
  updated_at?: string
  created_at: string
}

export interface LocalHealthLog {
  id: number
  family_member_id: number
  log_type: 'vitals' | 'wellness' | 'diet'
  data: string
  logged_at: string
  synced: number
  created_at: string
}

export interface DatabaseConfig {
  databaseName?: string
  version?: number
}
