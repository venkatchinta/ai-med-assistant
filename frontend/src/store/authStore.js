import { create } from 'zustand'
import { authAPI } from '../api/auth'

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const tokens = await authAPI.login(credentials)
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      
      const user = await authAPI.getCurrentUser()
      set({ user, isAuthenticated: true, isLoading: false })
      return true
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Login failed', 
        isLoading: false 
      })
      return false
    }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null })
    try {
      await authAPI.signup(userData)
      set({ isLoading: false })
      return true
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Signup failed', 
        isLoading: false 
      })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    if (!get().isAuthenticated) return
    
    set({ isLoading: true })
    try {
      const user = await authAPI.getCurrentUser()
      set({ user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      get().logout()
    }
  },

  clearError: () => set({ error: null }),
}))
