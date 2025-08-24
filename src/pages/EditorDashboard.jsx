import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
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
  ZoomIn,
  RefreshCw,
  Package
} from 'lucide-react'

export default function EditorDashboard() {
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState({})
  const [previewImage, setPreviewImage] = useState(null)
  const [imageInfo, setImageInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('assigned')

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

      // Also get orders that have items or revisions assigned to this editor
      // First, get order items assigned to this editor
      const { data: assignedItems, error: assignedItemsError } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('assigned_editor', user.id)

      // Second, get orders that have revisions assigned to this editor (even if order is not assigned to them)
      const { data: revisionsAssignedToEditor, error: revisionsError } = await supabase
        .from('revisions')
        .select('order_item_id, order_items!inner(order_id)')
        .eq('assigned_to', user.id)
        .eq('status', 'pending')

      let additionalOrders = []
      const additionalOrderIds = new Set()
      
      // Add orders from assigned items
      if (assignedItems) {
        assignedItems.forEach(item => additionalOrderIds.add(item.order_id))
      }
      
      // Add orders from assigned revisions
      if (revisionsAssignedToEditor) {
        revisionsAssignedToEditor.forEach(rev => additionalOrderIds.add(rev.order_items.order_id))
      }
      
      // Filter out orders we already have
      const newOrderIds = [...additionalOrderIds].filter(orderId => 
        !assignedOrders.some(order => order.id === orderId)
      )

      if (newOrderIds.length > 0) {
        const { data: extraOrders, error: extraOrdersError } = await supabase
          .from('orders')
          .select('*')
          .in('id', newOrderIds)

        if (!extraOrdersError) {
          additionalOrders = extraOrders || []
        }
      }

      // Combine assigned orders and orders with revisions assigned to this editor
      const allOrders = [...assignedOrders, ...additionalOrders]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      if (ordersError) throw ordersError

      if (!allOrders || allOrders.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // Get order items for these orders with specifications
      const orderIds = allOrders.map(order => order.id)
      
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
          assigned_editor,
          services (
            name,
            description
          )
        `)
        .in('order_id', orderIds)

      if (itemsError) throw itemsError

      // Get customer profiles for these orders
      const customerIds = allOrders.map(order => order.user_id)
      
      const { data: customerProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds)

      if (profilesError) throw profilesError

      // Get revisions for these order items from the new revisions table
      const orderItemIds = orderItems ? orderItems.map(item => item.id) : []
      let revisions = []
      
      if (orderItemIds.length > 0) {
        const { data: revisionsData, error: revisionsError } = await supabase
          .from('revisions')
          .select(`
            *,
            revision_images (
              id,
              image_url,
              filename,
              file_size,
              uploaded_at
            )
          `)
          .in('order_item_id', orderItemIds)
          .order('created_at', { ascending: false })

        if (!revisionsError) {
          revisions = revisionsData || []
        }
      }

      // Combine all data
      if (!orderItems || orderItems.length === 0) {
        // If no order items, show the orders anyway but indicate they have no items
        const transformedOrders = allOrders.map(order => {
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
            revisions: [],
            hasNoItems: true
          }
        })
        setOrders(transformedOrders)
      } else {
        const transformedOrders = (orderItems || [])
          .filter(item => {
            // Only show items that are assigned to the current editor
            // Either directly assigned to the item, or through the order, or has revisions assigned to this editor
            const order = allOrders.find(o => o.id === item.order_id)
            const effectiveEditor = item.assigned_editor || order?.assigned_editor
            const hasAssignedRevisions = revisions.some(r => 
              r.order_item_id === item.id && r.assigned_to === user.id
            )
            
            return effectiveEditor === user.id || hasAssignedRevisions
          })
          .map(item => {
            const order = allOrders.find(o => o.id === item.order_id)
            const customer = customerProfiles.find(p => p.id === order?.user_id)
            // Get revisions for this specific order item
            const itemRevisions = revisions.filter(r => r.order_item_id === item.id)
            
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
              revisions: itemRevisions, // Store revisions from the database
              assigned_editor: item.assigned_editor, // Store item-level assignment
              effective_editor: item.assigned_editor || order?.assigned_editor, // Calculated effective editor
              orders: {
                id: order?.id,
                status: order?.status,
                created_at: order?.created_at,
                profiles: customer
              },
              services: item.services
            }
          })
        
        // Debug logging - let's also check what raw data we got
        console.log('👤 Debug - Current editor ID:', user.id)
        console.log('🔍 Debug - Raw orders data:', allOrders.map(o => ({
          id: o.id,
          status: o.status,
          assigned_editor: o.assigned_editor,
          user_id: o.user_id,
          isAssignedToCurrentEditor: o.assigned_editor === user.id
        })))
        
        console.log('🔍 Debug - Raw revisions data:', revisions.map(r => ({
          id: r.id,
          order_item_id: r.order_item_id,
          status: r.status,
          assigned_to: r.assigned_to,
          requested_by: r.requested_by
        })))
        
        transformedOrders.forEach(o => {
          console.log(`🔍 Debug - Order #${o.order_id}:`, {
            status: o.status,
            revisionsCount: o.revisions?.length || 0,
            pendingRevisions: o.revisions?.filter(rev => rev.status === 'pending').length || 0,
            revisionDetails: o.revisions?.map(rev => ({
              id: rev.id,
              status: rev.status,
              assigned_to: rev.assigned_to,
              notes: rev.notes?.substring(0, 50) + '...'
            })) || []
          })
        })
        
        setOrders(transformedOrders)
      }
    } catch (error) {
      // Error fetching assigned orders
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imagePath, bucket = 'uploads') => {
    if (!imagePath) {
      return `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=No+Image`
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // Clean up the path - remove any leading slash
    let cleanPath = imagePath.trim()
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1)
    }
    
    // If it looks like a malformed URL or test data, create a placeholder
    if (cleanPath.includes('ffffff') || cleanPath.includes('text=Test') || cleanPath.length < 5) {
      return `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=Test+Image`
    }
    
    // Use Supabase Storage to get public URL with correct bucket
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath)
      return data.publicUrl
    } catch (error) {
      console.error('❌ Error generating storage URL:', error)
      // Return a placeholder if URL generation fails
      return `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=Error+Loading`
    }
  }

  // Helper function specifically for edited images
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
    
    // Last resort placeholder
    return `https://via.placeholder.com/200x200/e5e7eb/6b7280?text=No+Image`
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
        showError('Error downloading image. Please try right-clicking and saving the image.')
      }
    }
  }

  const handleFileSelect = (orderItemId, files) => {
    if (files && files[0]) {
      setSelectedFiles(prev => ({
        ...prev,
        [orderItemId]: files[0]
      }))
    }
  }

  const uploadEditedImage = async (orderItemId) => {
    const file = selectedFiles[orderItemId]
    if (!file) {
      showError('Please select a file to upload')
      return
    }

    try {
      setUploadingImage(orderItemId)

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      // Upload the edited image to uploads/edited/ folder
      const fileExt = file.name.split('.').pop()
      const fileName = `edited_${orderItemId}_${Date.now()}.${fileExt}`
      const filePath = `edited/${fileName}`


      // Upload to uploads bucket in edited/ folder
      const uploadResult = await supabase.storage
        .from('uploads')
        .upload(filePath, file)
      
      const bucketUsed = 'uploads'

      if (uploadResult.error) {
        throw uploadResult.error
      }

      // The uploadResult.data.path should be just the path we uploaded (edited/filename.jpg)
      // It should NOT include the bucket name prefix
      let storagePath = uploadResult.data.path || filePath
      
      // Get the public URL for the uploaded image using the clean path
      const { data: publicUrlData } = supabase.storage
        .from(bucketUsed)
        .getPublicUrl(storagePath)


      // Update the order item with the edited image information
      const orderItem = orders.find(o => o.id === orderItemId)
      if (!orderItem) throw new Error('Order item not found')
      
      // Get current specifications and add edited image
      const currentSpecs = orderItem.specifications || { photos: [] }
      let editedImages = currentSpecs.editedImages || []
      
      // Create new edited image object
      const newEditedImage = {
        url: storagePath, // Store the clean path (edited/filename.jpg)
        publicUrl: publicUrlData.publicUrl,
        filename: fileName,
        originalFilename: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.id
      }
      
      // Check if this is a revision upload by looking for pending revisions in the database
      const pendingRevisions = orderItem.revisions?.filter(rev => rev.status === 'pending') || []
      
      if (pendingRevisions.length > 0) {
        console.log('📝 Processing revision upload for order item:', orderItemId)
        
        // Get the latest pending revision
        const latestRevision = pendingRevisions[0] // Already sorted by created_at desc
        
        // Update the revision status to completed
        const { error: revisionUpdateError } = await supabase
          .from('revisions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            assigned_to: user.id // Ensure the editor is assigned
          })
          .eq('id', latestRevision.id)

        if (revisionUpdateError) {
          console.error('Error updating revision status:', revisionUpdateError)
          throw revisionUpdateError
        }
        
        // Insert the image into revision_images table
        const { error: imageInsertError } = await supabase
          .from('revision_images')
          .insert({
            revision_id: latestRevision.id,
            image_url: storagePath,
            filename: fileName,
            file_size: file.size,
            uploaded_by: user.id
          })

        if (imageInsertError) {
          console.error('Error inserting revision image:', imageInsertError)
          throw imageInsertError
        }
        
        console.log('✅ Marked revision as completed:', {
          revisionId: latestRevision.id,
          completedAt: new Date().toISOString()
        })
        
        // Also add to main edited images array in specifications (for compatibility)
        editedImages.push(newEditedImage)
        
        // Update specifications with edited images
        const updatedSpecs = {
          ...currentSpecs,
          editedImages: editedImages
        }
        
        // Update order item specifications
        const { error: itemUpdateError } = await supabase
          .from('order_items')
          .update({
            specifications: updatedSpecs
          })
          .eq('id', orderItemId)

        if (itemUpdateError) {
          throw itemUpdateError
        }
        
        // Update order status back to completed since revision is done
        const { error: orderStatusError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderItem.order_id)

        if (orderStatusError) {
          console.error('Error updating order status:', orderStatusError)
        }
        
        showSuccess('Revision completed successfully!')
      } else {
        // Regular upload (not a revision)
        editedImages.push(newEditedImage)
        
        // Update specifications with edited images
        const updatedSpecs = {
          ...currentSpecs,
          editedImages: editedImages
        }
        
        // Update order item
        const { error: itemUpdateError } = await supabase
          .from('order_items')
          .update({
            specifications: updatedSpecs
          })
          .eq('id', orderItemId)

        if (itemUpdateError) {
          throw itemUpdateError
        }
        
        // Update order status to completed for regular uploads
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderItem.order_id)

        if (orderUpdateError) {
          throw orderUpdateError
        }
        
        showSuccess('Image uploaded successfully! Order marked as completed.')
      }

      // Clear the selected file and reset file input
      setSelectedFiles(prev => {
        const updated = { ...prev }
        delete updated[orderItemId]
        return updated
      })
      
      // Clear the file input field
      const fileInput = document.getElementById(`file-upload-${orderItemId}`)
      if (fileInput) {
        fileInput.value = ''
      }

      // Force a complete refresh of orders data with a brief delay
      setLoading(true) // This will trigger loading state
      
      // Small delay to ensure database has processed the update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await fetchAssignedOrders()
    } catch (error) {
      showError(`Error uploading image: ${error.message}`)
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
      showSuccess('Status updated to in progress')
    } catch (error) {
      console.error('Error updating status:', error)
      showError('Error updating status')
    }
  }

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'assigned':
        // Show orders that are assigned/in_progress AND don't have pending revisions AND aren't in revision status
        return orders.filter(o => {
          const isAssignedStatus = ['assigned', 'in_progress'].includes(o.status)
          const hasPendingRevisions = o.revisions?.some(rev => rev.status === 'pending')
          
          // Debug logging for revision status orders
          if (o.status === 'revision') {
            console.log('🔍 Debug - Order in revision status found:', {
              orderId: o.order_id,
              status: o.status,
              isAssignedStatus,
              hasPendingRevisions,
              revisionsCount: o.revisions?.length || 0,
              pendingRevisions: o.revisions?.filter(rev => rev.status === 'pending').length || 0,
              revisionDetails: o.revisions?.map(rev => ({
                id: rev.id,
                status: rev.status,
                assigned_to: rev.assigned_to,
                current_editor: user.id,
                is_assigned_to_me: rev.assigned_to === user.id
              }))
            })
          }
          
          // Show only if: (assigned OR in_progress) AND no pending revisions
          // This automatically excludes 'revision' status orders
          return isAssignedStatus && !hasPendingRevisions
        })
      case 'completed':
        return orders.filter(o => o.status === 'completed')
      case 'revision':
        // For revision tab, show items that have pending revision requests assigned to this editor
        // Regardless of the overall order status
        return orders.filter(o => {
          // Check if this item has pending revisions assigned to the current editor
          const myPendingRevisions = o.revisions?.filter(rev => 
            rev.status === 'pending' && rev.assigned_to === user.id
          ) || []
          
          const hasPendingRevisions = myPendingRevisions.length > 0
          
          // Debug logging for revision tab
          console.log('🔄 Debug - Revision tab filter:', {
            orderId: o.order_id,
            status: o.status,
            totalRevisions: o.revisions?.length || 0,
            allPendingRevisions: o.revisions?.filter(rev => rev.status === 'pending').length || 0,
            myPendingRevisions: myPendingRevisions.length,
            currentEditor: user.id,
            revisionDetails: o.revisions?.map(rev => ({
              id: rev.id,
              status: rev.status,
              assigned_to: rev.assigned_to,
              is_mine: rev.assigned_to === user.id
            })),
            willShow: hasPendingRevisions
          })
          
          return hasPendingRevisions
        })
      default:
        return orders
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
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Editor Dashboard</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage your assigned photo editing orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {orders.filter(o => {
                    const isAssignedStatus = ['assigned', 'in_progress'].includes(o.status)
                    const hasPendingRevisions = o.revisions?.some(rev => rev.status === 'pending')
                    return isAssignedStatus && !hasPendingRevisions
                  }).length}
                </p>
              </div>
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">
                  {orders.filter(o => o.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Pending Revisions</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600">
                  {orders.filter(o => o.revisions?.some(rev => rev.status === 'pending')).length}
                </p>
              </div>
              <RefreshCw className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
            </div>
          </div>
      </div>

        {/* Orders List with Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex flex-col sm:flex-row sm:space-x-8 px-4 md:px-6">
              <button
                onClick={() => setActiveTab('assigned')}
                className={`py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors text-center ${
                  activeTab === 'assigned'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block sm:inline">Assigned Orders</span>
                <span className="block sm:inline sm:ml-1">({orders.filter(o => {
                  const isAssignedStatus = ['assigned', 'in_progress'].includes(o.status)
                  const hasPendingRevisions = o.revisions?.some(rev => rev.status === 'pending')
                  return isAssignedStatus && !hasPendingRevisions
                }).length})</span>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors text-center ${
                  activeTab === 'completed'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block sm:inline">Completed</span>
                <span className="block sm:inline sm:ml-1">({orders.filter(o => o.status === 'completed').length})</span>
              </button>
              <button
                onClick={() => setActiveTab('revision')}
                className={`py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors text-center ${
                  activeTab === 'revision'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block sm:inline">Pending Revisions</span>
                <span className="block sm:inline sm:ml-1">({orders.filter(o => o.revisions?.some(rev => rev.status === 'pending')).length})</span>
              </button>
            </nav>
          </div>
        
        {getFilteredOrders().length === 0 ? (
          <div className="p-6 md:p-8 text-center">
            <ImageIcon className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'assigned' && 'No assigned orders'}
              {activeTab === 'completed' && 'No completed orders'}
              {activeTab === 'revision' && 'No orders in revision'}
            </h3>
            <p className="text-gray-600 text-sm md:text-base">
              {activeTab === 'assigned' && "You don't have any orders assigned to you yet."}
              {activeTab === 'completed' && "No orders have been completed yet."}
              {activeTab === 'revision' && "No orders are currently in revision."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="block lg:hidden">
              <div className="divide-y divide-gray-200">
                {getFilteredOrders().map((orderItem) => (
                  <div key={orderItem.id} className="p-4 space-y-4">
                    {/* Order Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            Order #{orderItem.order_id}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(orderItem.status)}`}>
                            {orderItem.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><span className="font-medium">Customer:</span> {orderItem.orders?.profiles?.full_name || 'N/A'}</p>
                          <p><span className="font-medium">Service:</span> {orderItem.services?.name}</p>
                          <p><span className="font-medium">Assigned:</span> {new Date(orderItem.assigned_at).toLocaleDateString()}</p>
                          <p><span className="font-medium">Quantity:</span> {orderItem.quantity} images</p>
                        </div>
                      </div>
                    </div>

                    {/* Original Images */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Original Images</h4>
                      {orderItem.specifications?.photos && orderItem.specifications.photos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {orderItem.specifications.photos.slice(0, 3).map((photo, index) => (
                            <div key={index} className="relative group">
                              {photo.url ? (
                                <img
                                  src={getImageUrl(photo.url)}
                                  alt={photo.filename || 'Original image'}
                                  className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                                  loading="lazy"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImage(photo)
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border">
                                  <ImageIcon className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                          ))}
                          {orderItem.specifications.photos.length > 3 && (
                            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border text-xs text-gray-600">
                              +{orderItem.specifications.photos.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No images</span>
                      )}
                    </div>

                    {/* Instructions */}
                    {orderItem.specifications?.notes && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Instructions</h4>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                          <div className="flex items-start space-x-1">
                            <FileText className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-blue-700 line-clamp-2">{orderItem.specifications.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload Section */}
                    {!orderItem.hasNoItems && orderItem.status !== 'cancelled' && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Upload</h4>
                        <div className="space-y-2">
                          {(activeTab === 'assigned' || activeTab === 'revision') && (
                            <input
                              type="file"
                              accept="image/*"
                              id={`file-upload-mobile-${orderItem.id}`}
                              onChange={(e) => handleFileSelect(orderItem.id, e.target.files)}
                              className="mobile-input w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                          )}
                          {(activeTab === 'assigned' || activeTab === 'revision') && (
                            <button
                              onClick={() => uploadEditedImage(orderItem.id)}
                              disabled={!selectedFiles[orderItem.id] || uploadingImage === orderItem.id}
                              className="w-full min-h-[44px] px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                              {uploadingImage === orderItem.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4" />
                                  <span>
                                    {orderItem.specifications?.editedImages?.length > 0 ? 'Upload Additional' : 'Upload Edited'}
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                          {orderItem.status === 'completed' && (
                            <div className="flex items-center text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Edited Images */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Edited Images</h4>
                      {(() => {
                        let imagesToShow = []
                        
                        if (activeTab === 'revision' && orderItem.status === 'revision') {
                          const completedRevisions = orderItem.revisions?.filter(rev => rev.status === 'completed') || []
                          const latestCompletedRevision = completedRevisions[0]
                          
                          if (latestCompletedRevision?.revision_images?.length > 0) {
                            imagesToShow = latestCompletedRevision.revision_images.map(img => ({
                              url: img.image_url,
                              filename: img.filename,
                              size: img.file_size,
                              uploadedAt: img.uploaded_at
                            }))
                          }
                        } else {
                          imagesToShow = orderItem.specifications?.editedImages || []
                        }
                        
                        return imagesToShow.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {imagesToShow.slice(0, 3).map((editedImage, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={getEditedImageUrl(editedImage)}
                                  alt={editedImage.filename || 'Edited image'}
                                  className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity ring-2 ring-green-500"
                                  loading="lazy"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImage({
                                      url: getEditedImageUrl(editedImage),
                                      filename: editedImage.filename,
                                      size: editedImage.size
                                    })
                                  }}
                                />
                                <div className="absolute top-0 right-0 bg-green-500 text-white rounded-full p-0.5">
                                  <CheckCircle className="h-2 w-2" />
                                </div>
                                {activeTab === 'revision' && (
                                  <div className="absolute bottom-0 left-0 bg-orange-600 text-white text-xs px-1 rounded">
                                    Latest
                                  </div>
                                )}
                              </div>
                            ))}
                            {imagesToShow.length > 3 && (
                              <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border text-xs text-gray-600">
                                +{imagesToShow.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {activeTab === 'revision' ? 'No revised images yet' : 'None yet'}
                          </span>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Images
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edited Images
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredOrders().map((orderItem) => (
                  <tr key={orderItem.id} className="hover:bg-gray-50">
                    {/* Order Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            Order #{orderItem.order_id}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(orderItem.status)}`}>
                            {orderItem.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><span className="font-medium">Customer:</span> {orderItem.orders?.profiles?.full_name || 'N/A'}</p>
                          <p><span className="font-medium">Service:</span> {orderItem.services?.name}</p>
                          <p><span className="font-medium">Assigned:</span> {new Date(orderItem.assigned_at).toLocaleDateString()}</p>
                          <p><span className="font-medium">Quantity:</span> {orderItem.quantity} images</p>
                        </div>
                      </div>
                    </td>

                    {/* Original Images */}
                    <td className="px-6 py-4">
                      {orderItem.specifications?.photos && orderItem.specifications.photos.length > 0 ? (
                        <div className="flex flex-wrap gap-3 max-w-lg">
                          {orderItem.specifications.photos.slice(0, 4).map((photo, index) => (
                            <div key={index} className="relative group">
                              {photo.url ? (
                                <img
                                  src={getImageUrl(photo.url)}
                                  alt={photo.filename || 'Original image'}
                                  className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                                  loading="lazy"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImage(photo)
                                  }}
                                />
                              ) : (
                                <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded border">
                                  <ImageIcon className="h-7 w-7 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImage(photo)
                                  }}
                                  className="bg-white text-gray-900 p-1.5 rounded hover:bg-gray-100 transition-colors"
                                  title="Preview image"
                                >
                                  <ZoomIn className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {orderItem.specifications.photos.length > 4 && (
                            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded border text-sm text-gray-600">
                              +{orderItem.specifications.photos.length - 4}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No images</span>
                      )}
                    </td>

                    {/* Special Instructions */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {orderItem.specifications?.notes ? (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="flex items-start space-x-1">
                              <FileText className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-blue-700 line-clamp-3">{orderItem.specifications.notes}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No instructions</span>
                        )}
                      </div>
                    </td>

                    {/* Upload Section */}
                    <td className="px-6 py-4">
                      {!orderItem.hasNoItems && orderItem.status !== 'cancelled' ? (
                        <div className="space-y-2 max-w-xs">
                          {(activeTab === 'assigned' || activeTab === 'revision') && (
                            <input
                              type="file"
                              accept="image/*"
                              id={`file-upload-${orderItem.id}`}
                              key={`file-upload-${orderItem.id}`}
                              onChange={(e) => handleFileSelect(orderItem.id, e.target.files)}
                              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                          )}
                          <div className="flex flex-col gap-1">
                            {(activeTab === 'assigned' || activeTab === 'revision') && (
                              <button
                                onClick={() => uploadEditedImage(orderItem.id)}
                                disabled={!selectedFiles[orderItem.id] || uploadingImage === orderItem.id}
                                className="w-full px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                              >
                                {uploadingImage === orderItem.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                ) : (
                                  <>
                                    <Upload className="h-3 w-3" />
                                    <span>
                                      {orderItem.specifications?.editedImages?.length > 0 ? 'Upload +' : 'Upload'}
                                    </span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          {orderItem.status === 'completed' && (
                            <div className="flex items-center text-green-600 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span>Done</span>
                            </div>
                          )}
                        </div>
                      ) : orderItem.hasNoItems ? (
                        <span className="text-xs text-amber-600">No items</span>
                      ) : (
                        <span className="text-xs text-gray-500">Cancelled</span>
                      )}
                    </td>

                    {/* Edited Images */}
                    <td className="px-6 py-4">
                      {(() => {
                        let imagesToShow = []
                        
                        // For revision tab, show only the latest revised images from database
                        if (activeTab === 'revision' && orderItem.status === 'revision') {
                          const completedRevisions = orderItem.revisions?.filter(rev => rev.status === 'completed') || []
                          const latestCompletedRevision = completedRevisions[0] // Already sorted by created_at desc
                          
                          if (latestCompletedRevision?.revision_images?.length > 0) {
                            // Map revision_images to the format expected by the UI
                            imagesToShow = latestCompletedRevision.revision_images.map(img => ({
                              url: img.image_url,
                              filename: img.filename,
                              size: img.file_size,
                              uploadedAt: img.uploaded_at
                            }))
                          }
                        } else {
                          // For other tabs, show all edited images
                          imagesToShow = orderItem.specifications?.editedImages || []
                        }
                        
                        return imagesToShow.length > 0 ? (
                          <div className="flex flex-wrap gap-3 max-w-lg">
                            {imagesToShow.slice(0, 4).map((editedImage, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={getEditedImageUrl(editedImage)}
                                  alt={editedImage.filename || 'Edited image'}
                                  className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity ring-2 ring-green-500"
                                  loading="lazy"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImage({
                                      url: getEditedImageUrl(editedImage),
                                      filename: editedImage.filename,
                                      size: editedImage.size
                                    })
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                  }}
                                />
                                <div className="w-24 h-24 hidden items-center justify-center bg-gray-100 rounded border">
                                  <div className="text-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-500">Load failed</p>
                                  </div>
                                </div>
                                <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                                  <CheckCircle className="h-3 w-3" />
                                </div>
                                {activeTab === 'revision' && (
                                  <div className="absolute bottom-1 left-1 bg-orange-600 text-white text-xs px-1 py-0.5 rounded">
                                    Latest
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPreviewImage({
                                        url: getEditedImageUrl(editedImage),
                                        filename: editedImage.filename,
                                        size: editedImage.size
                                      })
                                    }}
                                    className="bg-white text-gray-900 p-1.5 rounded hover:bg-gray-100 transition-colors"
                                    title="Preview edited image"
                                  >
                                    <ZoomIn className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {imagesToShow.length > 4 && (
                              <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded border text-sm text-gray-600">
                                +{imagesToShow.length - 4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {activeTab === 'revision' ? 'No revised images yet' : 'None yet'}
                          </span>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full w-full">
              {/* Close button */}
              <button
                onClick={() => {
                  setPreviewImage(null)
                  setImageInfo(null)
                }}
                className="absolute top-2 md:top-4 right-2 md:right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              
              {/* Image */}
              <img
                src={getImageUrl(previewImage.url)}
                alt={previewImage.filename}
                className="max-w-full max-h-[70vh] md:max-h-full object-contain rounded-lg mx-auto"
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
              <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 right-2 md:right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 md:p-4">
                <div className="space-y-2 md:space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900 truncate text-sm md:text-base" title={previewImage.filename}>
                      {previewImage.filename}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600">
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
                    className="w-full bg-purple-600 text-white px-4 py-3 md:py-2 rounded-md hover:bg-purple-700 flex items-center justify-center space-x-2 min-h-[44px] text-sm md:text-base"
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