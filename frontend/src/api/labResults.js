import client from './client'

export const labResultsAPI = {
  getByFamilyMember: async (familyMemberId, filters = {}) => {
    const response = await client.get(`/lab-results/family/${familyMemberId}`, {
      params: filters
    })
    return response.data
  },

  getAbnormal: async (familyMemberId) => {
    const response = await client.get(`/lab-results/family/${familyMemberId}/abnormal`)
    return response.data
  },

  getLatest: async (familyMemberId) => {
    const response = await client.get(`/lab-results/family/${familyMemberId}/latest`)
    return response.data
  },

  get: async (labResultId) => {
    const response = await client.get(`/lab-results/${labResultId}`)
    return response.data
  },

  create: async (labResultData) => {
    const response = await client.post('/lab-results', labResultData)
    return response.data
  },

  update: async (labResultId, labResultData) => {
    const response = await client.put(`/lab-results/${labResultId}`, labResultData)
    return response.data
  },

  delete: async (labResultId) => {
    await client.delete(`/lab-results/${labResultId}`)
  },
}
