import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  User, Mail, Phone, Calendar, Shield, 
  Save, Edit, X, AlertCircle, CheckCircle,
  Key, LogOut
} from 'lucide-react'

export default function Profile() {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const { user, profile, loading: authLoading, signOut: authSignOut, forceSignOut } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    department: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!authLoading && user && profile) {
      // User is authenticated, load their profile data
      fetchProfile(user.id)
    } else if (!authLoading && !user) {
      // No user, redirect to login
      navigate('/login')
    }
  }, [user, profile, authLoading, navigate])

  const fetchProfile = async (userId) => {
    setLoading(true)
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // If no profile exists, create a basic one
        if (error.code === 'PGRST116') {
          await createProfile(userId)
          return
        }
        setMessage({ type: 'error', text: 'Error loading profile' })
        return
      }

      setProfileData(profileData)
      setFormData({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        department: profileData.department || ''
      })
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: 'Error loading profile' })
    }
    setLoading(false)
  }

  const createProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          role: 'customer',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      setProfileData(data)
      setFormData({
        full_name: '',
        phone: '',
        department: ''
      })
    } catch (error) {
      console.error('Error creating profile:', error)
      setMessage({ type: 'error', text: 'Error creating profile' })
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          department: formData.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      await fetchProfile(user.id)
      setEditing(false)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Error updating profile' })
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setChangingPassword(false)
      setMessage({ type: 'success', text: 'Password changed successfully!' })
    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: error.message || 'Error changing password' })
    }
    setSaving(false)
  }


  const handleSignOut = async () => {
    try {
      console.log('🚪 Profile: Starting sign out...')
      const result = await authSignOut()
      
      if (result?.error) {
        console.error('❌ Profile: SignOut returned error, trying force signout:', result.error)
        forceSignOut()
      }
      
      console.log('✅ Profile: Navigating to home page')
      navigate('/')
    } catch (error) {
      console.error('❌ Profile: SignOut exception, using force signout:', error)
      // If normal signout fails, force clear everything
      forceSignOut()
      // Force navigation regardless of errors
      navigate('/')
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-red-600" />
      case 'staff': return <Shield className="h-4 w-4 text-blue-600" />
      case 'editor': return <Edit className="h-4 w-4 text-green-600" />
      default: return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'staff': return 'Staff Member'
      case 'editor': return 'Photo Editor'
      default: return 'Customer'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account information and settings</p>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Profile Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setEditing(false)
                        setFormData({
                          full_name: profile?.full_name || '',
                          phone: profile?.phone || '',
                          department: profile?.department || ''
                        })
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition flex items-center disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center p-3 bg-gray-100 rounded-md">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">{user?.email}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <User className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{profileData?.full_name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <Phone className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{profileData?.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Enter your department"
                    />
                  ) : (
                    <div className="flex items-center p-3 bg-gray-50 rounded-md">
                      <User className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{profileData?.department || 'Not set'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Change Password</h2>
                {!changingPassword ? (
                  <button
                    onClick={() => setChangingPassword(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setChangingPassword(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                )}
              </div>

              {changingPassword && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Changing...' : 'Update Password'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Account Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Type</span>
                  <div className="flex items-center">
                    {getRoleIcon(profile?.role)}
                    <span className="ml-2 text-sm font-medium">
                      {getRoleLabel(profile?.role)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile?.is_active !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'Unknown'
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full text-left p-3 rounded-md bg-purple-50 hover:bg-purple-100 transition"
                >
                  <div className="font-medium text-purple-900">View My Orders</div>
                  <div className="text-sm text-purple-600">Check order status and history</div>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full text-left p-3 rounded-md bg-red-50 hover:bg-red-100 transition flex items-center"
                >
                  <LogOut className="h-4 w-4 text-red-600 mr-2" />
                  <div>
                    <div className="font-medium text-red-900">Sign Out</div>
                    <div className="text-sm text-red-600">Sign out of your account</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}