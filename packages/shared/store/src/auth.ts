import { create } from 'zustand'
import { setTokenInStorage, clearTokens, getTokenFromStorage } from '@med-assistant/utils'
import type { User, AuthTokens } from '@med-assistant/types'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setTokens: (tokens: AuthTokens) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  setTokens: (tokens) => {
    setTokenInStorage(tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    localStorage.setItem('device_id', tokens.device_id)
    localStorage.setItem('last_sync', tokens.sync_token)
    set({ tokens, isAuthenticated: true })
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  logout: () => {
    clearTokens()
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      error: null,
    })
  },

  hydrate: () => {
    const token = getTokenFromStorage()
    if (token) {
      set({ isAuthenticated: true })
    }
  },
}))
