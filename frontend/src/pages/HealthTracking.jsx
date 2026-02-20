import { useState, useEffect } from 'react'
import { useFamilyStore } from '../store/familyStore'
import { healthTrackingAPI } from '../api/healthTracking'
import { format } from 'date-fns'
import { Plus, Activity, X, AlertCircle, Heart, Moon, Droplets, Utensils } from 'lucide-react'
import toast from 'react-hot-toast'

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'supplement']
const moodOptions = ['excellent', 'good', 'okay', 'poor', 'bad']

export default function HealthTracking() {
  const { members, selectedMember, selectMember } = useFamilyStore()
  const [healthLogs, setHealthLogs] = useState([])
  const [dietEntries, setDietEntries] = useState([])
  const [activeTab, setActiveTab] = useState('vitals')
  const [loading, setLoading] = useState(false)
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [showDietModal, setShowDietModal] = useState(false)
  const [vitalsForm, setVitalsForm] = useState({
    weight: '', blood_pressure_systolic: '', blood_pressure_diastolic: '',
    heart_rate: '', blood_glucose: '', sleep_hours: '', steps: '',
    mood: '', water_intake_oz: '', notes: ''
  })
  const [dietForm, setDietForm] = useState({
    meal_type: 'breakfast', food_name: '', portion_size: '',
    calories: '', protein_g: '', carbs_g: '', notes: ''
  })

  useEffect(() => {
    if (members.length > 0 && !selectedMember) selectMember(members[0])
  }, [members])

  useEffect(() => {
    if (selectedMember) loadData()
  }, [selectedMember])

  const loadData = async () => {
    if (!selectedMember) return
    setLoading(true)
    try {
      const [logs, diet] = await Promise.all([
        healthTrackingAPI.getHealthLogs(selectedMember.id),
        healthTrackingAPI.getDietEntries(selectedMember.id)
      ])
      setHealthLogs(logs)
      setDietEntries(diet)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleVitalsSubmit = async (e) => {
    e.preventDefault()
    const data = {
      family_member_id: selectedMember.id,
      log_date: new Date().toISOString(),
      weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : null,
      blood_pressure_systolic: vitalsForm.blood_pressure_systolic ? parseInt(vitalsForm.blood_pressure_systolic) : null,
      blood_pressure_diastolic: vitalsForm.blood_pressure_diastolic ? parseInt(vitalsForm.blood_pressure_diastolic) : null,
      heart_rate: vitalsForm.heart_rate ? parseInt(vitalsForm.heart_rate) : null,
      blood_glucose: vitalsForm.blood_glucose ? parseFloat(vitalsForm.blood_glucose) : null,
      sleep_hours: vitalsForm.sleep_hours ? parseFloat(vitalsForm.sleep_hours) : null,
      steps: vitalsForm.steps ? parseInt(vitalsForm.steps) : null,
      mood: vitalsForm.mood || null,
      water_intake_oz: vitalsForm.water_intake_oz ? parseFloat(vitalsForm.water_intake_oz) : null,
      notes: vitalsForm.notes || null
    }
    try {
      await healthTrackingAPI.createHealthLog(data)
      toast.success('Health log saved')
      setShowVitalsModal(false)
      setVitalsForm({ weight: '', blood_pressure_systolic: '', blood_pressure_diastolic: '',
        heart_rate: '', blood_glucose: '', sleep_hours: '', steps: '', mood: '', water_intake_oz: '', notes: '' })
      loadData()
    } catch (error) {
      toast.error('Failed to save')
    }
  }

  const handleDietSubmit = async (e) => {
    e.preventDefault()
    const data = {
      family_member_id: selectedMember.id,
      entry_date: new Date().toISOString(),
      meal_type: dietForm.meal_type,
      food_name: dietForm.food_name,
      portion_size: dietForm.portion_size || null,
      calories: dietForm.calories ? parseInt(dietForm.calories) : null,
      protein_g: dietForm.protein_g ? parseFloat(dietForm.protein_g) : null,
      carbs_g: dietForm.carbs_g ? parseFloat(dietForm.carbs_g) : null,
      notes: dietForm.notes || null
    }
    try {
      await healthTrackingAPI.createDietEntry(data)
      toast.success('Diet entry saved')
      setShowDietModal(false)
      setDietForm({ meal_type: 'breakfast', food_name: '', portion_size: '', calories: '', protein_g: '', carbs_g: '', notes: '' })
      loadData()
    } catch (error) {
      toast.error('Failed to save')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Tracking</h1>
          <p className="text-gray-600">Log daily vitals, diet, and wellness</p>
        </div>
        {selectedMember && (
          <div className="flex gap-2">
            <button onClick={() => setShowVitalsModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />Log Vitals
            </button>
            <button onClick={() => setShowDietModal(true)} className="btn-secondary flex items-center gap-2">
              <Plus className="w-5 h-5" />Log Meal
            </button>
          </div>
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
      ) : (
        <>
          <div className="flex gap-2 border-b">
            <button onClick={() => setActiveTab('vitals')}
              className={`px-4 py-2 border-b-2 ${activeTab === 'vitals' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
              Vitals & Wellness
            </button>
            <button onClick={() => setActiveTab('diet')}
              className={`px-4 py-2 border-b-2 ${activeTab === 'diet' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
              Diet & Nutrition
            </button>
          </div>

          {activeTab === 'vitals' && (
            healthLogs.length === 0 ? (
              <div className="card text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No health logs yet</p>
                <button onClick={() => setShowVitalsModal(true)} className="btn-primary">Log Today's Vitals</button>
              </div>
            ) : (
              <div className="space-y-3">
                {healthLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{format(new Date(log.log_date), 'MMM d, yyyy')}</span>
                      {log.mood && <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm">{log.mood}</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {log.weight && <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-gray-400" /><span>{log.weight} lbs</span></div>}
                      {log.blood_pressure_systolic && <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-400" /><span>{log.blood_pressure_systolic}/{log.blood_pressure_diastolic}</span></div>}
                      {log.heart_rate && <div><span className="text-gray-500">HR:</span> {log.heart_rate} bpm</div>}
                      {log.sleep_hours && <div className="flex items-center gap-2"><Moon className="w-4 h-4 text-indigo-400" /><span>{log.sleep_hours}h sleep</span></div>}
                      {log.steps && <div><span className="text-gray-500">Steps:</span> {log.steps.toLocaleString()}</div>}
                      {log.water_intake_oz && <div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-400" /><span>{log.water_intake_oz} oz</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'diet' && (
            dietEntries.length === 0 ? (
              <div className="card text-center py-12">
                <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No diet entries yet</p>
                <button onClick={() => setShowDietModal(true)} className="btn-primary">Log a Meal</button>
              </div>
            ) : (
              <div className="space-y-3">
                {dietEntries.slice(0, 20).map((entry) => (
                  <div key={entry.id} className="card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{entry.food_name}</h4>
                        <p className="text-sm text-gray-500">{entry.meal_type} • {format(new Date(entry.entry_date), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                    {entry.calories && <span className="text-sm font-medium">{entry.calories} cal</span>}
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {showVitalsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Log Health Vitals</h2>
              <button onClick={() => setShowVitalsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleVitalsSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Weight (lbs)</label><input type="number" step="0.1" value={vitalsForm.weight} onChange={(e) => setVitalsForm({...vitalsForm, weight: e.target.value})} className="input" /></div>
                <div><label className="label">Heart Rate (bpm)</label><input type="number" value={vitalsForm.heart_rate} onChange={(e) => setVitalsForm({...vitalsForm, heart_rate: e.target.value})} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">BP Systolic</label><input type="number" value={vitalsForm.blood_pressure_systolic} onChange={(e) => setVitalsForm({...vitalsForm, blood_pressure_systolic: e.target.value})} className="input" /></div>
                <div><label className="label">BP Diastolic</label><input type="number" value={vitalsForm.blood_pressure_diastolic} onChange={(e) => setVitalsForm({...vitalsForm, blood_pressure_diastolic: e.target.value})} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Sleep (hours)</label><input type="number" step="0.5" value={vitalsForm.sleep_hours} onChange={(e) => setVitalsForm({...vitalsForm, sleep_hours: e.target.value})} className="input" /></div>
                <div><label className="label">Steps</label><input type="number" value={vitalsForm.steps} onChange={(e) => setVitalsForm({...vitalsForm, steps: e.target.value})} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Water (oz)</label><input type="number" value={vitalsForm.water_intake_oz} onChange={(e) => setVitalsForm({...vitalsForm, water_intake_oz: e.target.value})} className="input" /></div>
                <div><label className="label">Mood</label><select value={vitalsForm.mood} onChange={(e) => setVitalsForm({...vitalsForm, mood: e.target.value})} className="input"><option value="">Select...</option>{moodOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowVitalsModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDietModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Log Meal</h2>
              <button onClick={() => setShowDietModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleDietSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Meal Type</label><select value={dietForm.meal_type} onChange={(e) => setDietForm({...dietForm, meal_type: e.target.value})} className="input">{mealTypes.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div><label className="label">Calories</label><input type="number" value={dietForm.calories} onChange={(e) => setDietForm({...dietForm, calories: e.target.value})} className="input" /></div>
              </div>
              <div><label className="label">Food *</label><input type="text" value={dietForm.food_name} onChange={(e) => setDietForm({...dietForm, food_name: e.target.value})} className="input" required /></div>
              <div><label className="label">Portion Size</label><input type="text" value={dietForm.portion_size} onChange={(e) => setDietForm({...dietForm, portion_size: e.target.value})} className="input" placeholder="e.g., 1 cup" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowDietModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
