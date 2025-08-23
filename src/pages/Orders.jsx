import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Clock, CheckCircle, Package, Image, Download, Eye, X, ZoomIn, RefreshCw } from 'lucide-react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [imageInfo, setImageInfo] = useState(null)
  const [revisionMode, setRevisionMode] = useState({})
  const [revisionNotes, setRevisionNotes] = useState({})
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
      case 'assigned':
      case 'in_progress':
        return <Package className="h-5 w-5 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'revision':
        return <RefreshCw className="h-5 w-5 text-orange-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
      case 'assigned':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'revision':
        return 'bg-orange-100 text-orange-800'
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // Use Supabase Storage to get public URL
    try {
      return supabase.storage.from('uploads').getPublicUrl(imagePath).data.publicUrl
    } catch (error) {
      console.warn('Error getting image URL:', error)
      return null
    }
  }

  const getEditedImageUrl = (editedImage) => {
    // All edited images should be in uploads bucket under edited/ folder
    if (editedImage.url) {
      let path = editedImage.url
      
      // Ensure the path is in correct format: edited/filename.jpg
      // Remove any incorrect prefixes
      if (path.startsWith('uploads/')) {
        path = path.substring(8) // Remove 'uploads/' prefix
      }
      if (path.startsWith('images/')) {
        path = path.substring(7) // Remove 'images/' prefix
      }
      
      // Ensure path starts with 'edited/' for edited images
      if (!path.startsWith('edited/')) {
        path = `edited/${path}`
      }
      
      // Generate URL from uploads bucket
      const { data } = supabase.storage.from('uploads').getPublicUrl(path)
      return data.publicUrl
    }
    
    // Fallback to stored publicUrl if available (for legacy images)
    if (editedImage.publicUrl) {
      return editedImage.publicUrl
    }
    
    return null
  }

  const openOrderModal = (order) => {
    console.log('🔍 Opening order modal for:', order)
    console.log('📸 Order items with photos:', order.order_items?.map(item => ({
      service: item.service?.name,
      photos: item.specifications?.photos?.length || 0,
      photo_urls: item.specifications?.photos?.map(p => p.url) || []
    })))
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const closeOrderModal = () => {
    setSelectedOrder(null)
    setShowOrderModal(false)
  }

  const openImagePreview = (imageUrl, filename, isEdited = false) => {
    console.log('🖼️ Opening image preview:', { imageUrl, filename, isEdited })
    if (!imageUrl) {
      console.error('❌ No image URL provided for preview')
      return
    }
    setPreviewImage({
      url: imageUrl,
      filename: filename || 'Unknown image',
      isEdited: isEdited
    })
  }

  const toggleRevisionMode = (orderItemId) => {
    setRevisionMode(prev => ({
      ...prev,
      [orderItemId]: !prev[orderItemId]
    }))
    
    // Clear notes when closing revision mode
    if (revisionMode[orderItemId]) {
      setRevisionNotes(prev => ({
        ...prev,
        [orderItemId]: ''
      }))
    }
  }

  const updateRevisionNotes = (orderItemId, notes) => {
    setRevisionNotes(prev => ({
      ...prev,
      [orderItemId]: notes
    }))
  }

  const requestRevision = async (orderId, orderItemId) => {
    try {
      console.log('🔄 Requesting revision for order:', orderId, 'item:', orderItemId)
      
      const notes = revisionNotes[orderItemId] || ''
      const currentItem = selectedOrder.order_items.find(item => item.id === orderItemId)
      const currentSpecs = currentItem?.specifications || {}
      
      // Create revision history entry
      const revisionHistory = currentSpecs.revisionHistory || []
      const newRevision = {
        id: Date.now().toString(),
        requestedAt: new Date().toISOString(),
        notes: notes,
        status: 'pending',
        requestedBy: user.id
      }
      
      revisionHistory.push(newRevision)
      
      // Update order status to revision
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'revision',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
      
      if (orderError) {
        throw orderError
      }
      
      // Update order item with revision history
      const { error: itemError } = await supabase
        .from('order_items')
        .update({
          specifications: {
            ...currentSpecs,
            revisionHistory: revisionHistory,
            latestRevision: newRevision,
            revisionCount: revisionHistory.length
          }
        })
        .eq('id', orderItemId)
      
      if (itemError) {
        throw itemError
      }
      
      // Clear form and close revision mode
      setRevisionMode(prev => ({ ...prev, [orderItemId]: false }))
      setRevisionNotes(prev => ({ ...prev, [orderItemId]: '' }))
      
      // Refresh orders to show updated status
      await fetchOrders()
      
      alert('Revision request submitted successfully! The editor will be notified.')
      
    } catch (error) {
      console.error('❌ Error requesting revision:', error)
      alert('Failed to submit revision request. Please try again.')
    }
  }

  const getLatestRevision = (item) => {
    return item.specifications?.latestRevision || null
  }

  const getRevisionHistory = (item) => {
    return item.specifications?.revisionHistory || []
  }

  const canRequestRevision = (order, item) => {
    // Can request revision if order is completed and has edited images
    if (order.status !== 'completed' || !item.specifications?.editedImages?.length) {
      return false
    }
    
    // Check if there's a pending revision
    const latestRevision = getLatestRevision(item)
    if (latestRevision && latestRevision.status === 'pending') {
      return false // Already has pending revision
    }
    
    return true
  }

  const closeImagePreview = () => {
    setPreviewImage(null)
    setImageInfo(null)
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
          
          {/* DEBUG: Test preview functionality */}
          <button
            onClick={() => {
              console.log('🧪 Test button clicked')
              openImagePreview('https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400', 'Test Image', false)
            }}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Test Preview Modal
          </button>
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
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Order #{order.order_number}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-2 capitalize">{order.status}</span>
                      </span>
                    </div>
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
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-600">${order.total_amount}</p>
                      <p className="text-sm text-gray-500">{getTotalImages(order)} images</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => openOrderModal(order)}
                        className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      {order.status === 'completed' && (
                        <button className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      )}
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

                {/* Image Thumbnails Preview */}
                {order.order_items?.some(item => 
                  item.specifications?.photos?.length > 0 || 
                  item.specifications?.editedImages?.length > 0
                ) && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Images:</h4>
                    <div className="flex flex-wrap gap-4">
                      {order.order_items?.map((item) => 
                        item.specifications?.photos?.map((photo, photoIndex) => {
                          const editedImage = item.specifications?.editedImages?.[photoIndex]
                          return (
                            <div key={`${item.id}-${photoIndex}`} className="flex space-x-2">
                              {/* Original Image */}
                              <div className="relative group">
                                <div
                                  className="w-32 h-40 relative cursor-pointer hover:opacity-75 transition-opacity"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('🖱️ Container clicked - trying to open preview')
                                    console.log('📷 Photo data:', photo)
                                    const imageUrl = getImageUrl(photo.url)
                                    console.log('🌐 Image URL generated:', imageUrl)
                                    openImagePreview(imageUrl, photo.filename, false)
                                  }}
                                  style={{ zIndex: 1 }}
                                >
                                  <img
                                    src={getImageUrl(photo.url)}
                                    alt={photo.filename || 'Original image'}
                                    className="w-full h-full object-cover rounded-lg border"
                                    onError={(e) => {
                                      console.log('❌ Image failed to load:', photo.url)
                                      e.target.style.display = 'none'
                                      e.target.nextElementSibling.style.display = 'flex'
                                    }}
                                    onLoad={() => {
                                      console.log('✅ Image loaded successfully:', photo.url)
                                    }}
                                  />
                                  <div className="w-full h-full hidden items-center justify-center bg-gray-100 rounded-lg border">
                                    <Image className="h-8 w-8 text-gray-400" />
                                  </div>
                                  <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded pointer-events-none">
                                    Original
                                  </div>
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                    <ZoomIn className="h-8 w-8 text-white" />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Edited Image */}
                              {editedImage ? (
                                <div className="relative group">
                                  <div
                                    className="w-32 h-40 relative cursor-pointer hover:opacity-75 transition-opacity"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      console.log('🖱️ Edited image container clicked')
                                      console.log('📷 Edited image data:', editedImage)
                                      const imageUrl = getEditedImageUrl(editedImage)
                                      console.log('🌐 Edited image URL generated:', imageUrl)
                                      openImagePreview(imageUrl, editedImage.filename, true)
                                    }}
                                    style={{ zIndex: 1 }}
                                  >
                                    <img
                                      src={getEditedImageUrl(editedImage)}
                                      alt={editedImage.filename || 'Edited image'}
                                      className="w-full h-full object-cover rounded-lg border ring-2 ring-green-500"
                                      onError={(e) => {
                                        console.log('❌ Edited image failed to load:', editedImage.url)
                                        e.target.style.display = 'none'
                                        e.target.nextElementSibling.style.display = 'flex'
                                      }}
                                      onLoad={() => {
                                        console.log('✅ Edited image loaded successfully:', editedImage.url)
                                      }}
                                    />
                                    <div className="w-full h-full hidden items-center justify-center bg-gray-100 rounded-lg border">
                                      <Image className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded pointer-events-none">
                                      Edited
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                      <ZoomIn className="h-5 w-5 text-white" />
                                    </div>
                                  </div>
                                </div>
                              ) : order.status === 'completed' ? (
                                <div className="w-32 h-40 flex items-center justify-center bg-yellow-50 rounded-lg border border-yellow-200">
                                  <div className="text-center">
                                    <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                                    <span className="text-sm text-yellow-700">Processing</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-32 h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="text-center">
                                    <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <span className="text-sm text-gray-500">Pending</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="mb-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className={`flex items-center ${['pending', 'processing', 'assigned', 'in_progress', 'completed', 'revision'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${['pending', 'processing', 'assigned', 'in_progress', 'completed', 'revision'].includes(order.status) ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      Order Placed
                    </div>
                    <div className={`flex items-center ${['processing', 'assigned', 'in_progress', 'completed', 'revision'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${['processing', 'assigned', 'in_progress', 'completed', 'revision'].includes(order.status) ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      Processing
                    </div>
                    <div className={`flex items-center ${order.status === 'completed' ? 'text-green-600' : order.status === 'revision' ? 'text-orange-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${order.status === 'completed' ? 'bg-green-600' : order.status === 'revision' ? 'bg-orange-600' : 'bg-gray-400'}`}></div>
                      {order.status === 'revision' ? 'Revision' : 'Completed'}
                    </div>
                  </div>
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

                      {/* Before/After Photo Comparison */}
                      {item.specifications?.photos && item.specifications.photos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            Photos ({item.specifications.photos.length}):
                          </p>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {item.specifications.photos.map((photo, index) => {
                              const editedImage = item.specifications?.editedImages?.[index]
                              return (
                                <div key={index} className="lg:col-span-3 border border-gray-200 rounded-lg p-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Images Section - Takes 2 columns */}
                                    <div className="lg:col-span-2">
                                      <div className="grid grid-cols-2 gap-4">
                                    {/* Original Image */}
                                    <div className="text-center">
                                      <p className="text-xs font-medium text-gray-600 mb-2">Original</p>
                                      <div className="relative">
                                        {photo.url ? (
                                          <div className="relative group">
                                            <img
                                              src={getImageUrl(photo.url)}
                                              alt={photo.filename || 'Original image'}
                                              className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                console.log('🖱️ Modal original image clicked:', photo)
                                                const imageUrl = getImageUrl(photo.url)
                                                console.log('📸 Modal generated image URL:', imageUrl)
                                                openImagePreview(imageUrl, photo.filename, false)
                                              }}
                                              onError={(e) => {
                                                e.target.style.display = 'none'
                                                e.target.nextSibling.style.display = 'flex'
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                              <ZoomIn className="h-8 w-8 text-white" />
                                            </div>
                                          </div>
                                        ) : null}
                                        <div className="w-full h-40 hidden items-center justify-center bg-gray-100 rounded-lg border">
                                          <div className="text-center">
                                            <Image className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">No image</p>
                                          </div>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-500 mt-1 truncate" title={photo.filename}>
                                        {photo.filename}
                                      </p>
                                    </div>
                                    
                                    {/* Edited Image */}
                                    <div className="text-center">
                                      <p className="text-xs font-medium text-gray-600 mb-2">Edited</p>
                                      <div className="relative">
                                        {editedImage ? (
                                          <>
                                            <div className="relative group">
                                              <img
                                                src={getEditedImageUrl(editedImage)}
                                                alt={editedImage.filename || 'Edited image'}
                                                className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity ring-2 ring-green-500"
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  console.log('🖱️ Modal edited image clicked:', editedImage)
                                                  const imageUrl = getEditedImageUrl(editedImage)
                                                  console.log('📸 Modal edited image URL:', imageUrl)
                                                  openImagePreview(imageUrl, editedImage.filename, true)
                                                }}
                                                onError={(e) => {
                                                  e.target.style.display = 'none'
                                                  e.target.nextSibling.style.display = 'flex'
                                                }}
                                              />
                                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <ZoomIn className="h-8 w-8 text-white" />
                                              </div>
                                            </div>
                                            <div className="w-full h-40 hidden items-center justify-center bg-gray-100 rounded-lg border">
                                              <div className="text-center">
                                                <Image className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Load failed</p>
                                              </div>
                                            </div>
                                            <p className="text-xs text-green-600 mt-1 truncate" title={editedImage.filename}>
                                              {editedImage.filename}
                                            </p>
                                          </>
                                        ) : selectedOrder.status === 'completed' ? (
                                          <>
                                            <div className="w-full h-40 flex items-center justify-center bg-yellow-50 rounded-lg border border-yellow-200">
                                              <div className="text-center">
                                                <Clock className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                                                <p className="text-sm text-yellow-600">Processing</p>
                                              </div>
                                            </div>
                                            <p className="text-sm text-yellow-600 mt-1">Being processed</p>
                                          </>
                                        ) : (
                                          <>
                                            <div className="w-full h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                              <div className="text-center">
                                                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Pending</p>
                                              </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">Awaiting editor</p>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                    {/* Instructions and Controls Section - Takes 1 column */}
                                    <div className="lg:col-span-1 space-y-4">
                                      {/* Special Instructions */}
                                      {item.specifications?.notes && (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                          <p className="text-sm font-medium text-blue-800 mb-2">Special Instructions:</p>
                                          <p className="text-sm text-blue-700">{item.specifications.notes}</p>
                                        </div>
                                      )}

                                      {/* Latest Revision Status */}
                                      {getLatestRevision(item) && (
                                        <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-orange-800">Latest Revision:</p>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                              getLatestRevision(item).status === 'pending' 
                                                ? 'bg-orange-100 text-orange-700'
                                                : getLatestRevision(item).status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                              {getLatestRevision(item).status === 'pending' ? 'In Progress' :
                                               getLatestRevision(item).status === 'completed' ? 'Completed' :
                                               getLatestRevision(item).status}
                                            </span>
                                          </div>
                                          <p className="text-sm text-orange-700">{getLatestRevision(item).notes}</p>
                                          <p className="text-xs text-orange-600 mt-1">
                                            {new Date(getLatestRevision(item).requestedAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      )}

                                      {/* Revision Controls for Orders with Edited Images */}
                                      {item.specifications?.editedImages && 
                                       item.specifications.editedImages.length > 0 && (
                                        <div>
                                          {/* Revision Textarea - Only show when in revision mode */}
                                          {revisionMode[item.id] && canRequestRevision(selectedOrder, item) && (
                                            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                              <label className="block text-sm font-medium text-orange-800 mb-2">
                                                Revision Request Details
                                              </label>
                                              <textarea
                                                value={revisionNotes[item.id] || ''}
                                                onChange={(e) => updateRevisionNotes(item.id, e.target.value)}
                                                placeholder="Please describe what changes you would like for this item. Be as specific as possible..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
                                              />
                                              <p className="text-xs text-orange-600 mt-1">
                                                Describe specific changes needed
                                              </p>
                                            </div>
                                          )}
                                          
                                          {/* Action Buttons */}
                                          <div className="flex flex-col gap-2">
                                            {canRequestRevision(selectedOrder, item) ? (
                                              !revisionMode[item.id] ? (
                                                <button
                                                  onClick={() => toggleRevisionMode(item.id)}
                                                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition flex items-center justify-center space-x-2"
                                                >
                                                  <RefreshCw className="h-4 w-4" />
                                                  <span>
                                                    {getRevisionHistory(item).length > 0 ? 'Request Another Revision' : 'Request Revision'}
                                                  </span>
                                                </button>
                                              ) : (
                                                <>
                                                  <button
                                                    onClick={() => toggleRevisionMode(item.id)}
                                                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                                                  >
                                                    Cancel
                                                  </button>
                                                  <button
                                                    onClick={() => requestRevision(selectedOrder.id, item.id)}
                                                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition flex items-center justify-center space-x-2"
                                                  >
                                                    <RefreshCw className="h-4 w-4" />
                                                    <span>Submit Request</span>
                                                  </button>
                                                </>
                                              )
                                            ) : getLatestRevision(item)?.status === 'pending' ? (
                                              <div className="text-center">
                                                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
                                                  <div className="flex items-center justify-center space-x-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Revision in Progress</span>
                                                  </div>
                                                </div>
                                                <p className="text-xs text-yellow-600 mt-1">
                                                  Editor is working on your revision
                                                </p>
                                              </div>
                                            ) : selectedOrder.status === 'revision' ? (
                                              <div className="text-center">
                                                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                                                  <div className="flex items-center justify-center space-x-2">
                                                    <Package className="h-4 w-4" />
                                                    <span>Under Revision</span>
                                                  </div>
                                                </div>
                                                <p className="text-xs text-blue-600 mt-1">
                                                  Processing revision requests
                                                </p>
                                              </div>
                                            ) : (
                                              <div className="text-center">
                                                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                                                  <div className="flex items-center justify-center space-x-2">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span>Completed</span>
                                                  </div>
                                                </div>
                                                <p className="text-xs text-green-600 mt-1">
                                                  Your editing is complete
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {canRequestRevision(selectedOrder, item) && (
                                            <p className="text-xs text-gray-500 mt-2 text-center">
                                              Request additional editing for this item
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Revision History Thumbnails */}
                          {getRevisionHistory(item).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                <RefreshCw className="h-4 w-4 mr-2 text-orange-600" />
                                Revision History ({getRevisionHistory(item).length} revisions)
                              </h5>
                              <div className="space-y-3">
                                {getRevisionHistory(item).map((revision, revIndex) => {
                                  const revisionImages = revision.editedImages || []
                                  return (
                                    <div key={revision.id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium text-orange-800">
                                            Revision #{revIndex + 1}
                                          </span>
                                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            revision.status === 'pending' 
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : revision.status === 'completed'
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-gray-100 text-gray-700'
                                          }`}>
                                            {revision.status === 'pending' ? 'In Progress' :
                                             revision.status === 'completed' ? 'Completed' :
                                             revision.status}
                                          </span>
                                        </div>
                                        <span className="text-xs text-orange-600">
                                          {new Date(revision.requestedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      
                                      {/* Revision Notes */}
                                      {revision.notes && (
                                        <div className="mb-3 p-2 bg-white border border-orange-200 rounded text-sm">
                                          <p className="text-gray-700">
                                            <span className="font-medium text-orange-800">Request:</span> {revision.notes}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {/* Revision Images */}
                                      {revisionImages.length > 0 && (
                                        <div>
                                          <p className="text-xs font-medium text-orange-700 mb-2">
                                            Revised Images ({revisionImages.length}):
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {revisionImages.map((revImg, imgIndex) => (
                                              <div key={imgIndex} className="relative group">
                                                <img
                                                  src={getEditedImageUrl(revImg)}
                                                  alt={revImg.filename || `Revision ${revIndex + 1} image ${imgIndex + 1}`}
                                                  className="w-16 h-16 object-cover rounded border ring-1 ring-orange-300 cursor-pointer hover:opacity-75 transition-opacity"
                                                  onClick={() => openImagePreview(
                                                    getEditedImageUrl(revImg), 
                                                    revImg.filename || `Revision ${revIndex + 1} - ${imgIndex + 1}`, 
                                                    true
                                                  )}
                                                  onError={(e) => {
                                                    e.target.style.display = 'none'
                                                    e.target.nextSibling.style.display = 'flex'
                                                  }}
                                                />
                                                <div className="w-16 h-16 hidden items-center justify-center bg-gray-100 rounded border">
                                                  <Image className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                  <ZoomIn className="h-3 w-3 text-white" />
                                                </div>
                                                <div className="absolute bottom-0 right-0 bg-orange-600 text-white text-xs px-1 rounded-tl">
                                                  R{revIndex + 1}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Completion Info */}
                                      {revision.completedAt && (
                                        <div className="mt-2 text-xs text-green-600">
                                          ✓ Completed on {new Date(revision.completedAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Revision History */}
                      {getRevisionHistory(item).length > 1 && (
                        <div className="mb-4">
                          <button
                            onClick={() => {
                              const historyVisible = document.getElementById(`revision-history-${item.id}`)
                              historyVisible.style.display = historyVisible.style.display === 'none' ? 'block' : 'none'
                            }}
                            className="text-sm text-orange-600 hover:text-orange-800 underline mb-2"
                          >
                            View Revision History ({getRevisionHistory(item).length} requests)
                          </button>
                          <div id={`revision-history-${item.id}`} style={{display: 'none'}} className="space-y-2">
                            {getRevisionHistory(item).slice(0, -1).map((revision, index) => (
                              <div key={revision.id} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-gray-700">Revision #{index + 1}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(revision.requestedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-600">{revision.notes}</p>
                              </div>
                            ))}
                          </div>
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

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              {/* Close button */}
              <button
                onClick={closeImagePreview}
                className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 z-10"
              >
                <X className="h-6 w-6" />
              </button>
              
              {/* Image */}
              <img
                src={previewImage.url}
                alt={previewImage.filename}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
                onLoad={(e) => {
                  const img = e.target
                  setImageInfo({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    displayWidth: img.width,
                    displayHeight: img.height
                  })
                }}
                onError={(e) => {
                  console.error('❌ Failed to load preview image:', previewImage.url)
                  e.target.src = 'https://via.placeholder.com/400x400/e5e7eb/6b7280?text=Image+Not+Found'
                }}
              />
              
              {/* Image info */}
              <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate" title={previewImage.filename}>
                        {previewImage.filename}
                      </h3>
                      {previewImage.isEdited && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Edited
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {imageInfo ? (
                        <>
                          {`${imageInfo.width} × ${imageInfo.height} pixels`}
                        </>
                      ) : (
                        'Loading image info...'
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Create a temporary link to download the image
                      const link = document.createElement('a')
                      link.href = previewImage.url
                      link.download = previewImage.filename || 'image'
                      link.target = '_blank'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center justify-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
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