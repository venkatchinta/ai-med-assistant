import { create } from 'zustand'
import { familyAPI } from '../api/family'

export const useFamilyStore = create((set, get) => ({
  members: [],
  selectedMember: null,
  isLoading: false,
  error: null,

  fetchMembers: async () => {
    set({ isLoading: true, error: null })
    try {
      const members = await familyAPI.getMembers()
      set({ members, isLoading: false })
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch family members', 
        isLoading: false 
      })
    }
  },

  addMember: async (memberData) => {
    set({ isLoading: true, error: null })
    try {
      const newMember = await familyAPI.createMember(memberData)
      set(state => ({ 
        members: [...state.members, newMember], 
        isLoading: false 
      }))
      return newMember
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to add family member', 
        isLoading: false 
      })
      return null
    }
  },

  updateMember: async (memberId, memberData) => {
    set({ isLoading: true, error: null })
    try {
      const updatedMember = await familyAPI.updateMember(memberId, memberData)
      set(state => ({
        members: state.members.map(m => m.id === memberId ? updatedMember : m),
        selectedMember: state.selectedMember?.id === memberId ? updatedMember : state.selectedMember,
        isLoading: false
      }))
      return updatedMember
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update family member', 
        isLoading: false 
      })
      return null
    }
  },

  deleteMember: async (memberId) => {
    set({ isLoading: true, error: null })
    try {
      await familyAPI.deleteMember(memberId)
      set(state => ({
        members: state.members.filter(m => m.id !== memberId),
        selectedMember: state.selectedMember?.id === memberId ? null : state.selectedMember,
        isLoading: false
      }))
      return true
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to delete family member', 
        isLoading: false 
      })
      return false
    }
  },

  selectMember: (member) => set({ selectedMember: member }),
  
  clearError: () => set({ error: null }),
}))
