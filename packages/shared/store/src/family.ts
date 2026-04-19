import { create } from 'zustand'
import type { FamilyMember } from '@med-assistant/types'

interface FamilyState {
  members: FamilyMember[]
  selectedMemberId: number | null
  isLoading: boolean
  error: string | null
  lastFetch: string | null

  // Actions
  setMembers: (members: FamilyMember[]) => void
  addMember: (member: FamilyMember) => void
  updateMember: (id: number, member: Partial<FamilyMember>) => void
  removeMember: (id: number) => void
  selectMember: (id: number | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setLastFetch: (time: string) => void
}

export const useFamilyStore = create<FamilyState>((set) => ({
  members: [],
  selectedMemberId: null,
  isLoading: false,
  error: null,
  lastFetch: null,

  setMembers: (members) => set({ members, lastFetch: new Date().toISOString() }),

  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),

  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  removeMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
      selectedMemberId: state.selectedMemberId === id ? null : state.selectedMemberId,
    })),

  selectMember: (id) => set({ selectedMemberId: id }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setLastFetch: (time) => set({ lastFetch: time }),
}))
