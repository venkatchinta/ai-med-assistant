import client from './client'

export const patientPortalAPI = {
  getProviders: async () => {
    const response = await client.get('/patient-portal/providers')
    return response.data
  },

  connect: async (connectionData) => {
    const response = await client.post('/patient-portal/connect', connectionData)
    return response.data
  },

  getConnections: async () => {
    const response = await client.get('/patient-portal/connections')
    return response.data
  },

  sync: async (providerId) => {
    const response = await client.post(`/patient-portal/sync/${providerId}`)
    return response.data
  },

  disconnect: async (providerId) => {
    await client.delete(`/patient-portal/disconnect/${providerId}`)
  },

  previewImport: async (providerId) => {
    const response = await client.get(`/patient-portal/import-preview/${providerId}`)
    return response.data
  },
}
