import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFamilyStore } from '../store/familyStore'
import { appointmentsAPI } from '../api/appointments'
import { aiRecommendationsAPI } from '../api/aiRecommendations'
import { format } from 'date-fns'
import {
  Users,
  Calendar,
  Brain,
  AlertTriangle,
  ChevronRight,
  Pill,
  TestTube,
  Activity
} from 'lucide-react'

export default function Dashboard() {
  const { members } = useFamilyStore()
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [members])

  const loadDashboardData = async () => {
    try {
      // Load upcoming appointments
      const now = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)
      
      const appointments = await appointmentsAPI.getCalendar(
        now.toISOString(),
        endDate.toISOString()
      )
      setUpcomingAppointments(appointments.slice(0, 5))

      // Load recommendations for first family member
      if (members.length > 0) {
        const recs = await aiRecommendationsAPI.getByFamilyMember(members[0].id)
        setRecommendations(recs.slice(0, 3))
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Family Members', value: members.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Upcoming Appointments', value: upcomingAppointments.length, icon: Calendar, color: 'bg-green-500' },
    { label: 'Active Recommendations', value: recommendations.length, icon: Brain, color: 'bg-purple-500' },
  ]

  const quickActions = [
    { label: 'Add Medication', icon: Pill, path: '/medications', color: 'text-blue-600 bg-blue-50' },
    { label: 'Log Lab Result', icon: TestTube, path: '/lab-results', color: 'text-green-600 bg-green-50' },
    { label: 'Track Health', icon: Activity, path: '/health-tracking', color: 'text-orange-600 bg-orange-50' },
    { label: 'Get AI Insights', icon: Brain, path: '/ai-recommendations', color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your family health management center</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-600">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, path, color }) => (
            <Link
              key={label}
              to={path}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg ${color} hover:opacity-80 transition-opacity`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{apt.title}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(apt.appointment_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">AI Health Insights</h2>
            <Link to="/ai-recommendations" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No recommendations yet</p>
              <p className="text-sm text-gray-400">Add lab results to get personalized insights</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    {rec.priority === 'high' && (
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{rec.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Family Members Quick View */}
      {members.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Family Members</h2>
            <Link to="/family" className="text-sm text-primary-600 hover:text-primary-700">
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {members.map((member) => (
              <div key={member.id} className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-medium text-gray-600">
                    {member.first_name[0]}{member.last_name[0]}
                  </span>
                </div>
                <p className="font-medium text-gray-900 truncate">{member.first_name}</p>
                <p className="text-xs text-gray-500 capitalize">{member.relationship}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
