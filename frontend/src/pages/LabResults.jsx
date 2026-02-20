import { useState, useEffect } from 'react'
import { useFamilyStore } from '../store/familyStore'
import { labResultsAPI } from '../api/labResults'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2, TestTube, X, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'

const categories = ['blood', 'urine', 'imaging', 'pathology', 'genetic', 'other']

export default function LabResults() {
  const { members, selectedMember, selectMember } = useFamilyStore()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingResult, setEditingResult] = useState(null)
  const [formData, setFormData] = useState({
    test_name: '', category: 'blood', value: '', unit: '',
    reference_range_low: '', reference_range_high: '',
    test_date: format(new Date(), 'yyyy-MM-dd'), ordering_physician: '', lab_name: '', notes: ''
  })

  useEffect(() => {
    if (members.length > 0 && !selectedMember) selectMember(members[0])
  }, [members])

  useEffect(() => {
    if (selectedMember) loadResults()
  }, [selectedMember])

  const loadResults = async () => {
    if (!selectedMember) return
    setLoading(true)
    try {
      const data = await labResultsAPI.getByFamilyMember(selectedMember.id)
      setResults(data)
    } catch (error) {
      toast.error('Failed to load lab results')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (result = null) => {
    if (result) {
      setEditingResult(result)
      setFormData({
        test_name: result.test_name, category: result.category,
        value: result.value || '', unit: result.unit || '',
        reference_range_low: result.reference_range_low || '',
        reference_range_high: result.reference_range_high || '',
        test_date: result.test_date ? format(new Date(result.test_date), 'yyyy-MM-dd') : '',
        ordering_physician: result.ordering_physician || '',
        lab_name: result.lab_name || '', notes: result.notes || ''
      })
    } else {
      setEditingResult(null)
      setFormData({
        test_name: '', category: 'blood', value: '', unit: '',
        reference_range_low: '', reference_range_high: '',
        test_date: format(new Date(), 'yyyy-MM-dd'), ordering_physician: '', lab_name: '', notes: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      ...formData, family_member_id: selectedMember.id,
      value: formData.value ? parseFloat(formData.value) : null,
      reference_range_low: formData.reference_range_low ? parseFloat(formData.reference_range_low) : null,
      reference_range_high: formData.reference_range_high ? parseFloat(formData.reference_range_high) : null,
      test_date: new Date(formData.test_date).toISOString()
    }
    try {
      if (editingResult) {
        await labResultsAPI.update(editingResult.id, data)
        toast.success('Lab result updated')
      } else {
        await labResultsAPI.create(data)
        toast.success('Lab result added')
      }
      setShowModal(false)
      loadResults()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save')
    }
  }

  const handleDelete = async (result) => {
    if (window.confirm(`Delete ${result.test_name}?`)) {
      try {
        await labResultsAPI.delete(result.id)
        toast.success('Deleted')
        loadResults()
      } catch { toast.error('Failed to delete') }
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'low': case 'critical_low': return 'text-blue-600 bg-blue-50'
      case 'high': case 'critical_high': return 'text-red-600 bg-red-50'
      case 'normal': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status) => {
    if (status === 'low' || status === 'critical_low') return <TrendingDown className="w-4 h-4" />
    if (status === 'high' || status === 'critical_high') return <TrendingUp className="w-4 h-4" />
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Results</h1>
          <p className="text-gray-600">Track and monitor test results</p>
        </div>
        {selectedMember && (
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />Add Result
          </button>
        )}
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

      {!selectedMember ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Add a family member first</p>
        </div>
      ) : results.length === 0 ? (
        <div className="card text-center py-12">
          <TestTube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No lab results for {selectedMember.first_name}</p>
          <button onClick={() => openModal()} className="btn-primary">Add First Result</button>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result) => (
            <div key={result.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TestTube className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{result.test_name}</h3>
                    <p className="text-sm text-gray-500">{format(new Date(result.test_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{result.value} {result.unit}</span>
                      {result.status && result.status !== 'normal' && result.status !== 'pending' && (
                        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(result.status)}`}>
                          {getStatusIcon(result.status)}
                          {result.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {result.reference_range_low && result.reference_range_high && (
                      <p className="text-xs text-gray-500">Ref: {result.reference_range_low} - {result.reference_range_high}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(result)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(result)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingResult ? 'Edit' : 'Add'} Lab Result</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="label">Test Name *</label>
                <input type="text" value={formData.test_name} onChange={(e) => setFormData({...formData, test_name: e.target.value})} className="input" placeholder="e.g., Vitamin B12" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Value</label>
                  <input type="number" step="any" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="input" placeholder="e.g., pg/mL" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Reference Low</label>
                  <input type="number" step="any" value={formData.reference_range_low} onChange={(e) => setFormData({...formData, reference_range_low: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="label">Reference High</label>
                  <input type="number" step="any" value={formData.reference_range_high} onChange={(e) => setFormData({...formData, reference_range_high: e.target.value})} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Test Date *</label>
                  <input type="date" value={formData.test_date} onChange={(e) => setFormData({...formData, test_date: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="input">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Lab Name</label>
                <input type="text" value={formData.lab_name} onChange={(e) => setFormData({...formData, lab_name: e.target.value})} className="input" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editingResult ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
