import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { supabase } from '../lib/supabase'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Image,
  Download,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3
} from 'lucide-react'

export default function Orders() {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState({})
  const [processingRevision, setProcessingRevision] = useState({})
  const [revisionNotes, setRevisionNotes] = useState({})

  useEffect(() => {
    if (user) {
      fetchOrderItems()
      // Refresh every 30 seconds
      const interval = setInterval(fetchOrderItems, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchOrderItems = async () => {
    try {
      // Fetch all order items for the user with related data
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          order:orders!inner(
            id,
            order_number,
            created_at,
            status,
            user_id,
            payment_status
          ),
          service:services(*),
          revisions(
            id,
            status,
            notes,
            requested_at,
            completed_at,
            assigned_to,
            revision_images(*)
          )
        `)
        .eq('order.user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching order items:', error)
        showError('Failed to load your orders')
        return
      }

      // Process items to determine their effective status
      const processedItems = data.map(item => {
        // Determine item status based on edited images and revisions
        let itemStatus = item.order.status
        
        // If item has edited images, it's at least completed
        if (item.specifications?.editedImages?.length > 0) {
          itemStatus = 'completed'
        }
        
        // Check for active revisions
        const activeRevision = item.revisions?.find(r => r.status === 'pending')
        if (activeRevision) {
          itemStatus = 'revision'
        }
        
        // Get latest completed revision for display
        const completedRevisions = item.revisions?.filter(r => r.status === 'completed') || []
        const latestRevision = completedRevisions.sort((a, b) => 
          new Date(b.completed_at) - new Date(a.completed_at)
        )[0]
        
        return {
          ...item,
          itemStatus,
          activeRevision,
          latestRevision,
          hasEditedImages: item.specifications?.editedImages?.length > 0
        }
      })

      setOrderItems(processedItems)
    } catch (error) {
      console.error('Error:', error)
      showError('An error occurred while loading orders')
    } finally {
      setLoading(false)
    }
  }

  const toggleItemExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const requestRevision = async (itemId) => {
    const notes = revisionNotes[itemId]?.trim()
    
    if (!notes) {
      showError('Please provide revision notes')
      return
    }

    setProcessingRevision(prev => ({ ...prev, [itemId]: true }))

    try {
      // First, get the order item to find the assigned editor
      const { data: orderItemData, error: itemError } = await supabase
        .from('order_items')
        .select(`
          assigned_editor,
          order:orders!inner(
            assigned_editor
          )
        `)
        .eq('id', itemId)
        .single()

      if (itemError) {
        console.error('Error fetching order item:', itemError)
        showError('Failed to get order details')
        return
      }

      // Determine the effective editor (item-level takes precedence over order-level)
      const effectiveEditor = orderItemData.assigned_editor || orderItemData.order.assigned_editor

      if (!effectiveEditor) {
        showError('No editor assigned to this order. Please contact support.')
        return
      }

      // Create revision request with proper assignment
      const { error } = await supabase
        .from('revisions')
        .insert({
          order_item_id: itemId,
          requested_by: user.id,
          assigned_to: effectiveEditor, // Auto-assign to the effective editor
          status: 'pending',
          notes,
          requested_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating revision:', error)
        showError('Failed to request revision')
        return
      }

      showSuccess('Revision request submitted successfully!')
      setRevisionNotes(prev => ({ ...prev, [itemId]: '' }))
      
      // Refresh data
      await fetchOrderItems()
    } catch (error) {
      console.error('Error:', error)
      showError('An error occurred')
    } finally {
      setProcessingRevision(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      assigned: { color: 'bg-blue-100 text-blue-800', icon: Package, text: 'Assigned' },
      in_progress: { color: 'bg-indigo-100 text-indigo-800', icon: Clock, text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' },
      revision: { color: 'bg-orange-100 text-orange-800', icon: Edit3, text: 'In Revision' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: Clock, text: 'Processing' }
    }
    
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1.5" />
        {badge.text}
      </span>
    )
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // Use Supabase Storage to get public URL
    try {
      const url = supabase.storage.from('uploads').getPublicUrl(imagePath).data.publicUrl
      return url
    } catch (error) {
      console.error('Error getting image URL:', error)
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
      
      // Add edited/ prefix if not present
      if (!path.startsWith('edited/')) {
        path = `edited/${path}`
      }
      
      return supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl
    }
    return editedImage.url || null
  }

  const canRequestRevision = (item) => {
    // Can request revision if item has edited images and no pending revision
    return item.hasEditedImages && !item.activeRevision
  }

  const getDisplayImages = (item) => {
    const allImages = []
    let primaryLabel = 'Images'
    let showRevisionBadge = false

    // Always include original images first if available
    if (item.specifications?.photos?.length > 0) {
      const originalImages = item.specifications.photos.map(img => ({
        url: getImageUrl(img.url),
        type: 'original',
        filename: img.filename,
        label: 'Original'
      }))
      allImages.push(...originalImages)
    }

    // Then add latest processed images (revision takes priority over edited)
    if (item.latestRevision?.revision_images?.length > 0) {
      const revisionImages = item.latestRevision.revision_images.map(img => {
        let imageUrl = img.image_url
        
        // If the image_url doesn't start with http, it's a storage path
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = getImageUrl(imageUrl)
        }
        
        return {
          url: imageUrl,
          type: 'revision',
          uploadedAt: img.uploaded_at,
          label: 'Revised'
        }
      })
      allImages.push(...revisionImages)
      primaryLabel = 'Before & After (Latest Revision)'
      showRevisionBadge = true
    } else if (item.specifications?.editedImages?.length > 0) {
      const editedImages = item.specifications.editedImages.map(img => ({
        url: getEditedImageUrl(img),
        type: 'edited',
        uploadedAt: img.uploadedAt,
        label: 'Edited'
      }))
      allImages.push(...editedImages)
      primaryLabel = 'Before & After'
    } else if (allImages.length > 0) {
      primaryLabel = 'Original Images'
    }

    return {
      images: allImages,
      label: primaryLabel,
      showRevisionBadge
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (orderItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600">Your photo editing orders will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
        
        <div className="space-y-4">
          {orderItems.map((item) => {
            const isExpanded = expandedItems[item.id]
            const displayData = getDisplayImages(item)
            
            return (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Item Header */}
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.service?.name}
                        </h3>
                        {getStatusBadge(item.itemStatus)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Package className="w-4 h-4 mr-1" />
                          Order #{item.order.order_number}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(item.order.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Image className="w-4 h-4 mr-1" />
                          {item.quantity} {item.quantity === 1 ? 'image' : 'images'}
                        </span>
                      </div>
                      
                      {item.specifications?.notes && (
                        <p className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          Instructions: {item.specifications.notes}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleItemExpanded(item.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          View Details
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                    {/* Images Section */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        {displayData.label}
                        {displayData.showRevisionBadge && (
                          <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                            Revision
                          </span>
                        )}
                      </h4>
                      
                      {displayData.images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {displayData.images.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <div className="relative">
                                <img
                                  src={img.url}
                                  alt={`${img.label} ${idx + 1}`}
                                  className={`w-full h-32 object-cover rounded-lg border ${
                                    img.type === 'original' ? 'border-gray-300' :
                                    img.type === 'revision' ? 'border-orange-400 ring-2 ring-orange-200' :
                                    'border-green-400 ring-2 ring-green-200'
                                  }`}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextElementSibling.style.display = 'flex'
                                  }}
                                />
                                <div className="w-full h-32 hidden items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                                  <Image className="h-6 w-6 text-gray-400" />
                                  <span className="ml-2 text-xs text-gray-500">Image not found</span>
                                </div>
                                
                                {/* Image type badge */}
                                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                                  img.type === 'original' ? 'bg-gray-100 text-gray-700' :
                                  img.type === 'revision' ? 'bg-orange-100 text-orange-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {img.label}
                                </div>
                              </div>
                              
                              {/* Download overlay for edited/revision images */}
                              {img.type === 'edited' || img.type === 'revision' ? (
                                <a
                                  href={img.url}
                                  download
                                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                >
                                  <Download className="w-6 h-6 text-white" />
                                </a>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No images available</p>
                      )}
                    </div>
                    
                    {/* Revision History */}
                    {item.revisions && item.revisions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Revision History</h4>
                        <div className="space-y-2">
                          {item.revisions.map((revision) => (
                            <div key={revision.id} className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  revision.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {revision.status === 'pending' ? 'In Progress' : 'Completed'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(revision.requested_at).toLocaleDateString()}
                                </span>
                              </div>
                              {revision.notes && (
                                <p className="text-sm text-gray-600 mt-2">
                                  Notes: {revision.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Revision Request */}
                    {canRequestRevision(item) && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Request Revision</h4>
                        <div className="space-y-3">
                          <textarea
                            value={revisionNotes[item.id] || ''}
                            onChange={(e) => setRevisionNotes(prev => ({ 
                              ...prev, 
                              [item.id]: e.target.value 
                            }))}
                            placeholder="Describe what changes you'd like..."
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows="3"
                          />
                          <button
                            onClick={() => requestRevision(item.id)}
                            disabled={processingRevision[item.id] || !revisionNotes[item.id]?.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium flex items-center"
                          >
                            {processingRevision[item.id] ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Request Revision
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Active Revision Notice */}
                    {item.activeRevision && (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold text-orange-900">Revision in Progress</h4>
                            <p className="text-sm text-orange-700 mt-1">
                              Your revision request is being processed. You'll see the updated images here once complete.
                            </p>
                            {item.activeRevision.notes && (
                              <p className="text-sm text-orange-600 mt-2">
                                Your notes: {item.activeRevision.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}