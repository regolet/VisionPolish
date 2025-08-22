import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Upload, CreditCard, Check, ArrowRight } from 'lucide-react'

export default function Checkout() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails()
    }
  }, [user, orderId])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    if (!session) {
      navigate('/login')
    }
  }

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

  const handleFileUpload = (itemId, files) => {
    setUploadedFiles(prev => ({
      ...prev,
      [itemId]: files
    }))
  }

  const uploadImagesToSupabase = async (itemId, files) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileName = `${user.id}/${orderId}/${itemId}/${Date.now()}_${file.name}`
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file)

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName)

        await supabase.from('uploaded_images').insert({
          order_item_id: itemId,
          original_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          upload_status: 'completed'
        })

        return urlData.publicUrl
      }
      return null
    })

    return Promise.all(uploadPromises)
  }

  const processPayment = async () => {
    setProcessing(true)

    try {
      // Upload all images
      for (const item of orderItems) {
        const files = uploadedFiles[item.id]
        if (files && files.length > 0) {
          await uploadImagesToSupabase(item.id, files)
        }
      }

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          payment_status: 'completed',
          payment_method: 'card'
        })
        .eq('id', orderId)

      if (!error) {
        navigate(`/order-success/${orderId}`)
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      alert('An error occurred during payment processing')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
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
          <button
            onClick={() => navigate('/services')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Browse Services
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Complete Your Order</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Photos
              </h2>
              
              {orderItems.map((item) => (
                <div key={item.id} className="mb-6 pb-6 border-b last:border-b-0">
                  <h3 className="font-medium mb-3">
                    {item.service?.name} - {item.quantity} image(s)
                  </h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(item.id, e.target.files)}
                      className="hidden"
                      id={`file-${item.id}`}
                    />
                    <label
                      htmlFor={`file-${item.id}`}
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <span className="text-gray-600">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        PNG, JPG up to 10MB each
                      </span>
                    </label>
                    
                    {uploadedFiles[item.id] && (
                      <div className="mt-4">
                        <p className="text-sm text-green-600 flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          {uploadedFiles[item.id].length} file(s) selected
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Information
              </h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.service?.name} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-purple-600">
                    ${order.total_amount}
                  </span>
                </div>
                
                <button
                  onClick={processPayment}
                  disabled={processing || Object.keys(uploadedFiles).length === 0}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Complete Order
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
                
                {Object.keys(uploadedFiles).length === 0 && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    Please upload images to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}