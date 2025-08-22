import { useState, useEffect } from 'react'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'

export default function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCartItems()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    if (!session) {
      navigate('/login')
    }
  }

  const fetchCartItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        service:services(*)
      `)
      .eq('user_id', user.id)

    if (!error && data) {
      setCartItems(data)
    }
    setLoading(false)
  }


  const removeItem = async (itemId) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (!error) {
      fetchCartItems()
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.service?.base_price || 0) * item.quantity
    }, 0).toFixed(2)
  }

  const proceedToCheckout = async () => {
    if (cartItems.length === 0) return

    try {
      const orderNumber = `ORD-${Date.now()}`
      const totalAmount = parseFloat(calculateTotal())

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: 'pending',
          total_amount: totalAmount,
          payment_status: 'pending'
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        alert('Failed to create order. Please try again.')
        return
      }

      if (orderData) {
        const orderItems = cartItems.map(item => ({
          order_id: orderData.id,
          service_id: item.service_id,
          quantity: item.quantity,
          price: item.service.base_price,
          specifications: item.specifications
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error('Order items error:', itemsError)
          alert('Failed to create order items. Please try again.')
          return
        }

        // Clear cart
        const { error: clearCartError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)

        if (clearCartError) {
          console.error('Clear cart error:', clearCartError)
        }

        // Navigate to checkout
        navigate(`/checkout?order=${orderData.id}`)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
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
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Add some services to get started with your photo editing journey
            </p>
            <Link
              to="/services"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition inline-flex items-center"
            >
              Browse Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 border-b last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {item.service?.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          {item.service?.description}
                        </p>
                        
                        {/* Display each uploaded photo as separate line item */}
                        {item.specifications?.photos && item.specifications.photos.length > 0 ? (
                          <div className="space-y-3">
                            {item.specifications.photos.map((photo, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={photo.url}
                                    alt={photo.filename}
                                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate" title={photo.filename}>
                                      {photo.filename}
                                    </p>
                                    <p className="text-xs text-gray-500">${item.service?.base_price} per image</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-purple-600">
                                    ${item.service?.base_price}
                                  </p>
                                </div>
                              </div>
                            ))}
                            
                            {/* Display special instructions */}
                            {item.specifications?.notes && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-medium text-blue-800 mb-1">Special Instructions:</p>
                                <p className="text-sm text-blue-700">{item.specifications.notes}</p>
                              </div>
                            )}
                            
                            <div className="flex justify-end">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-500 hover:text-red-700 transition flex items-center text-sm"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove All Photos
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              {item.quantity} × ${item.service?.base_price} each
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-purple-600">
                          ${(item.service?.base_price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${item.service?.base_price} each
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${calculateTotal()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/services"
                  className="block text-center mt-4 text-purple-600 hover:text-purple-700 transition"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}