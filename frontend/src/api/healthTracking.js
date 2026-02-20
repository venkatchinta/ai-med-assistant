import client from './client'

export const healthTrackingAPI = {
  // Health Logs
  getHealthLogs: async (familyMemberId, filters = {}) => {
    const response = await client.get(`/health-tracking/logs/family/${familyMemberId}`, {
      params: filters
    })
    return response.data
  },

  getTodayLog: async (familyMemberId) => {
    const response = await client.get(`/health-tracking/logs/family/${familyMemberId}/today`)
    return response.data
  },

  getHealthLog: async (logId) => {
    const response = await client.get(`/health-tracking/logs/${logId}`)
    return response.data
  },

  createHealthLog: async (logData) => {
    const response = await client.post('/health-tracking/logs', logData)
    return response.data
  },

  updateHealthLog: async (logId, logData) => {
    const response = await client.put(`/health-tracking/logs/${logId}`, logData)
    return response.data
  },

  // Diet Entries
  getDietEntries: async (familyMemberId, filters = {}) => {
    const response = await client.get(`/health-tracking/diet/family/${familyMemberId}`, {
      params: filters
    })
    return response.data
  },

  getNutritionSummary: async (familyMemberId, targetDate) => {
    const response = await client.get(`/health-tracking/diet/family/${familyMemberId}/summary`, {
      params: { target_date: targetDate }
    })
    return response.data
  },

  getDietEntry: async (entryId) => {
    const response = await client.get(`/health-tracking/diet/${entryId}`)
    return response.data
  },

  createDietEntry: async (entryData) => {
    const response = await client.post('/health-tracking/diet', entryData)
    return response.data
  },

  updateDietEntry: async (entryId, entryData) => {
    const response = await client.put(`/health-tracking/diet/${entryId}`, entryData)
    return response.data
  },

  deleteDietEntry: async (entryId) => {
    await client.delete(`/health-tracking/diet/${entryId}`)
  },
}
