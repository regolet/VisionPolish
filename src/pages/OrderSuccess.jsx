import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Check, Clock, Image, ArrowRight } from 'lucide-react'

export default function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && !authLoading && orderId) {
      fetchOrderDetails()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading, orderId])



  const fetchOrderDetails = async () => {
    setLoading(true)
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (!orderError && orderData) {
      setOrder(orderData)

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          service:services(*)
        `)
        .eq('order_id', orderId)

      if (!itemsError && itemsData) {
        setOrderItems(itemsData)
      }
    }
    
    setLoading(false)
  }

  const getTotalImages = () => {
    return orderItems.reduce((total, item) => {
      if (item.specifications?.photos) {
        return total + item.specifications.photos.length
      }
      return total + item.quantity
    }, 0)
  }

  // Show loading while auth is loading or while fetching order
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Link
            to="/services"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Browse Services
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-lg text-gray-600">
              Thank you for your order. Your photos are now being processed by our expert editors.
            </p>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Order #{order.order_number}</h2>
                <p className="text-sm text-gray-600">
                  Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">${order.total_amount}</p>
                <p className="text-sm text-green-600">Payment Confirmed</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="border-t pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.service?.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{item.service?.description}</p>
                      
                      {/* Image count and preview */}
                      {item.specifications?.photos && item.specifications.photos.length > 0 && (
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Image className="h-4 w-4 mr-1" />
                            {item.specifications.photos.length} image{item.specifications.photos.length !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            {item.service?.turnaround_time}
                          </div>
                        </div>
                      )}
                      
                      {/* Special instructions */}
                      {item.specifications?.notes && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <p className="font-medium text-blue-800">Special Instructions:</p>
                          <p className="text-blue-700">{item.specifications.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">${item.price} each</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-purple-600">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Processing Started</h3>
                  <p className="text-sm text-gray-600">Your photos are now in queue and will be assigned to our expert editors.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-gray-400">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-400">Professional Editing</h3>
                  <p className="text-sm text-gray-400">Our editors will work on your photos using professional tools and techniques.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-gray-400">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-400">Quality Review</h3>
                  <p className="text-sm text-gray-400">Each edited photo goes through quality control before delivery.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-gray-400">4</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-400">Download Ready</h3>
                  <p className="text-sm text-gray-400">You'll receive an email notification when your edited photos are ready for download.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <Image className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{getTotalImages()}</p>
              <p className="text-sm text-gray-600">Images Being Edited</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">24-72</p>
              <p className="text-sm text-gray-600">Hours Turnaround</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">100%</p>
              <p className="text-sm text-gray-600">Satisfaction Guarantee</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <div className="space-x-4">
              <Link
                to="/services"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition inline-flex items-center"
              >
                Order More Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Back to Home
              </Link>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                Need help? Contact us at{' '}
                <a href="mailto:support@visionpolish.com" className="text-purple-600 hover:underline">
                  support@visionpolish.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}