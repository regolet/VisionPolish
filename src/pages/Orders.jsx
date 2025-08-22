import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Clock, CheckCircle, Package, Image, Download, Eye } from 'lucide-react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    if (!session) {
      navigate('/login')
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          service:services (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    } else {
      console.error('Error fetching orders:', error)
    }
    setLoading(false)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTotalImages = (order) => {
    return order.order_items?.reduce((total, item) => {
      if (item.specifications?.photos) {
        return total + item.specifications.photos.length
      }
      return total + item.quantity
    }, 0) || 0
  }

  const openOrderModal = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const closeOrderModal = () => {
    setSelectedOrder(null)
    setShowOrderModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your photo editing orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-8">
              You haven't placed any orders yet. Start by browsing our services!
            </p>
            <button
              onClick={() => navigate('/services')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-2 capitalize">{order.status}</span>
                    </span>
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-600">${order.total_amount}</p>
                      <p className="text-sm text-gray-500">{getTotalImages(order)} images</p>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                  <div className="flex flex-wrap gap-2">
                    {order.order_items?.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                        {item.service?.name} ({item.quantity})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="mb-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className={`flex items-center ${order.status === 'pending' || order.status === 'processing' || order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${order.status === 'pending' || order.status === 'processing' || order.status === 'completed' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      Order Placed
                    </div>
                    <div className={`flex items-center ${order.status === 'processing' || order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${order.status === 'processing' || order.status === 'completed' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      Processing
                    </div>
                    <div className={`flex items-center ${order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${order.status === 'completed' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      Completed
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => openOrderModal(order)}
                    className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                  {order.status === 'completed' && (
                    <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                      <Download className="h-4 w-4 mr-2" />
                      Download Files
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order #{selectedOrder.order_number}
                </h2>
                <button
                  onClick={closeOrderModal}
                  className="text-gray-400 hover:text-gray-600 transition text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                {/* Order Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium">
                        {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1 capitalize">{selectedOrder.status}</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium text-lg text-purple-600">
                        ${selectedOrder.total_amount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Order Items</h3>
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-medium">{item.service?.name}</h4>
                          <p className="text-gray-600">{item.service?.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} × ${item.price}
                          </p>
                        </div>
                      </div>

                      {/* Uploaded Photos */}
                      {item.specifications?.photos && item.specifications.photos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Photos ({item.specifications.photos.length}):
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {item.specifications.photos.map((photo, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={photo.url}
                                  alt={photo.filename}
                                  className="w-full h-16 object-cover rounded border"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Special Instructions */}
                      {item.specifications?.notes && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-medium text-blue-800">Special Instructions:</p>
                          <p className="text-sm text-blue-700">{item.specifications.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-4">
                  {selectedOrder.status === 'completed' && (
                    <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center">
                      <Download className="h-5 w-5 mr-2" />
                      Download All Files
                    </button>
                  )}
                  <button
                    onClick={closeOrderModal}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}