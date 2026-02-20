import { useState, useEffect } from 'react'
import { useFamilyStore } from '../store/familyStore'
import { appointmentsAPI } from '../api/appointments'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2, Calendar, X, AlertCircle, Clock, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const appointmentTypes = ['checkup', 'follow_up', 'specialist', 'lab_work', 'imaging', 'procedure', 'vaccination', 'dental', 'vision']

export default function Appointments() {
  const { members, selectedMember, selectMember } = useFamilyStore()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingAppt, setEditingAppt] = useState(null)
  const [formData, setFormData] = useState({
    title: '', appointment_type: 'checkup',
    appointment_date: '', duration_minutes: 30,
    provider_name: '', facility_name: '', address: '',
    reason_for_visit: '', notes: '', reminder_enabled: true
  })

  useEffect(() => {
    if (members.length > 0 && !selectedMember) selectMember(members[0])
  }, [members])

  useEffect(() => {
    if (selectedMember) loadAppointments()
  }, [selectedMember])

  const loadAppointments = async () => {
    if (!selectedMember) return
    setLoading(true)
    try {
      const data = await appointmentsAPI.getByFamilyMember(selectedMember.id)
      setAppointments(data)
    } catch (error) {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (appt = null) => {
    if (appt) {
      setEditingAppt(appt)
      setFormData({
        title: appt.title, appointment_type: appt.appointment_type,
        appointment_date: appt.appointment_date ? format(new Date(appt.appointment_date), "yyyy-MM-dd'T'HH:mm") : '',
        duration_minutes: appt.duration_minutes,
        provider_name: appt.provider_name || '', facility_name: appt.facility_name || '',
        address: appt.address || '', reason_for_visit: appt.reason_for_visit || '',
        notes: appt.notes || '', reminder_enabled: appt.reminder_enabled
      })
    } else {
      setEditingAppt(null)
      setFormData({
        title: '', appointment_type: 'checkup', appointment_date: '',
        duration_minutes: 30, provider_name: '', facility_name: '',
        address: '', reason_for_visit: '', notes: '', reminder_enabled: true
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      ...formData, family_member_id: selectedMember.id,
      appointment_date: new Date(formData.appointment_date).toISOString()
    }
    try {
      if (editingAppt) {
        await appointmentsAPI.update(editingAppt.id, data)
        toast.success('Appointment updated')
      } else {
        await appointmentsAPI.create(data)
        toast.success('Appointment created')
      }
      setShowModal(false)
      loadAppointments()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save')
    }
  }

  const handleDelete = async (appt) => {
    if (window.confirm(`Delete "${appt.title}"?`)) {
      try {
        await appointmentsAPI.delete(appt.id)
        toast.success('Deleted')
        loadAppointments()
      } catch { toast.error('Failed to delete') }
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'confirmed': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Schedule and track medical appointments</p>
        </div>
        {selectedMember && (
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />Add Appointment
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
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No appointments for {selectedMember.first_name}</p>
          <button onClick={() => openModal()} className="btn-primary">Schedule Appointment</button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div key={appt.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{appt.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(appt.appointment_date), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span>{appt.duration_minutes} min</span>
                    </div>
                    {appt.provider_name && <p className="text-sm text-gray-600 mt-1">{appt.provider_name}</p>}
                    {appt.facility_name && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />{appt.facility_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(appt)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(appt)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <h2 className="text-lg font-semibold">{editingAppt ? 'Edit' : 'New'} Appointment</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input" placeholder="e.g., Annual Physical" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date & Time *</label>
                  <input type="datetime-local" value={formData.appointment_date} onChange={(e) => setFormData({...formData, appointment_date: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select value={formData.appointment_type} onChange={(e) => setFormData({...formData, appointment_type: e.target.value})} className="input">
                    {appointmentTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Provider</label>
                  <input type="text" value={formData.provider_name} onChange={(e) => setFormData({...formData, provider_name: e.target.value})} className="input" placeholder="Dr. Smith" />
                </div>
                <div>
                  <label className="label">Duration (min)</label>
                  <input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} className="input" min="5" />
                </div>
              </div>
              <div>
                <label className="label">Facility</label>
                <input type="text" value={formData.facility_name} onChange={(e) => setFormData({...formData, facility_name: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Reason for Visit</label>
                <textarea value={formData.reason_for_visit} onChange={(e) => setFormData({...formData, reason_for_visit: e.target.value})} className="input" rows="2" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editingAppt ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
