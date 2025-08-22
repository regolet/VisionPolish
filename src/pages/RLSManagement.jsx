import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Shield, ShieldOff, ToggleLeft, ToggleRight, 
  AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Database, Lock, Unlock, Settings, Zap
} from 'lucide-react'

export default function RLSManagement() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState({})
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!profile || profile.role !== 'admin') {
      navigate('/unauthorized')
      return
    }

    fetchRLSStatus()
  }, [user, profile, navigate])

  const fetchRLSStatus = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_rls_status')
      
      if (error) throw error
      
      setTables(data || [])
    } catch (error) {
      console.error('Error fetching RLS status:', error)
      setMessage({ type: 'error', text: 'Failed to fetch RLS status: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const toggleRLS = async (tableName, currentStatus) => {
    try {
      setToggling({ ...toggling, [tableName]: true })
      setMessage(null)
      
      const { data, error } = await supabase.rpc('toggle_rls', {
        p_table_name: tableName,
        p_enable: !currentStatus
      })
      
      if (error) throw error
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: data.message 
        })
        await fetchRLSStatus()
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Error toggling RLS:', error)
      setMessage({ 
        type: 'error', 
        text: `Failed to toggle RLS for ${tableName}: ${error.message}` 
      })
    } finally {
      setToggling({ ...toggling, [tableName]: false })
    }
  }

  const disableAllRLS = async () => {
    if (!confirm('Are you sure you want to disable RLS for ALL tables? This will make all data accessible to everyone!')) {
      return
    }

    try {
      setLoading(true)
      setMessage(null)
      
      const { data, error } = await supabase.rpc('disable_all_rls')
      
      if (error) throw error
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: data.message 
        })
        await fetchRLSStatus()
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Error disabling all RLS:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to disable all RLS: ' + error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  const applyRecommendedSettings = async () => {
    if (!confirm('Apply recommended RLS settings? This will disable RLS for profiles and enable it with admin policies for other tables.')) {
      return
    }

    try {
      setLoading(true)
      setMessage(null)
      
      const { data, error } = await supabase.rpc('apply_recommended_rls')
      
      if (error) throw error
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: data.message 
        })
        await fetchRLSStatus()
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Error applying recommended settings:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to apply recommended settings: ' + error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  const getTableDescription = (tableName) => {
    const descriptions = {
      profiles: 'User profiles and roles - Keep disabled to avoid circular dependencies',
      services: 'Photo editing services catalog',
      orders: 'Customer orders and assignments',
      order_items: 'Individual items within orders',
      uploaded_images: 'Images uploaded for editing',
      cart_items: 'Shopping cart items'
    }
    return descriptions[tableName] || 'Database table'
  }

  const getTableIcon = (tableName) => {
    const icons = {
      profiles: '👤',
      services: '🎨',
      orders: '📦',
      order_items: '📋',
      uploaded_images: '🖼️',
      cart_items: '🛒'
    }
    return icons[tableName] || '📊'
  }

  if (loading && tables.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading RLS status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RLS Management</h1>
                <p className="text-gray-600">Control Row Level Security for all tables</p>
              </div>
            </div>
            <button
              onClick={fetchRLSStatus}
              className="p-2 text-gray-600 hover:text-purple-600 transition"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={applyRecommendedSettings}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition flex items-center"
            >
              <Zap className="h-4 w-4 mr-2" />
              Apply Recommended Settings
            </button>
            <button
              onClick={disableAllRLS}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center"
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Disable All RLS (Emergency)
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg p-4 mb-6 flex items-center ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-800 border border-red-200' 
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            {message.type === 'error' ? (
              <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Disabling RLS makes data accessible to all authenticated users</li>
                <li>Keep profiles table RLS disabled to avoid circular dependency issues</li>
                <li>Always enable RLS with proper policies in production</li>
                <li>Admin policies are automatically added when enabling RLS</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map((table) => (
            <div
              key={table.table_name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getTableIcon(table.table_name)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {table.table_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getTableDescription(table.table_name)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* RLS Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">RLS Status:</span>
                  <div className="flex items-center">
                    {table.rls_enabled ? (
                      <>
                        <Lock className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-600">Enabled</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-600">Disabled</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Policy Count */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Policies:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {table.policy_count} {table.policy_count === 1 ? 'policy' : 'policies'}
                  </span>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => toggleRLS(table.table_name, table.rls_enabled)}
                  disabled={toggling[table.table_name]}
                  className={`w-full py-2 px-4 rounded-md transition flex items-center justify-center ${
                    table.rls_enabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } ${toggling[table.table_name] ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {toggling[table.table_name] ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {table.rls_enabled ? (
                        <>
                          <ToggleRight className="h-4 w-4 mr-2" />
                          Disable RLS
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-2" />
                          Enable RLS
                        </>
                      )}
                    </>
                  )}
                </button>

                {/* Warning for profiles table */}
                {table.table_name === 'profiles' && table.rls_enabled && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Having RLS enabled on profiles may cause circular dependency issues
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Reference</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <Lock className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-gray-600">RLS Enabled - Data is protected by policies</span>
            </div>
            <div className="flex items-center">
              <Unlock className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-gray-600">RLS Disabled - All authenticated users can access</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-purple-600 mr-2" />
              <span className="text-gray-600">Policies define who can access what data</span>
            </div>
            <div className="flex items-center">
              <Database className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-gray-600">Each table can have multiple policies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}