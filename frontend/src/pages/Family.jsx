import { useState } from 'react'
import { useFamilyStore } from '../store/familyStore'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2, User, X } from 'lucide-react'
import toast from 'react-hot-toast'

const relationshipOptions = ['self', 'spouse', 'child', 'parent', 'sibling', 'other']
const genderOptions = ['male', 'female', 'other', 'prefer_not_to_say']

export default function Family() {
  const { members, addMember, updateMember, deleteMember, isLoading } = useFamilyStore()
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    relationship_type: 'self',
    phone_number: '',
    email: '',
    blood_type: '',
    primary_physician: '',
    physician_phone: '',
  })

  const openModal = (member = null) => {
    if (member) {
      setEditingMember(member)
      setFormData({
        first_name: member.first_name,
        last_name: member.last_name,
        date_of_birth: member.date_of_birth ? format(new Date(member.date_of_birth), 'yyyy-MM-dd') : '',
        gender: member.gender || '',
        relationship_type: member.relationship_type,
        phone_number: member.phone_number || '',
        email: member.email || '',
        blood_type: member.blood_type || '',
        primary_physician: member.primary_physician || '',
        physician_phone: member.physician_phone || '',
      })
    } else {
      setEditingMember(null)
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        relationship_type: 'self',
        phone_number: '',
        email: '',
        blood_type: '',
        primary_physician: '',
        physician_phone: '',
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingMember(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const data = {
      ...formData,
      date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null,
      gender: formData.gender || null,
      phone_number: formData.phone_number || null,
      email: formData.email || null,
      blood_type: formData.blood_type || null,
      primary_physician: formData.primary_physician || null,
      physician_phone: formData.physician_phone || null,
    }

    if (editingMember) {
      const result = await updateMember(editingMember.id, data)
      if (result) {
        toast.success('Family member updated')
        closeModal()
      }
    } else {
      const result = await addMember(data)
      if (result) {
        toast.success('Family member added')
        closeModal()
      }
    }
  }

  const handleDelete = async (member) => {
    if (window.confirm(`Are you sure you want to remove ${member.first_name}? This will delete all their health data.`)) {
      const success = await deleteMember(member.id)
      if (success) {
        toast.success('Family member removed')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Members</h1>
          <p className="text-gray-600">Manage your family's health profiles (max 6 members)</p>
        </div>
        {members.length < 6 && (
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Member
          </button>
        )}
      </div>

      {members.length === 0 ? (
        <div className="card text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No family members yet</h3>
          <p className="text-gray-500 mb-4">Add your first family member to start tracking health data</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add Family Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-primary-700">
                      {member.first_name[0]}{member.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{member.relationship_type}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(member)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {member.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date of Birth</span>
                    <span className="text-gray-900">
                      {format(new Date(member.date_of_birth), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {member.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gender</span>
                    <span className="text-gray-900 capitalize">{member.gender.replace('_', ' ')}</span>
                  </div>
                )}
                {member.blood_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Blood Type</span>
                    <span className="text-gray-900">{member.blood_type}</span>
                  </div>
                )}
                {member.primary_physician && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Primary Doctor</span>
                    <span className="text-gray-900">{member.primary_physician}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Relationship *</label>
                  <select
                    value={formData.relationship_type}
                    onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value })}
                    className="input"
                    required
                  >
                    {relationshipOptions.map((rel) => (
                      <option key={rel} value={rel} className="capitalize">
                        {rel.charAt(0).toUpperCase() + rel.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input"
                  >
                    <option value="">Select...</option>
                    {genderOptions.map((g) => (
                      <option key={g} value={g}>
                        {g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Blood Type</label>
                  <input
                    type="text"
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="input"
                    placeholder="e.g., A+"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Primary Physician</label>
                  <input
                    type="text"
                    value={formData.primary_physician}
                    onChange={(e) => setFormData({ ...formData, primary_physician: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Physician Phone</label>
                  <input
                    type="tel"
                    value={formData.physician_phone}
                    onChange={(e) => setFormData({ ...formData, physician_phone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                  {isLoading ? 'Saving...' : editingMember ? 'Update' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
