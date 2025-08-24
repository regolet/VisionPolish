import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Users, Plus, Edit, Trash2, Save, X, Shield, 
  UserCheck, UserX, Search, Filter, Mail, Phone,
  AlertCircle, Check
} from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'customer',
    department: '',
    is_active: true
  })

  const roles = [
    { value: 'admin', label: 'Admin', color: 'red', icon: Shield, description: 'Full system access' },
    { value: 'staff', label: 'Staff', color: 'blue', icon: UserCheck, description: 'Manage orders & services' },
    { value: 'editor', label: 'Editor', color: 'green', icon: Edit, description: 'Edit photos & process orders' },
    { value: 'customer', label: 'Customer', color: 'gray', icon: Users, description: 'Regular customer account' }
  ]

  useEffect(() => {
    if (!authLoading && user && profile) {
      // User is authenticated, check if they have admin role
      if (profile.role !== 'admin') {
        navigate('/unauthorized')
        return
      }
      // User is admin, fetch users
      fetchUsers()
    } else if (!authLoading && !user) {
      // No user, redirect to login
      navigate('/login')
    }
  }, [user, profile, authLoading, navigate])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        setUsers([])
        setLoading(false)
        return
      }

      // Now try to fetch emails using the RPC function
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_users_with_email')

      if (usersError) {
        console.error('RPC Error:', usersError)
        // Fallback: just show profiles without emails
        setUsers(profiles || [])
      } else {
        setUsers(usersData || [])
      }
      
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAddUser = async () => {
    try {
      // Since we can't use admin.createUser from the client, we'll use signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Use admin RPC function to create profile (bypasses RLS)
        const { data: profileData, error: profileError } = await supabase
          .rpc('admin_create_user_profile', {
            user_id: authData.user.id,
            user_email: formData.email,
            user_full_name: formData.full_name,
            user_phone: formData.phone,
            user_role: formData.role,
            user_department: formData.department,
            user_is_active: formData.is_active
          })

        if (profileError) throw profileError

        await fetchUsers()
        resetForm()
        alert('User created successfully! They will receive a confirmation email.')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert(error.message || 'Error creating user. They may already exist.')
    }
  }

  const handleUpdateUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)

      if (error) throw error

      await fetchUsers()
      resetForm()
      alert('User updated successfully!')
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (userId === profile?.id) {
      alert("You cannot delete your own account!")
      return
    }

    if (!window.confirm('Are you sure you want to deactivate this user? They will not be able to login.')) {
      return
    }

    try {
      // We can't delete auth users from client, so we'll deactivate them
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (error) throw error

      await fetchUsers()
      alert('User deactivated successfully!')
    } catch (error) {
      console.error('Error deactivating user:', error)
      alert('Error deactivating user')
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role || 'customer',
      department: user.department || '',
      is_active: user.is_active !== false
    })
    setShowAddUser(false)
  }

  const resetForm = () => {
    setEditingUser(null)
    setShowAddUser(false)
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'customer',
      department: '',
      is_active: true
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    
    return matchesSearch && matchesRole
  })

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[3]
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-4 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">User Management</h1>
              <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Manage users, roles, and permissions</p>
            </div>
            <button
              onClick={() => {
                setShowAddUser(true)
                setEditingUser(null)
              }}
              className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center text-sm w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mobile-input w-full pl-9 md:pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="mobile-input min-w-0 w-full sm:w-auto"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add/Edit User Form */}
        {(showAddUser || editingUser) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:bg-gray-100"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g., Photo Editing, Customer Service"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Account</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition flex items-center"
              >
                <Save className="h-5 w-5 mr-2" />
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h2 className="text-lg md:text-xl font-semibold">All Users</h2>
              <p className="text-sm text-gray-600">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role)
                const RoleIcon = roleInfo.icon
                
                return (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {user.full_name || 'No Name'}
                          </h3>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate">{user.email || 'No Email'}</span>
                          </p>
                          {user.phone && (
                            <p className="text-xs text-gray-400 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-purple-600 hover:text-purple-900 p-1"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete User"
                          disabled={user.id === profile?.id}
                        >
                          <Trash2 className={`h-4 w-4 ${user.id === profile?.id ? 'opacity-50 cursor-not-allowed' : ''}`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full bg-${roleInfo.color}-100 text-${roleInfo.color}-800`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </span>
                      {user.department && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {user.department}
                        </span>
                      )}
                      {user.is_active !== false ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800">
                          <X className="h-3 w-3 mr-1" />
                          Inactive
                        </span>
                      )}
                      <span className="text-gray-500">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.role)
                  const RoleIcon = roleInfo.icon
                  
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email || 'No Email'}
                            </div>
                            {user.phone && (
                              <div className="text-xs text-gray-400 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${roleInfo.color}-100 text-${roleInfo.color}-800`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.is_active !== false ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <X className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Edit User"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                            disabled={user.id === profile?.id}
                          >
                            <Trash2 className={`h-5 w-5 ${user.id === profile?.id ? 'opacity-50 cursor-not-allowed' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>

        {/* Role Legend */}
        <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Role Permissions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {roles.map(role => {
              const RoleIcon = role.icon
              return (
                <div key={role.value} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <RoleIcon className={`h-5 w-5 text-${role.color}-600 mr-2`} />
                    <h4 className="font-medium">{role.label}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                  <div className="mt-3 space-y-1">
                    {role.value === 'admin' && (
                      <>
                        <p className="text-xs text-gray-500">• Manage all users</p>
                        <p className="text-xs text-gray-500">• Full system access</p>
                      </>
                    )}
                    {role.value === 'staff' && (
                      <>
                        <p className="text-xs text-gray-500">• Manage orders</p>
                        <p className="text-xs text-gray-500">• Update services</p>
                      </>
                    )}
                    {role.value === 'editor' && (
                      <>
                        <p className="text-xs text-gray-500">• Edit photos</p>
                        <p className="text-xs text-gray-500">• Process orders</p>
                      </>
                    )}
                    {role.value === 'customer' && (
                      <>
                        <p className="text-xs text-gray-500">• Place orders</p>
                        <p className="text-xs text-gray-500">• View own data</p>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}