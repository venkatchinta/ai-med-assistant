import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Family from './pages/Family'
import Medications from './pages/Medications'
import LabResults from './pages/LabResults'
import Appointments from './pages/Appointments'
import HealthTracking from './pages/HealthTracking'
import AIRecommendations from './pages/AIRecommendations'
import PatientPortal from './pages/PatientPortal'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="family" element={<Family />} />
        <Route path="medications" element={<Medications />} />
        <Route path="lab-results" element={<LabResults />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="health-tracking" element={<HealthTracking />} />
        <Route path="ai-recommendations" element={<AIRecommendations />} />
        <Route path="patient-portal" element={<PatientPortal />} />
      </Route>
    </Routes>
  )
}

export default App
