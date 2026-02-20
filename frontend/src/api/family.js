import client from './client'

export const familyAPI = {
  getMembers: async () => {
    const response = await client.get('/family')
    return response.data
  },

  getMember: async (memberId) => {
    const response = await client.get(`/family/${memberId}`)
    return response.data
  },

  createMember: async (memberData) => {
    const response = await client.post('/family', memberData)
    return response.data
  },

  updateMember: async (memberId, memberData) => {
    const response = await client.put(`/family/${memberId}`, memberData)
    return response.data
  },

  deleteMember: async (memberId) => {
    await client.delete(`/family/${memberId}`)
  },
}
