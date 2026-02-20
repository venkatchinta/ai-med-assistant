import client from './client'

export const appointmentsAPI = {
  getByFamilyMember: async (familyMemberId, filters = {}) => {
    const response = await client.get(`/appointments/family/${familyMemberId}`, {
      params: filters
    })
    return response.data
  },

  getCalendar: async (startDate, endDate) => {
    const response = await client.get('/appointments/calendar', {
      params: { start_date: startDate, end_date: endDate }
    })
    return response.data
  },

  getReminders: async () => {
    const response = await client.get('/appointments/reminders')
    return response.data
  },

  get: async (appointmentId) => {
    const response = await client.get(`/appointments/${appointmentId}`)
    return response.data
  },

  create: async (appointmentData) => {
    const response = await client.post('/appointments', appointmentData)
    return response.data
  },

  update: async (appointmentId, appointmentData) => {
    const response = await client.put(`/appointments/${appointmentId}`, appointmentData)
    return response.data
  },

  delete: async (appointmentId) => {
    await client.delete(`/appointments/${appointmentId}`)
  },
}
