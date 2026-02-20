import { useState, useEffect } from 'react'
import { useFamilyStore } from '../store/familyStore'
import { medicationsAPI } from '../api/medications'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2, Pill, X, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const medicationTypes = ['prescription', 'otc', 'supplement', 'vitamin', 'herbal']
const frequencyTypes = ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'weekly', 'as_needed']

export default function Medications() {
  const { members, selectedMember, selectMember } = useFamilyStore()
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingMed, setEditingMed] = useState(null)
  const [formData, setFormData] = useState({
    name: '', generic_name: '', medication_type: 'prescription', dosage: '',
    frequency: 'once_daily', time_of_day: '', with_food: false,
    prescribing_doctor: '', start_date: format(new Date(), 'yyyy-MM-dd'), purpose: '',
  })

  useEffect(() => {
    if (members.length > 0 && !selectedMember) selectMember(members[0])
  }, [members])

  useEffect(() => {
    if (selectedMember) loadMedications()
  }, [selectedMember])

  const loadMedications = async () => {
    if (!selectedMember) return
    setLoading(true)
    try {
      const data = await medicationsAPI.getByFamilyMember(selectedMember.id)
      setMedications(data)
    } catch (error) {
      toast.error('Failed to load medications')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (med = null) => {
    if (med) {
      setEditingMed(med)
      setFormData({
        name: med.name, generic_name: med.generic_name || '',
        medication_type: med.medication_type, dosage: med.dosage,
        frequency: med.frequency, time_of_day: med.time_of_day || '',
        with_food: med.with_food, prescribing_doctor: med.prescribing_doctor || '',
        start_date: med.start_date ? format(new Date(med.start_date), 'yyyy-MM-dd') : '',
        purpose: med.purpose || '',
      })
    } else {
      setEditingMed(null)
      setFormData({
        name: '', generic_name: '', medication_type: 'prescription', dosage: '',
        frequency: 'once_daily', time_of_day: '', with_food: false,
        prescribing_doctor: '', start_date: format(new Date(), 'yyyy-MM-dd'), purpose: '',
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = { ...formData, family_member_id: selectedMember.id,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null }
    try {
      if (editingMed) {
        await medicationsAPI.update(editingMed.id, data)
        toast.success('Medication updated')
      } else {
        await medicationsAPI.create(data)
        toast.success('Medication added')
      }
      setShowModal(false)
      loadMedications()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save')
    }
  }

  const handleDelete = async (med) => {
    if (window.confirm(`Delete ${med.name}?`)) {
      try {
        await medicationsAPI.delete(med.id)
        toast.success('Deleted')
        loadMedications()
      } catch { toast.error('Failed to delete') }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
          <p className="text-gray-600">Track prescriptions, supplements, and vitamins</p>
        </div>
        {selectedMember && (
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />Add Medication
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
      ) : medications.length === 0 ? (
        <div className="card text-center py-12">
          <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No medications for {selectedMember.first_name}</p>
          <button onClick={() => openModal()} className="btn-primary">Add First Medication</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medications.map((med) => (
            <div key={med.id} className={`card ${!med.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Pill className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{med.name}</h3>
                    <p className="text-sm text-gray-500">{med.dosage}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(med)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(med)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{med.frequency.replace(/_/g, ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingMed ? 'Edit' : 'Add'} Medication</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Dosage *</label>
                  <input type="text" value={formData.dosage} onChange={(e) => setFormData({...formData, dosage: e.target.value})} className="input" placeholder="e.g., 10mg" required />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select value={formData.medication_type} onChange={(e) => setFormData({...formData, medication_type: e.target.value})} className="input">
                    {medicationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Frequency</label>
                  <select value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})} className="input">
                    {frequencyTypes.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Purpose</label>
                <input type="text" value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} className="input" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editingMed ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
