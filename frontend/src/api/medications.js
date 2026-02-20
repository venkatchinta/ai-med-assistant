import client from './client'

export const medicationsAPI = {
  getAll: async () => {
    const response = await client.get('/medications/all')
    return response.data
  },

  getByFamilyMember: async (familyMemberId, activeOnly = false) => {
    const response = await client.get(`/medications/family/${familyMemberId}`, {
      params: { active_only: activeOnly }
    })
    return response.data
  },

  get: async (medicationId) => {
    const response = await client.get(`/medications/${medicationId}`)
    return response.data
  },

  create: async (medicationData) => {
    const response = await client.post('/medications', medicationData)
    return response.data
  },

  update: async (medicationId, medicationData) => {
    const response = await client.put(`/medications/${medicationId}`, medicationData)
    return response.data
  },

  delete: async (medicationId) => {
    await client.delete(`/medications/${medicationId}`)
  },
}
