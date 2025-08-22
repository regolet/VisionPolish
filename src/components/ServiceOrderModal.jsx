import { useState } from 'react'
import { X, ShoppingCart, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PhotoUpload from './PhotoUpload'
import { supabase } from '../lib/supabase'

export default function ServiceOrderModal({ service, isOpen, onClose, user, onAddToCart }) {
  const navigate = useNavigate()
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const [photoInstructions, setPhotoInstructions] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !service) return null

  const handleUploadComplete = (files) => {
    setUploadedPhotos(files)
    // Initialize instructions for new photos
    const newInstructions = {}
    files.forEach(file => {
      if (!photoInstructions[file.id]) {
        newInstructions[file.id] = ''
      }
    })
    setPhotoInstructions(prev => ({ ...prev, ...newInstructions }))
    setError('')
  }

  const updatePhotoInstructions = (photoId, instructions) => {
    setPhotoInstructions(prev => ({
      ...prev,
      [photoId]: instructions
    }))
  }

  const handleAddToCart = async () => {
    if (!user) {
      setError('Please sign in to add items to cart')
      return
    }

    if (uploadedPhotos.length === 0) {
      setError('Please upload at least one photo to edit')
      return
    }

    setLoading(true)
    setError('')

    try {
      const createdCartItems = []
      
      // Create separate cart item for each photo
      for (const photo of uploadedPhotos) {
        const instructions = photoInstructions[photo.id] || ''
        
        // Create individual cart item for this photo
        const { data: cartItem, error: cartError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            service_id: service.id,
            quantity: 1, // Always 1 per photo
            specifications: {
              photos: [{
                url: photo.url,
                path: photo.path,
                filename: photo.file.name,
                fileSize: photo.file.size
              }],
              notes: instructions,
              photoName: photo.file.name
            }
          })
          .select()
          .single()

        if (cartError) {
          console.error('Error creating cart item for photo:', photo.file.name, cartError)
          throw cartError
        }

        createdCartItems.push(cartItem)

        // Save uploaded image to database
        const { error: imageError } = await supabase
          .from('uploaded_images')
          .insert({
            cart_item_id: cartItem.id,
            original_url: photo.url,
            file_name: photo.file.name,
            file_size: photo.file.size,
            mime_type: photo.file.type,
            upload_status: 'completed'
          })

        if (imageError) {
          console.error('Error saving image for photo:', photo.file.name, imageError)
          // Continue with other photos even if one image save fails
        }
      }

      // Notify parent component with all created items
      if (onAddToCart) {
        createdCartItems.forEach(item => onAddToCart(item))
      }

      // Reset form
      setUploadedPhotos([])
      setPhotoInstructions({})
      
      // Show success and close modal
      alert(`${uploadedPhotos.length} photo${uploadedPhotos.length !== 1 ? 's' : ''} added to cart as separate items for ${service.name}!`)
      onClose()
      
      // Redirect to cart page with a small delay to ensure data is saved
      setTimeout(() => {
        navigate('/cart')
      }, 500)

    } catch (err) {
      console.error('Error adding to cart:', err)
      setError('Failed to add to cart. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = service.base_price * uploadedPhotos.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{service.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Service Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              </div>
              <div>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Price:</span> ${service.base_price} per photo</p>
                  <p><span className="font-medium">Turnaround:</span> {service.turnaround_time}</p>
                  <p><span className="font-medium">Category:</span> {service.category}</p>
                </div>
                {service.features && service.features.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-sm mb-2">Features included:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {service.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="mb-6">
            <PhotoUpload
              onUploadComplete={handleUploadComplete}
              maxFiles={10}
              serviceId={service.id}
            />
          </div>

          {/* Individual Photo Instructions */}
          {uploadedPhotos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Photo Instructions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add specific instructions for each photo. Each photo will be treated as a separate order item.
              </p>
              
              <div className="space-y-4">
                {uploadedPhotos.map((photo, index) => (
                  <div key={photo.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      {/* Photo Thumbnail */}
                      <div className="flex-shrink-0">
                        <img
                          src={photo.preview}
                          alt={photo.file.name}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                      
                      {/* Photo Details and Instructions */}
                      <div className="flex-1">
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {photo.file.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {(photo.file.size / 1024 / 1024).toFixed(1)} MB • ${service.base_price} per photo
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Special Instructions for this photo (Optional)
                          </label>
                          <textarea
                            value={photoInstructions[photo.id] || ''}
                            onChange={(e) => updatePhotoInstructions(photo.id, e.target.value)}
                            rows="2"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                            placeholder={`Specific editing requirements for ${photo.file.name}...`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Each photo will be added as a separate cart item with its own instructions. 
                  This allows for individual pricing and tracking in your orders.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Pricing Summary */}
          {uploadedPhotos.length > 0 && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-purple-700">
                      {uploadedPhotos.length} separate cart item{uploadedPhotos.length !== 1 ? 's' : ''} will be created
                    </p>
                    <p className="text-xs text-purple-600">
                      ${service.base_price} per photo × {uploadedPhotos.length} photo{uploadedPhotos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-800">
                      Total: ${totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-purple-200">
                  <p className="text-xs text-purple-600">
                    Each photo can be edited independently with its own instructions and timeline.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={loading || uploadedPhotos.length === 0}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {loading ? 'Adding...' : `Add ${uploadedPhotos.length || 0} Item${uploadedPhotos.length !== 1 ? 's' : ''} to Cart`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}