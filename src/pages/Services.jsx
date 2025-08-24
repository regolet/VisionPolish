import { useState, useEffect } from 'react'
import { ShoppingCart, Clock, Check, Star, Zap, Award, Shield, Filter, Grid, Search, ArrowRight, Sparkles, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ServiceOrderModal from '../components/ServiceOrderModal'

const serviceCategories = [
  { 
    id: 'all', 
    name: 'All Services',
    icon: <Grid className="h-4 w-4" />,
    gradient: 'from-purple-500 to-blue-500'
  },
  { 
    id: 'portrait', 
    name: 'Portrait Editing',
    icon: <Star className="h-4 w-4" />,
    gradient: 'from-pink-500 to-rose-500'
  },
  { 
    id: 'product', 
    name: 'Product Photography',
    icon: <Zap className="h-4 w-4" />,
    gradient: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'restoration', 
    name: 'Photo Restoration',
    icon: <Award className="h-4 w-4" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  { 
    id: 'creative', 
    name: 'Creative Editing',
    icon: <Sparkles className="h-4 w-4" />,
    gradient: 'from-orange-500 to-red-500'
  }
]

export default function Services() {
  const [services, setServices] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const [selectedService, setSelectedService] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setIsVisible(true)
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

  // Filter services based on search term
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-16 md:py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-4">
          <div className={`text-center transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-300" />
              <span className="text-sm font-medium">Professional Photo Editing</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Our Premium
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent block">
                Services
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto mb-8 leading-relaxed">
              Transform your photos with our expert editing services. 
              Professional quality, fast turnaround, guaranteed satisfaction.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {serviceCategories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`group relative overflow-hidden px-6 py-3 rounded-xl font-medium transition-all duration-300 text-sm flex items-center space-x-2 ${
                selectedCategory === category.id
                  ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg transform scale-105`
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200'
              }`}
            >
              <span className={selectedCategory === category.id ? 'text-white' : 'text-gray-500'}>
                {category.icon}
              </span>
              <span>{category.name}</span>
              {selectedCategory === category.id && (
                <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
              )}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading amazing services...</p>
          </div>
        ) : (
          <>
            {filteredServices.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No services found</h3>
                <p className="text-gray-500">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredServices.map((service, index) => (
                  <div
                    key={service.id}
                    className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:-translate-y-2 transform ${
                      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      
                      {/* Enhanced Price Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg border-2 border-white/50 backdrop-blur-sm flex items-center justify-center">
                          <div className="text-lg font-bold">${service.base_price}</div>
                        </div>
                      </div>
                      
                      {/* Popular Badge */}
                      {service.category === 'portrait' && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/50">
                          🔥 Popular
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-purple-600 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {service.description}
                      </p>
                      
                      <div className="flex items-center text-gray-500 mb-4 bg-gray-50 rounded-lg p-3">
                        <Clock className="h-4 w-4 mr-2 text-purple-500" />
                        <span className="text-sm font-medium">Turnaround: {service.turnaround_time}</span>
                      </div>

                      <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          What's Included:
                        </p>
                        <ul className="space-y-2">
                          {service.features?.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <Check className="h-3 w-3 text-green-500 mr-2 mt-1 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                          {service.features?.length > 3 && (
                            <li className="text-sm text-purple-600 font-medium">
                              +{service.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Enhanced Pricing Section */}
                      <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100 relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full -translate-y-10 translate-x-10"></div>
                        
                        <div className="flex items-center justify-between relative">
                          <div>
                            <span className="text-xs font-medium text-purple-600 uppercase tracking-wide flex items-center">
                              🏷️ Starting Price
                            </span>
                            <div className="flex items-baseline mt-1">
                              <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                ${service.base_price}
                              </span>
                              <span className="text-gray-500 text-sm ml-1">/ image</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1 flex items-center">
                              <span className="line-through text-gray-400 mr-2">${(service.base_price * 1.5).toFixed(0)}</span>
                              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                                Save ${(service.base_price * 0.5).toFixed(0)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                              💰 Best Value
                            </div>
                            <div className="text-xs text-gray-500 mt-2">No hidden fees</div>
                            <div className="text-xs text-purple-600 font-medium">24h delivery</div>
                          </div>
                        </div>
                        
                        {/* Price guarantee */}
                        <div className="mt-3 pt-3 border-t border-purple-100">
                          <div className="flex items-center text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                            <span>Price match guarantee • </span>
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1 ml-2" />
                            <span>Free revisions included</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleServiceSelect(service)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center font-semibold group-hover:shadow-lg transform group-hover:-translate-y-1"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Upload & Order
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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