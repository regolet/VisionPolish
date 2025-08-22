import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Package, Eye, Users, Clock, CheckCircle, XCircle, 
  AlertCircle, User, Calendar, DollarSign, Search, 
  Filter, Edit, Save, X, UserCheck, FileText, Image,
  Trash2, ExternalLink, Plus
} from 'lucide-react'

export default function AdminOrderManagement() {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [editors, setEditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [assigningOrder, setAssigningOrder] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [addingOrderItem, setAddingOrderItem] = useState(false)
  const [services, setServices] = useState([])
  const [newOrderItem, setNewOrderItem] = useState({
    service_id: '',
    quantity: 1,
    price: ''
  })
  const navigate = useNavigate()

  const orderStatuses = [
    { value: 'pending', label: 'Pending', color: 'yellow', icon: Clock },
    { value: 'in_progress', label: 'In Progress', color: 'blue', icon: Edit },
    { value: 'completed', label: 'Completed', color: 'green', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelled', color: 'red', icon: XCircle }
  ]

  useEffect(() => {
    checkAdminAccess()
  }, [user, profile])

  useEffect(() => {
    if (currentUser) {
      fetchOrders()
      fetchEditors()
      fetchServices()
    }
  }, [currentUser])

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    // Use profile from AuthContext which has hardcoded admin role
    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      console.error('Access denied. User role:', profile?.role)
      navigate('/unauthorized')
      return
    }

    setCurrentUser(profile)
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      console.log('🔍 Fetching orders with customer information...')
      
      // Simplified query - get orders first, then join data separately
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        throw ordersError
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // Get order items separately
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id, order_id, price, quantity')

      console.log('🔍 Fetching all order items for orders list:', { orderItems, orderItemsError, totalItems: orderItems?.length })

      // Get customer profiles separately
      const customerIds = [...new Set(ordersData.map(order => order.user_id))]
      const { data: customerProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', customerIds)

      // Combine the data manually
      const transformedOrders = ordersData.map(order => {
        const orderOrderItems = (orderItems || []).filter(item => item.order_id === order.id)
        const customerProfile = (customerProfiles || []).find(profile => profile.id === order.user_id)
        const assignedEditor = (editors || []).find(editor => editor.id === order.assigned_editor)
        
        return {
          ...order,
          customer_id: order.user_id,
          customer_name: customerProfile?.full_name || 'Unknown Customer',
          customer_email: 'Loading...',
          editor_name: assignedEditor?.full_name || null,
          editor_email: assignedEditor?.email || null,
          item_count: orderOrderItems.length,
          calculated_total: orderOrderItems.reduce((sum, item) => 
            sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0)
        }
      })

      setOrders(transformedOrders)
      setLoading(false)

      // Try the enhanced RPC function first
      const { data: completeOrdersInfo, error: completeRpcError } = await supabase
        .rpc('get_complete_orders_info')

      console.log('📧 Complete orders RPC:', { completeOrdersInfo, completeRpcError })

      if (!completeRpcError && completeOrdersInfo) {
        setOrders(completeOrdersInfo)
        setLoading(false)
        return
      }

      // Fallback to original RPC function
      const { data: ordersWithInfo, error: rpcError } = await supabase
        .rpc('get_orders_with_customer_info')

      console.log('📧 Fallback RPC orders query:', { ordersWithInfo, rpcError })

      if (rpcError) {
        console.error('❌ RPC Error, trying simple RPC:', rpcError)
        
        // Fallback to simple RPC function
        const { data: simpleOrders, error: simpleRpcError } = await supabase
          .rpc('get_orders_simple')

        console.log('🔄 Simple RPC query:', { simpleOrders, simpleRpcError })
        
        if (simpleRpcError) {
          console.error('❌ Simple RPC failed, trying direct table access:', simpleRpcError)
          
          // Final fallback - direct table access
          const { data: directOrders, error: directError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

          console.log('🏠 Direct table query:', { directOrders, directError })
          
          if (directError) throw directError
          
          // Transform direct orders to match expected format
          const transformedOrders = (directOrders || []).map(order => ({
            ...order,
            customer_name: 'Unknown Customer',
            customer_email: 'N/A',
            editor_name: null,
            editor_email: null
          }))
          
          setOrders(transformedOrders)
        } else {
          // Transform simple orders to match expected format
          const transformedOrders = (simpleOrders || []).map(order => ({
            ...order,
            customer_name: 'Loading...',
            customer_email: 'Loading...',
            editor_name: null,
            editor_email: null
          }))
          
          setOrders(transformedOrders)
        }
      } else {
        setOrders(ordersWithInfo || [])
      }
      
    } catch (error) {
      console.error('💥 Error fetching orders:', error)
      setOrders([])
    }
    setLoading(false)
  }

  const fetchEditors = async () => {
    try {
      // Use the RPC function that properly joins with auth.users for emails
      const { data: editorsData, error } = await supabase
        .rpc('get_available_editors')

      if (error) {
        console.error('RPC Error fetching editors:', error)
        
        // Fallback: get profiles without emails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('role', ['editor', 'staff', 'admin'])
          .eq('is_active', true)
          .order('full_name')

        if (fallbackError) throw fallbackError
        
        // Transform to match expected format
        const editorsWithoutEmails = (fallbackData || []).map(editor => ({
          ...editor,
          email: 'N/A'
        }))
        
        setEditors(editorsWithoutEmails)
      } else {
        setEditors(editorsData || [])
      }
    } catch (error) {
      console.error('Error fetching editors:', error)
      setEditors([])
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleAddOrderItem = async () => {
    if (!newOrderItem.service_id || !newOrderItem.price) {
      alert('Please select a service and enter a price')
      return
    }

    try {
      const { data, error } = await supabase
        .from('order_items')
        .insert([{
          order_id: selectedOrder.id,
          service_id: newOrderItem.service_id,
          quantity: parseInt(newOrderItem.quantity),
          price: parseFloat(newOrderItem.price),
          status: 'pending'
        }])
        .select()

      if (error) throw error

      // Refresh order details
      await fetchOrderDetails(selectedOrder.id)
      
      // Reset form
      setNewOrderItem({
        service_id: '',
        quantity: 1,
        price: ''
      })
      setAddingOrderItem(false)
      
      alert('Order item added successfully!')
    } catch (error) {
      console.error('Error adding order item:', error)
      alert('Error adding order item')
    }
  }

  const handleRemoveOrderItem = async (orderItemId) => {
    console.log('🗑️ SIMPLE DELETE - Attempting to remove order item:', orderItemId)
    
    if (!window.confirm('Are you sure you want to remove this order item?')) {
      return
    }

    try {
      // Simple approach: Just delete directly without complex checks
      console.log('🗑️ Deleting order item:', orderItemId)
      
      const { error, count, data } = await supabase
        .from('order_items')
        .delete()
        .eq('id', orderItemId)

      console.log('🗑️ Delete result:', { error, count, data, orderItemId })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      if (count === 0) {
        // Try to see if the item actually exists
        const { data: checkItem } = await supabase
          .from('order_items')
          .select('id')
          .eq('id', orderItemId)
          .single()
        
        if (checkItem) {
          throw new Error('Item exists but could not be deleted - permission issue')
        } else {
          throw new Error('Item not found - may have been already deleted')
        }
      }

      console.log('✅ Successfully deleted order item, refreshing...')
      
      // Refresh the order details
      await fetchOrderDetails(selectedOrder.id)
      alert('Order item removed successfully!')
      
    } catch (error) {
      console.error('❌ Error removing order item:', error)
      alert('Error removing order item: ' + error.message)
    }
  }

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId)
    setNewOrderItem({
      ...newOrderItem,
      service_id: serviceId,
      price: service ? service.base_price.toString() : ''
    })
  }

  const handleAssignEditor = async (orderId, editorId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          assigned_editor: editorId,
          status: editorId ? 'in_progress' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      await fetchOrders()
      
      // Update selectedOrder if it's the same order being updated
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          assigned_editor: editorId,
          status: editorId ? 'in_progress' : 'pending'
        })
      }
      
      setAssigningOrder(null)
      alert('Order assignment updated successfully!')
    } catch (error) {
      console.error('Error assigning editor:', error)
      alert('Error updating order assignment')
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      await fetchOrders()
      setSelectedOrder(null) // Close modal if open
      alert('Order status updated successfully!')
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error updating order status')
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      await fetchOrders()
      setSelectedOrder(null) // Close modal if open
      alert('Order cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Error cancelling order')
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to permanently delete this order? This action cannot be undone and will remove all associated data including order items and images.')) {
      return
    }

    if (!window.confirm('This will permanently delete the entire order. Are you absolutely sure?')) {
      return
    }

    try {
      // Delete in reverse dependency order to avoid foreign key constraints
      
      // 1. First get order item IDs
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)

      if (orderItems && orderItems.length > 0) {
        const orderItemIds = orderItems.map(item => item.id)
        
        // Delete uploaded images for these order items
        const { error: imagesError } = await supabase
          .from('uploaded_images')
          .delete()
          .in('order_item_id', orderItemIds)

        if (imagesError) {
          console.warn('Error deleting images:', imagesError)
          // Continue anyway - images might not exist
        }

        // 2. Delete order items
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', orderId)

        if (itemsError) {
          console.warn('Error deleting order items:', itemsError)
          // Continue anyway - items might not exist
        }
      }

      // 3. Finally delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (orderError) throw orderError

      await fetchOrders()
      setSelectedOrder(null) // Close modal
      alert('Order deleted successfully!')
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Error deleting order: ' + error.message)
    }
  }

  const fetchOrderDetails = async (orderId) => {
    try {
      console.log('🔍 Fetching order details for:', orderId)

      // Get order data separately to avoid join issues
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) {
        console.error('Error fetching order:', error)
        throw error
      }

      // Get order items separately
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          services (*)
        `)
        .eq('order_id', orderId)

      console.log('🔍 Order items query result:', { orderItems, itemsError, orderId })
      
      // Also try a simpler query to test RLS policies
      const { data: simpleItems, error: simpleError } = await supabase
        .from('order_items')
        .select('id, order_id, price, quantity, service_id')
        .eq('order_id', orderId)
      
      console.log('🔍 Simple order items query:', { simpleItems, simpleError })

      // Get customer profile separately
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('id', orderData.user_id)
        .single()

      // Combine the data
      const combinedOrderData = {
        ...orderData,
        order_items: orderItems || [],
        profiles: customerProfile,
        customer_name: customerProfile?.full_name,
        customer_phone: customerProfile?.phone
      }

      console.log('📦 Combined order data:', combinedOrderData)

      // Use the fresh combined data that includes latest order_items
      console.log('📊 Final order items count in combined data:', combinedOrderData.order_items?.length || 0)
      setSelectedOrder(combinedOrderData)
    } catch (error) {
      console.error('💥 Error fetching order details:', error)
      alert('Error loading order details')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusInfo = (status) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0]
  }

  const getTotalAmount = (order) => {
    // Use calculated_total from the enhanced RPC if available
    if (order.calculated_total !== undefined) {
      return parseFloat(order.calculated_total) || 0
    }
    
    // Fallback to stored total_amount
    if (order.total_amount) {
      return parseFloat(order.total_amount) || 0
    }
    
    // Fallback to calculation from order_items (if available)
    return order.order_items?.reduce((sum, item) => {
      const servicePrice = item.services?.price || 0
      const imageCount = item.uploaded_images?.length || 1
      return sum + (servicePrice * imageCount)
    }, 0) || 0
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    
    // Try different possible bucket names
    const buckets = ['uploads', 'images', 'photos', 'files']
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // Default to 'uploads' bucket
    try {
      return supabase.storage.from('uploads').getPublicUrl(imagePath).data.publicUrl
    } catch (error) {
      console.warn('Error getting image URL:', error)
      return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Order Management</h1>
            <p className="text-gray-600 mt-2">Manage customer orders and assign to editors</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span className="font-medium">{filteredOrders.length} Orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="all">All Status</option>
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Orders</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Editor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center p-2 text-purple-600" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              #{order.id.slice(0, 8)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.item_count || 0} items
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center p-2 text-gray-600" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {order.customer_name || 'Unknown Customer'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customer_email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.editor_name ? (
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 text-green-600 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.editor_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.editor_email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            ${getTotalAmount(order).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => fetchOrderDetails(order.id)}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setAssigningOrder(order)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Assign Editor"
                          >
                            <Users className="h-5 w-5" />
                          </button>
                          {order.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel Order"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Order Details</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Order"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Order
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Order Information</h3>
                    <div className="space-y-2">
                      <p><strong>Order ID:</strong> #{selectedOrder.id}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusInfo(selectedOrder.status).color}-100 text-${getStatusInfo(selectedOrder.status).color}-800`}>
                          {getStatusInfo(selectedOrder.status).label}
                        </span>
                      </p>
                      <p><strong>Total Amount:</strong> ${getTotalAmount(selectedOrder).toFixed(2)}</p>
                      <p><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Customer Information</h3>
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {selectedOrder.profiles?.full_name || selectedOrder.customer_name || 'N/A'}</p>
                      <p><strong>Email:</strong> {selectedOrder.profiles?.email || selectedOrder.customer_email || 'N/A'}</p>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Update Status</h4>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        {orderStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Assign to Editor</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          Current assignment: {selectedOrder.assigned_editor ? 
                            editors.find(e => e.id === selectedOrder.assigned_editor)?.full_name || 'Unknown Editor'
                            : 'Not assigned'}
                        </p>
                        <select
                          value={selectedOrder.assigned_editor || ''}
                          onChange={(e) => handleAssignEditor(selectedOrder.id, e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                        >
                          <option value="">Unassign</option>
                          {editors.map(editor => (
                            <option key={editor.id} value={editor.id}>
                              {editor.full_name} ({editor.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Order Items ({selectedOrder.order_items?.length || 0})</h3>
                    <button
                      onClick={() => setAddingOrderItem(true)}
                      className="flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  {/* Add Order Item Form */}
                  {addingOrderItem && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-3">Add New Order Item</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                          <select
                            value={newOrderItem.service_id}
                            onChange={(e) => handleServiceChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            <option value="">Select a service</option>
                            {services.map(service => (
                              <option key={service.id} value={service.id}>
                                {service.name} - ${service.base_price}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={newOrderItem.quantity}
                            onChange={(e) => setNewOrderItem({...newOrderItem, quantity: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newOrderItem.price}
                            onChange={(e) => setNewOrderItem({...newOrderItem, price: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <button
                          onClick={() => {
                            setAddingOrderItem(false)
                            setNewOrderItem({ service_id: '', quantity: 1, price: '' })
                          }}
                          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddOrderItem}
                          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      selectedOrder.order_items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.service?.name || item.services?.name || 'Service'}</h4>
                            <p className="text-sm text-gray-600">
                              ${item.price} × {item.quantity || 1} = ${(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveOrderItem(item.id)}
                            className="flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {item.service?.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.service.description}</p>
                        )}
                        {item.specifications?.photos && item.specifications.photos.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-3">Uploaded Images ({item.specifications.photos.length}):</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {item.specifications.photos.map((photo, photoIndex) => (
                                <div key={photoIndex} className="relative group">
                                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    {photo.url ? (
                                      <img
                                        src={photo.url}
                                        alt={photo.filename || 'Uploaded image'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none'
                                          e.target.nextSibling.style.display = 'flex'
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center">
                                          <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                          <p className="text-xs text-gray-500">No preview</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-1">
                                    <p className="text-xs text-gray-600 truncate" title={photo.filename || 'Unknown file'}>
                                      {photo.filename || 'Unknown file'}
                                    </p>
                                    {photo.size && (
                                      <p className="text-xs text-gray-400">
                                        {(photo.size / (1024 * 1024)).toFixed(1)} MB
                                      </p>
                                    )}
                                  </div>
                                  {photo.url && (
                                    <button
                                      onClick={() => window.open(photo.url, '_blank')}
                                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="View full size"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">No order items found</p>
                        <p className="text-sm mt-1">This order exists but has no items in the database.</p>
                        <p className="text-sm mt-1">Possible causes:</p>
                        <ul className="text-xs mt-2 space-y-1 text-left max-w-sm mx-auto">
                          <li>• Order was created but items were never inserted</li>
                          <li>• Items were deleted or corrupted</li>
                          <li>• Incomplete checkout process</li>
                          <li>• Database migration issue</li>
                        </ul>
                        <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
                          <strong>Debug:</strong> Order ID {selectedOrder.id?.slice(0, 8)}
                          <br />Check browser console for detailed logs
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="flex space-x-3">
                    {selectedOrder.status !== 'cancelled' && (
                      <button
                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Order
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Editor Modal */}
        {assigningOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Assign Editor</h2>
                <button
                  onClick={() => setAssigningOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Select an editor to assign to order #{assigningOrder.id.slice(0, 8)}
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleAssignEditor(assigningOrder.id, null)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <X className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-gray-600">Unassign</span>
                    </div>
                  </button>
                  
                  {editors.map((editor) => (
                    <button
                      key={editor.id}
                      onClick={() => handleAssignEditor(assigningOrder.id, editor.id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">{editor.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {editor.email} • {editor.role}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}