import { useState, useEffect, useRef } from 'react'
import { useFamilyStore } from '../store/familyStore'
import { aiRecommendationsAPI } from '../api/aiRecommendations'
import { format } from 'date-fns'
import { Brain, AlertTriangle, Check, X, Sparkles, AlertCircle, Pill, Salad, Send, Paperclip, Image, MessageSquare, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AIRecommendations() {
  const { members, selectedMember, selectMember } = useFamilyStore()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  
  // Chat state
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (members.length > 0 && !selectedMember) selectMember(members[0])
  }, [members])

  useEffect(() => {
    if (selectedMember) {
      loadRecommendations()
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm MedGemma, your AI health assistant. I can help analyze lab results, X-rays, and provide health insights for ${selectedMember.first_name}. How can I help you today?\n\nYou can also attach images of X-rays, lab reports, or other medical documents for analysis.`
      }])
    }
  }, [selectedMember])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadRecommendations = async () => {
    if (!selectedMember) return
    setLoading(true)
    try {
      const data = await aiRecommendationsAPI.getByFamilyMember(selectedMember.id)
      setRecommendations(data)
    } catch (error) {
      toast.error('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = async () => {
    if (!selectedMember) return
    setGenerating(true)
    try {
      const newRecs = await aiRecommendationsAPI.generate({
        family_member_id: selectedMember.id,
        include_supplements: true,
        include_dietary: true,
        include_lifestyle: true
      })
      toast.success(`Generated ${newRecs.length} recommendations`)
      loadRecommendations()
    } catch (error) {
      toast.error('Failed to generate recommendations. Make sure you have lab results added.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAcknowledge = async (rec) => {
    try {
      await aiRecommendationsAPI.acknowledge(rec.id, { is_acknowledged: true })
      toast.success('Recommendation acknowledged')
      loadRecommendations()
    } catch (error) {
      toast.error('Failed to acknowledge')
    }
  }

  const handleDismiss = async (rec) => {
    try {
      await aiRecommendationsAPI.dismiss(rec.id)
      toast.success('Recommendation dismissed')
      loadRecommendations()
    } catch (error) {
      toast.error('Failed to dismiss')
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return
    if (!selectedMember) {
      toast.error('Please select a family member first')
      return
    }

    const userMessage = {
      role: 'user',
      content: inputMessage,
      hasImage: !!selectedImage
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSending(true)

    try {
      const response = await aiRecommendationsAPI.chatWithUpload(
        selectedMember.id,
        inputMessage || 'Please analyze this image',
        selectedImage
      )
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response,
        model: response.model_used,
        hasImageAnalysis: response.has_image_analysis
      }])
      removeImage()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to get response')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        isError: true
      }])
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-amber-500 bg-amber-50'
      case 'low': return 'border-l-blue-500 bg-blue-50'
      default: return 'border-l-gray-300 bg-gray-50'
    }
  }

  const getTypeIcon = (type) => {
    switch(type) {
      case 'supplement': return <Pill className="w-5 h-5 text-blue-600" />
      case 'dietary': return <Salad className="w-5 h-5 text-green-600" />
      default: return <Brain className="w-5 h-5 text-purple-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Health Insights</h1>
          <p className="text-gray-600">Chat with MedGemma AI or view personalized recommendations</p>
        </div>
      </div>

      {members.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {members.map((member) => (
            <button key={member.id} onClick={() => selectMember(member)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedMember?.id === member.id ? 'bg-primary-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}>{member.first_name}</button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'chat' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <MessageSquare className="w-4 h-4" /> Chat with AI
        </button>
        <button onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'recommendations' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <FileText className="w-4 h-4" /> Recommendations
        </button>
      </div>

      <div className="card bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Medical Disclaimer</p>
            <p className="text-sm text-amber-700">AI-generated suggestions are for informational purposes only. Always consult your healthcare provider.</p>
          </div>
        </div>
      </div>

      {!selectedMember ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Add a family member first</p>
        </div>
      ) : activeTab === 'chat' ? (
        /* Chat Interface */
        <div className="card p-0 flex flex-col" style={{ height: '500px' }}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-primary-600 text-white' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.hasImage && (
                    <div className="flex items-center gap-1 text-xs mb-2 opacity-75">
                      <Image className="w-3 h-3" /> Image attached
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  {msg.model && (
                    <p className="text-xs mt-2 opacity-60">via {msg.model}</p>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  <span className="text-sm text-gray-600">MedGemma is thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="px-4 py-2 border-t bg-gray-50">
              <div className="flex items-center gap-2">
                <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{selectedImage?.name}</p>
                  <p className="text-xs text-gray-400">{(selectedImage?.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={removeImage} className="p-1 hover:bg-gray-200 rounded">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} 
                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg" title="Attach image (X-ray, lab result, etc.)">
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about health, lab results, or attach an X-ray for analysis..."
                className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={1}
                disabled={sending}
              />
              <button onClick={sendMessage} disabled={sending || (!inputMessage.trim() && !selectedImage)}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Supports X-rays, lab reports, and medical documents for AI analysis</p>
          </div>
        </div>
      ) : (
        /* Recommendations Tab */
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={generateRecommendations} disabled={generating} className="btn-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {generating ? 'Analyzing...' : 'Generate Insights'}
            </button>
          </div>
          
          {loading ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">Loading recommendations...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="card text-center py-12">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
              <p className="text-gray-500 mb-4">Add lab results and click "Generate Insights"</p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec.id} className={`card border-l-4 ${getPriorityColor(rec.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      {getTypeIcon(rec.recommendation_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                        {rec.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">High Priority</span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{rec.description}</p>
                      
                      {rec.supplement_name && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Suggested: </span>
                          <span className="text-sm text-gray-600">{rec.supplement_name}</span>
                          {rec.suggested_dosage && <span className="text-sm text-gray-500"> - {rec.suggested_dosage}</span>}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>{format(new Date(rec.created_at), 'MMM d, yyyy')}</span>
                        {rec.model_used && <span>via {rec.model_used}</span>}
                      </div>
                    </div>
                  </div>

                  {!rec.is_acknowledged ? (
                    <div className="flex gap-1 ml-4">
                      <button onClick={() => handleAcknowledge(rec)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Acknowledge">
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDismiss(rec)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Dismiss">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded flex items-center gap-1">
                      <Check className="w-3 h-3" /> Acknowledged
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
