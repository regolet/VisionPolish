import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Edit, Trash2, Save, X, Eye, Shield, Users, Package } from 'lucide-react'

export default function AdminDashboard() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()
  const [editingService, setEditingService] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'portrait',
    base_price: '',
    turnaround_time: '',
    image_url: '',
    features: '',
    is_active: true
  })

  const categories = ['portrait', 'product', 'creative', 'restoration']

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (user) {
      fetchServices()
    }
  }, [user])

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      navigate('/admin/login')
      return
    }

    // Check if user has admin role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (error || profile?.role !== 'admin') {
      navigate('/admin/login')
      return
    }

    setUser(session.user)
    setChecking(false)
  }

  const fetchServices = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setServices(data)
    } else {
      console.error('Error fetching services:', error)
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

  const handleSave = async () => {
    try {
      const serviceData = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f)
      }

      let error
      if (editingService) {
        // Update existing service
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)
        error = updateError
      } else {
        // Create new service
        const { error: insertError } = await supabase
          .from('services')
          .insert([serviceData])
        error = insertError
      }

      if (!error) {
        await fetchServices()
        resetForm()
        alert(editingService ? 'Service updated successfully!' : 'Service created successfully!')
      } else {
        console.error('Error saving service:', error)
        alert('Error saving service. Please try again.')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Error saving service. Please try again.')
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name || '',
      description: service.description || '',
      category: service.category || 'portrait',
      base_price: service.base_price?.toString() || '',
      turnaround_time: service.turnaround_time || '',
      image_url: service.image_url || '',
      features: Array.isArray(service.features) ? service.features.join(', ') : '',
      is_active: service.is_active !== false
    })
    setIsAddingNew(false)
  }

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (!error) {
        await fetchServices()
        alert('Service deleted successfully!')
      } else {
        console.error('Error deleting service:', error)
        alert('Error deleting service. Please try again.')
      }
    }
  }

  const resetForm = () => {
    setEditingService(null)
    setIsAddingNew(false)
    setFormData({
      name: '',
      description: '',
      category: 'portrait',
      base_price: '',
      turnaround_time: '',
      image_url: '',
      features: '',
      is_active: true
    })
  }

  const startAddNew = () => {
    setIsAddingNew(true)
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      category: 'portrait',
      base_price: '',
      turnaround_time: '',
      image_url: '',
      features: '',
      is_active: true
    })
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Verifying admin access...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <Link
              to="/admin/users"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <Users className="h-5 w-5 mr-2" />
              Manage Users
            </Link>
            <button
              onClick={startAddNew}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Service
            </button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-3xl font-bold text-gray-900">{services.length}</p>
              </div>
              <Package className="h-10 w-10 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-3xl font-bold text-gray-900">
                  {services.filter(s => s.is_active).length}
                </p>
              </div>
              <Eye className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900">4</p>
              </div>
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Service Form */}
        {(isAddingNew || editingService) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                {editingService ? 'Edit Service' : 'Add New Service'}
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
                  Service Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turnaround Time
                </label>
                <input
                  type="text"
                  name="turnaround_time"
                  value={formData.turnaround_time}
                  onChange={handleInputChange}
                  placeholder="e.g., 24-48 hours"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features (comma-separated)
                </label>
                <input
                  type="text"
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  placeholder="e.g., Skin smoothing, Blemish removal, Color correction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Service</span>
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
                onClick={handleSave}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition flex items-center"
              >
                <Save className="h-5 w-5 mr-2" />
                {editingService ? 'Update' : 'Create'} Service
              </button>
            </div>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Services Management</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="h-10 w-10 rounded-full object-cover mr-4"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {service.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {service.description?.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${service.base_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}