import { getApiClient } from './client'
import type { User, FamilyMember, Medication, LabResult, Appointment } from '@med-assistant/types'

// Auth hooks
export async function login(email: string, password: string) {
  const client = getApiClient()
  return client.post('/api/v1/auth/login', { email, password })
}

export async function signup(email: string, password: string, full_name: string) {
  const client = getApiClient()
  return client.post('/api/v1/auth/signup', { email, password, full_name })
}

export async function refreshToken() {
  const client = getApiClient()
  return client.post('/api/v1/auth/refresh')
}

// Family hooks
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const client = getApiClient()
  return client.get('/api/v1/family', { cache: true, cacheTtl: 60 })
}

export async function addFamilyMember(data: Omit<FamilyMember, 'id' | 'user_id' | 'created_at'>): Promise<FamilyMember> {
  const client = getApiClient()
  return client.post('/api/v1/family', data)
}

export async function updateFamilyMember(id: number, data: Partial<FamilyMember>): Promise<FamilyMember> {
  const client = getApiClient()
  return client.put(`/api/v1/family/${id}`, data)
}

export async function deleteFamilyMember(id: number): Promise<void> {
  const client = getApiClient()
  return client.delete(`/api/v1/family/${id}`)
}

// Medication hooks
export async function getMedications(familyMemberId: number): Promise<Medication[]> {
  const client = getApiClient()
  return client.get(`/api/v1/medications/family/${familyMemberId}`, { cache: true, cacheTtl: 30 })
}

export async function addMedication(data: Omit<Medication, 'id' | 'created_at'>): Promise<Medication> {
  const client = getApiClient()
  return client.post('/api/v1/medications', data)
}

export async function updateMedication(id: number, data: Partial<Medication>): Promise<Medication> {
  const client = getApiClient()
  return client.put(`/api/v1/medications/${id}`, data)
}

export async function deleteMedication(id: number): Promise<void> {
  const client = getApiClient()
  return client.delete(`/api/v1/medications/${id}`)
}

// Lab Results hooks
export async function getLabResults(familyMemberId: number): Promise<LabResult[]> {
  const client = getApiClient()
  return client.get(`/api/v1/lab-results/family/${familyMemberId}`, { cache: true, cacheTtl: 120 })
}

export async function getAbnormalLabResults(familyMemberId: number): Promise<LabResult[]> {
  const client = getApiClient()
  return client.get(`/api/v1/lab-results/family/${familyMemberId}/abnormal`, { cache: true, cacheTtl: 60 })
}

export async function addLabResult(data: Omit<LabResult, 'id' | 'created_at'>): Promise<LabResult> {
  const client = getApiClient()
  return client.post('/api/v1/lab-results', data)
}

// Appointments hooks
export async function getAppointments(): Promise<Appointment[]> {
  const client = getApiClient()
  return client.get('/api/v1/appointments/calendar', { cache: true, cacheTtl: 30 })
}

export async function addAppointment(data: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
  const client = getApiClient()
  return client.post('/api/v1/appointments', data)
}

export async function updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment> {
  const client = getApiClient()
  return client.put(`/api/v1/appointments/${id}`, data)
}

export async function deleteAppointment(id: number): Promise<void> {
  const client = getApiClient()
  return client.delete(`/api/v1/appointments/${id}`)
}

// AI Recommendations
export async function generateRecommendations(familyMemberId: number): Promise<any> {
  const client = getApiClient()
  return client.post('/api/v1/ai-recommendations/generate', { family_member_id: familyMemberId })
}

export async function getRecommendations(familyMemberId: number): Promise<any> {
  const client = getApiClient()
  return client.get(`/api/v1/ai-recommendations/family/${familyMemberId}`, { cache: true, cacheTtl: 120 })
}
