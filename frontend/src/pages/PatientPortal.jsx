import { useState, useEffect } from 'react'
import { patientPortalAPI } from '../api/patientPortal'
import { Link2, Check, RefreshCw, X, AlertCircle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PatientPortal() {
  const [providers, setProviders] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [syncing, setSyncing] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [providerList, connectionList] = await Promise.all([
        patientPortalAPI.getProviders(),
        patientPortalAPI.getConnections()
      ])
      setProviders(providerList)
      setConnections(connectionList)
    } catch (error) {
      toast.error('Failed to load portal data')
    } finally {
      setLoading(false)
    }
  }

  const openConnectModal = (provider) => {
    setSelectedProvider(provider)
    setCredentials({ username: '', password: '' })
    setShowConnectModal(true)
  }

  const handleConnect = async (e) => {
    e.preventDefault()
    try {
      await patientPortalAPI.connect({
        provider_id: selectedProvider.id,
        username: credentials.username,
        password: credentials.password
      })
      toast.success(`Connected to ${selectedProvider.name}`)
      setShowConnectModal(false)
      loadData()
    } catch (error) {
      toast.error('Connection failed')
    }
  }

  const handleSync = async (providerId) => {
    setSyncing(providerId)
    try {
      const result = await patientPortalAPI.sync(providerId)
      toast.success(`Synced ${result.records_synced.medications} medications, ${result.records_synced.lab_results} lab results`)
      loadData()
    } catch (error) {
      toast.error('Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (providerId) => {
    if (window.confirm('Disconnect from this portal?')) {
      try {
        await patientPortalAPI.disconnect(providerId)
        toast.success('Disconnected')
        loadData()
      } catch (error) {
        toast.error('Failed to disconnect')
      }
    }
  }

  const isConnected = (providerId) => {
    return connections.some(c => c.provider_id === providerId)
  }

  const getConnection = (providerId) => {
    return connections.find(c => c.provider_id === providerId)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Portal Integration</h1>
        <p className="text-gray-600">Connect to your healthcare provider portals to sync medical records</p>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">POC Demo Mode</p>
            <p className="text-sm text-blue-700">This is a mock integration for demonstration purposes. In production, this would use SMART on FHIR or OAuth2 for secure authentication with actual patient portals.</p>
          </div>
        </div>
      </div>

      {connections.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Connected Portals</h2>
          {connections.map((conn) => (
            <div key={conn.provider_id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{conn.provider_name}</h3>
                  <p className="text-sm text-gray-500">
                    {conn.records_synced} records synced
                    {conn.last_sync && ` • Last sync: ${new Date(conn.last_sync).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSync(conn.provider_id)}
                  disabled={syncing === conn.provider_id}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing === conn.provider_id ? 'animate-spin' : ''}`} />
                  {syncing === conn.provider_id ? 'Syncing...' : 'Sync'}
                </button>
                <button
                  onClick={() => handleDisconnect(conn.provider_id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Available Portals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.filter(p => !isConnected(p.id)).map((provider) => (
            <div key={provider.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-500">{provider.description}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openConnectModal(provider)}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {showConnectModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Connect to {selectedProvider.name}</h2>
              <button onClick={() => setShowConnectModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConnect} className="p-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Demo Mode:</strong> Enter any credentials to simulate a connection. No actual authentication occurs.
                </p>
              </div>
              <div>
                <label className="label">Username / Email</label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="input"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowConnectModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
