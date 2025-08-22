import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Download, 
  Upload, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  X,
  ZoomIn
} from 'lucide-react'

export default function EditorDashboard() {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState({})
  const [previewImage, setPreviewImage] = useState(null)
  const [imageInfo, setImageInfo] = useState(null)

  useEffect(() => {
    if (user && profile?.role === 'editor') {
      fetchAssignedOrders()
    }
  }, [user, profile])

  const fetchAssignedOrders = async () => {
    try {
      // First get orders assigned to this editor
      const { data: assignedOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('assigned_editor', user.id)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      if (!assignedOrders || assignedOrders.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // Get order items for these orders with specifications
      const orderIds = assignedOrders.map(order => order.id)
      
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          service_id,
          quantity,
          price,
          status,
          specifications,
          services (
            name,
            description
          )
        `)
        .in('order_id', orderIds)

      if (itemsError) throw itemsError

      // Get customer profiles for these orders
      const customerIds = assignedOrders.map(order => order.user_id)
      
      const { data: customerProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds)

      if (profilesError) throw profilesError

      // Combine all data
      if (!orderItems || orderItems.length === 0) {
        // If no order items, show the orders anyway but indicate they have no items
        const transformedOrders = assignedOrders.map(order => {
          const customer = customerProfiles.find(p => p.id === order?.user_id)
          
          return {
            id: `order-${order.id}`, // Unique ID for orders without items
            order_id: order.id,
            service_id: null,
            quantity: 0,
            price: 0,
            status: order?.status || 'assigned',
            assigned_at: order?.updated_at,
            completed_at: null,
            orders: {
              id: order?.id,
              status: order?.status,
              created_at: order?.created_at,
              profiles: customer
            },
            services: { name: 'No items in this order', description: 'Order has no items to edit' },
            specifications: { photos: [] },
            hasNoItems: true
          }
        })
        setOrders(transformedOrders)
      } else {
        const transformedOrders = (orderItems || []).map(item => {
          const order = assignedOrders.find(o => o.id === item.order_id)
          const customer = customerProfiles.find(p => p.id === order?.user_id)
          
          return {
            id: item.id,
            order_id: item.order_id,
            service_id: item.service_id,
            quantity: item.quantity,
            price: item.price,
            status: order?.status || 'assigned',
            assigned_at: order?.updated_at,
            completed_at: null,
            specifications: item.specifications || { photos: [] },
            orders: {
              id: order?.id,
              status: order?.status,
              created_at: order?.created_at,
              profiles: customer
            },
            services: item.services
          }
        })
        console.log('🔄 Setting transformed orders:', transformedOrders.length, 'items')
        
        // Log edited images for debugging
        transformedOrders.forEach(order => {
          if (order.specifications?.editedImages?.length > 0) {
            console.log(`📸 Order ${order.order_id} has ${order.specifications.editedImages.length} edited images:`, 
              order.specifications.editedImages.map(img => img.filename))
          }
        })
        
        setOrders(transformedOrders)
      }
    } catch (error) {
      // Error fetching assigned orders
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=No+Image`
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // Log the path for debugging
    console.log('Processing image path:', imagePath)
    
    // Clean up the path - remove any leading slash or protocol-like prefixes
    let cleanPath = imagePath.trim()
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1)
    }
    
    // If it looks like a malformed URL or test data, create a placeholder
    if (cleanPath.includes('ffffff') || cleanPath.includes('text=Test') || cleanPath.length < 5) {
      console.log('Using placeholder for malformed path:', cleanPath)
      return `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=Test+Image`
    }
    
    // Use Supabase Storage to get public URL
    try {
      console.log('Getting Supabase storage URL for:', cleanPath)
      const { data } = supabase.storage.from('uploads').getPublicUrl(cleanPath)
      console.log('Generated URL:', data.publicUrl)
      return data.publicUrl
    } catch (error) {
      console.error('Error generating storage URL:', error)
      // Return a placeholder if URL generation fails
      return `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=Error+Loading`
    }
  }

  const downloadOriginalImage = async (imageUrl, fileName) => {
    try {
      if (imageUrl) {
        // Check if it's a Supabase storage URL or external URL
        let downloadUrl = imageUrl
        
        // If it's a Supabase storage URL, ensure it has download parameter
        if (imageUrl.includes('supabase')) {
          // Add download parameter if not present
          const url = new URL(imageUrl)
          url.searchParams.set('download', fileName)
          downloadUrl = url.toString()
        }
        
        // Create a temporary anchor element and trigger download
        const response = await fetch(downloadUrl)
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = fileName || 'image.jpg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl)
      } else {
        alert('Image URL not available')
      }
    } catch (error) {
      // Fallback to direct link if fetch fails (e.g., CORS issues)
      try {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = fileName || 'image.jpg'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (fallbackError) {
        alert('Error downloading image. Please try right-clicking and saving the image.')
      }
    }
  }

  const handleFileSelect = (orderItemId, files) => {
    setSelectedFiles(prev => ({
      ...prev,
      [orderItemId]: files[0]
    }))
  }

  const uploadEditedImage = async (orderItemId) => {
    const file = selectedFiles[orderItemId]
    if (!file) {
      alert('Please select a file to upload')
      return
    }

    try {
      setUploadingImage(orderItemId)
      console.log('🔄 Starting upload for order item:', orderItemId)
      console.log('📁 File details:', { name: file.name, size: file.size, type: file.type })

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      // Upload the edited image
      const fileExt = file.name.split('.').pop()
      const fileName = `edited_${orderItemId}_${Date.now()}.${fileExt}`
      const filePath = `edited/${fileName}`

      console.log('📤 Uploading to path:', filePath)

      // Try uploading to 'uploads' bucket first, then 'images' if that fails
      let uploadResult
      try {
        uploadResult = await supabase.storage
          .from('uploads')
          .upload(filePath, file)
      } catch (uploadsError) {
        console.log('⚠️ uploads bucket failed, trying images bucket')
        uploadResult = await supabase.storage
          .from('images')
          .upload(filePath, file)
      }

      if (uploadResult.error) {
        console.error('❌ Upload error:', uploadResult.error)
        throw uploadResult.error
      }

      console.log('✅ Upload successful:', uploadResult.data)

      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from(uploadResult.data.path.includes('uploads/') ? 'uploads' : 'images')
        .getPublicUrl(uploadResult.data.path)

      console.log('📸 Public URL generated:', publicUrlData.publicUrl)

      // Update the order item with the edited image information
      const orderItem = orders.find(o => o.id === orderItemId)
      if (!orderItem) throw new Error('Order item not found')
      
      // Get current specifications and add edited image
      const currentSpecs = orderItem.specifications || { photos: [] }
      const editedImages = currentSpecs.editedImages || []
      
      // Add the new edited image
      editedImages.push({
        url: uploadResult.data.path,
        publicUrl: publicUrlData.publicUrl,
        filename: fileName,
        originalFilename: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.id
      })

      // Update specifications with edited images
      const updatedSpecs = {
        ...currentSpecs,
        editedImages: editedImages
      }

      console.log('🔄 Updating order item with edited image info')
      const { error: itemUpdateError } = await supabase
        .from('order_items')
        .update({
          specifications: updatedSpecs
        })
        .eq('id', orderItemId)

      if (itemUpdateError) {
        console.error('❌ Order item update error:', itemUpdateError)
        throw itemUpdateError
      }

      console.log('🔄 Updating order status to completed')
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderItem.order_id)

      if (orderUpdateError) {
        console.error('❌ Order update error:', orderUpdateError)
        throw orderUpdateError
      }

      console.log('✅ Order and order item updated successfully')

      // Clear the selected file
      setSelectedFiles(prev => {
        const updated = { ...prev }
        delete updated[orderItemId]
        return updated
      })

      // Force a complete refresh of orders data with a brief delay
      console.log('🔄 Refreshing orders data...')
      setLoading(true) // This will trigger loading state
      
      // Small delay to ensure database has processed the update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await fetchAssignedOrders()
      console.log('✅ Orders data refreshed - fetching complete')
      
      alert('Image uploaded successfully! Order marked as completed.')
    } catch (error) {
      console.error('❌ Upload failed:', error)
      alert(`Error uploading image: ${error.message}`)
    } finally {
      setUploadingImage(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const markAsInProgress = async (orderItemId) => {
    try {
      // Update the order status since that's where we track editor progress
      const orderItem = orders.find(o => o.id === orderItemId)
      if (!orderItem) return
      
      const { error } = await supabase
        .from('orders')
        .update({ status: 'in_progress' })
        .eq('id', orderItem.order_id)

      if (error) throw error
      await fetchAssignedOrders()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (profile?.role !== 'editor') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">You need editor privileges to access this page.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Editor Dashboard</h1>
        <p className="text-gray-600">Manage your assigned photo editing orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === 'in_progress').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'assigned').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Assigned Orders</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders assigned</h3>
            <p className="text-gray-600">You don't have any orders assigned to you yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((orderItem) => (
              <div key={orderItem.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{orderItem.order_id}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(orderItem.status)}`}>
                        {orderItem.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><span className="font-medium">Customer:</span> {orderItem.orders?.profiles?.full_name || 'N/A'}</p>
                        <p><span className="font-medium">Service:</span> {orderItem.services?.name}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Assigned:</span> {new Date(orderItem.assigned_at).toLocaleDateString()}</p>
                        <p><span className="font-medium">Quantity:</span> {orderItem.quantity} images</p>
                      </div>
                    </div>

                    {/* Original Images */}
                    {orderItem.specifications?.photos && orderItem.specifications.photos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Original Images ({orderItem.specifications.photos.length}):
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {orderItem.specifications.photos.map((photo, index) => (
                            <div key={index} className="relative group">
                              {photo.url ? (
                                <img
                                  src={getImageUrl(photo.url)}
                                  alt={photo.filename || 'Original image'}
                                  className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                                  loading="lazy"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImage(photo)
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div className="w-full h-16 hidden items-center justify-center bg-gray-100 rounded border">
                                <div className="text-center">
                                  <ImageIcon className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">No image</p>
                                </div>
                              </div>
                              
                              {/* Hover overlay with actions */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImage(photo)
                                  }}
                                  className="bg-white text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors"
                                  title="Preview image"
                                >
                                  <ZoomIn className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    downloadOriginalImage(photo.url, photo.filename)
                                  }}
                                  className="bg-white text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors"
                                  title="Download original image"
                                >
                                  <Download className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Edited Images */}
                    {orderItem.specifications?.editedImages && orderItem.specifications.editedImages.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Edited Images ({orderItem.specifications.editedImages.length}):
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {orderItem.specifications.editedImages.map((editedImage, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={editedImage.publicUrl || getImageUrl(editedImage.url)}
                                alt={editedImage.filename || 'Edited image'}
                                className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity ring-2 ring-green-500"
                                loading="lazy"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPreviewImage({
                                    url: editedImage.url,
                                    filename: editedImage.filename,
                                    size: editedImage.size
                                  })
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                              <div className="w-full h-16 hidden items-center justify-center bg-gray-100 rounded border">
                                <div className="text-center">
                                  <ImageIcon className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">No image</p>
                                </div>
                              </div>
                              
                              {/* Green checkmark indicator */}
                              <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                                <CheckCircle className="h-3 w-3" />
                              </div>
                              
                              {/* Hover overlay with actions */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImage({
                                      url: editedImage.url,
                                      filename: editedImage.filename,
                                      size: editedImage.size
                                    })
                                  }}
                                  className="bg-white text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors"
                                  title="Preview edited image"
                                >
                                  <ZoomIn className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    downloadOriginalImage(editedImage.publicUrl || editedImage.url, editedImage.filename)
                                  }}
                                  className="bg-white text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors"
                                  title="Download edited image"
                                >
                                  <Download className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
                    {orderItem.hasNoItems ? (
                      <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                        <p className="font-medium">Order has no items</p>
                        <p>This order exists but contains no work items to edit.</p>
                      </div>
                    ) : (
                      <>
                        {orderItem.status === 'assigned' && (
                          <button
                            onClick={() => markAsInProgress(orderItem.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            Start Working
                          </button>
                        )}

                    {orderItem.status !== 'cancelled' && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(orderItem.id, e.target.files)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <button
                          onClick={() => uploadEditedImage(orderItem.id)}
                          disabled={!selectedFiles[orderItem.id] || uploadingImage === orderItem.id}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
                        >
                          {uploadingImage === orderItem.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>
                                {orderItem.specifications?.editedImages?.length > 0 ? 'Upload Another' : 'Upload Edited'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                        {orderItem.status === 'completed' && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed on {new Date(orderItem.completed_at).toLocaleDateString()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close button */}
            <button
              onClick={() => {
                setPreviewImage(null)
                setImageInfo(null)
              }}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Image */}
            <img
              src={getImageUrl(previewImage.url)}
              alt={previewImage.filename}
              className="max-w-full max-h-full object-contain rounded-lg"
              onLoad={(e) => {
                const img = e.target
                setImageInfo({
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  displayWidth: img.width,
                  displayHeight: img.height
                })
              }}
            />
            
            {/* Image info and actions */}
            <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900 truncate" title={previewImage.filename}>
                    {previewImage.filename}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {imageInfo ? (
                      <>
                        {`${imageInfo.width} × ${imageInfo.height} pixels`}
                        {(previewImage.fileSize || previewImage.size) && (
                          <> • {previewImage.fileSize ? 
                            `${(previewImage.fileSize / 1024 / 1024).toFixed(2)} MB` : 
                            `${(previewImage.size / 1024 / 1024).toFixed(2)} MB`
                          }</>
                        )}
                      </>
                    ) : previewImage.fileSize ? 
                      `${(previewImage.fileSize / 1024 / 1024).toFixed(2)} MB` : 
                      previewImage.size ? 
                        `${(previewImage.size / 1024 / 1024).toFixed(2)} MB` : 
                        'Loading image info...'
                    }
                  </p>
                </div>
                <button
                  onClick={() => downloadOriginalImage(previewImage.url, previewImage.filename)}
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
  )
}