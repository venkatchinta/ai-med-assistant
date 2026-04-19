import { create } from 'zustand'
import type { Medication } from '@med-assistant/types'

interface MedicationState {
  medications: Record<number, Medication[]> // keyed by familyMemberId
  isLoading: boolean
  error: string | null

  // Actions
  setMedications: (familyMemberId: number, medications: Medication[]) => void
  addMedication: (medication: Medication) => void
  updateMedication: (id: number, updates: Partial<Medication>) => void
  removeMedication: (id: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useMedicationStore = create<MedicationState>((set) => ({
  medications: {},
  isLoading: false,
  error: null,

  setMedications: (familyMemberId, medications) =>
    set((state) => ({
      medications: { ...state.medications, [familyMemberId]: medications },
    })),

  addMedication: (medication) =>
    set((state) => {
      const fmId = medication.family_member_id
      return {
        medications: {
          ...state.medications,
          [fmId]: [...(state.medications[fmId] || []), medication],
        },
      }
    }),

  updateMedication: (id, updates) =>
    set((state) => {
      const newMeds = { ...state.medications }
      for (const fmId in newMeds) {
        newMeds[parseInt(fmId)] = newMeds[parseInt(fmId)].map((m) =>
          m.id === id ? { ...m, ...updates } : m
        )
      }
      return { medications: newMeds }
    }),

  removeMedication: (id) =>
    set((state) => {
      const newMeds = { ...state.medications }
      for (const fmId in newMeds) {
        newMeds[parseInt(fmId)] = newMeds[parseInt(fmId)].filter((m) => m.id !== id)
      }
      return { medications: newMeds }
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}))
