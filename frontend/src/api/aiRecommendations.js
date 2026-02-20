import client from './client'

export const aiRecommendationsAPI = {
  generate: async (requestData) => {
    const response = await client.post('/ai-recommendations/generate', requestData)
    return response.data
  },

  getByFamilyMember: async (familyMemberId, activeOnly = true) => {
    const response = await client.get(`/ai-recommendations/family/${familyMemberId}`, {
      params: { active_only: activeOnly }
    })
    return response.data
  },

  acknowledge: async (recommendationId, feedback) => {
    const response = await client.post(`/ai-recommendations/${recommendationId}/acknowledge`, feedback)
    return response.data
  },

  dismiss: async (recommendationId) => {
    await client.post(`/ai-recommendations/${recommendationId}/dismiss`)
  },

  chat: async (familyMemberId, message, imageData = null, conversationHistory = null) => {
    const response = await client.post('/ai-recommendations/chat', {
      family_member_id: familyMemberId,
      message,
      image_data: imageData,
      conversation_history: conversationHistory
    })
    return response.data
  },

  chatWithUpload: async (familyMemberId, message, imageFile = null) => {
    const formData = new FormData()
    formData.append('family_member_id', familyMemberId)
    formData.append('message', message)
    if (imageFile) {
      formData.append('image', imageFile)
    }
    const response = await client.post('/ai-recommendations/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
}
