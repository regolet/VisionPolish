import { useState, useEffect } from 'react'
import { ShoppingCart, Clock, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ServiceOrderModal from '../components/ServiceOrderModal'

const serviceCategories = [
  { id: 'all', name: 'All Services' },
  { id: 'portrait', name: 'Portrait Editing' },
  { id: 'product', name: 'Product Photography' },
  { id: 'restoration', name: 'Photo Restoration' },
  { id: 'creative', name: 'Creative Editing' }
]

export default function Services() {
  const [services, setServices] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const [selectedService, setSelectedService] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchServices()
  }, [selectedCategory])



  const fetchServices = async () => {
    setLoading(true)
    console.log('🔄 Fetching services for category:', selectedCategory)
    
    let query = supabase.from('services').select('*').eq('is_active', true)
    
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory)
    }

    const { data, error } = await query

    if (!error && data) {
      console.log('✅ Services fetched successfully:', data.length, 'services')
      console.log('📋 Services data:', data)
      setServices(data)
    } else {
      console.error('❌ Error fetching services:', error)
      setServices([])
    }
    setLoading(false)
  }


  const handleServiceSelect = (service) => {
    console.log('🎯 Service selected:', service.name)
    if (!user) {
      console.log('❌ User not logged in, redirecting to login')
      navigate('/login')
      return
    }
    console.log('✅ Opening service modal for:', service.name)
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedService(null)
  }

  const handleAddToCart = (cartItem) => {
    // Don't reload the page - let the modal handle navigation
    console.log('✅ Cart item added:', cartItem)
    // The ServiceOrderModal will handle the redirect to /cart
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Our Services</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Professional photo editing services for every need
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 md:mb-12 px-2">
          {serviceCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 md:px-6 py-2 rounded-full font-medium transition text-sm md:text-base ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-purple-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-40 md:h-48 object-cover"
                />
                <div className="p-4 md:p-6">
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base leading-relaxed">{service.description}</p>
                  
                  <div className="flex items-center text-gray-500 mb-3 md:mb-4">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-xs md:text-sm">Turnaround: {service.turnaround_time}</span>
                  </div>

                  <div className="mb-3 md:mb-4">
                    <p className="text-xs md:text-sm font-semibold text-gray-700 mb-2">Features:</p>
                    <ul className="space-y-1">
                      {service.features?.map((feature, index) => (
                        <li key={index} className="flex items-start text-xs md:text-sm text-gray-600">
                          <Check className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-2xl md:text-3xl font-bold text-purple-600">
                        ${service.base_price}
                      </span>
                      <span className="text-gray-500 text-xs md:text-sm ml-1">/ image</span>
                    </div>
                    <button
                      onClick={() => handleServiceSelect(service)}
                      className="bg-purple-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center text-sm md:text-base w-full sm:w-auto justify-center"
                    >
                      <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      Upload & Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Order Modal */}
      <ServiceOrderModal
        service={selectedService}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={user}
        onAddToCart={handleAddToCart}
      />
    </div>
  )
}