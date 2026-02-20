import client from './client'

export const authAPI = {
  signup: async (userData) => {
    const response = await client.post('/auth/signup', userData)
    return response.data
  },

  login: async (credentials) => {
    const response = await client.post('/auth/login', credentials)
    return response.data
  },

  refreshToken: async (refreshToken) => {
    const response = await client.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await client.get('/users/me')
    return response.data
  },

  updateProfile: async (userData) => {
    const response = await client.put('/users/me', userData)
    return response.data
  },
}
