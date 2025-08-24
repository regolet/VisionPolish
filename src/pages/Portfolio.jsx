import { useState, useEffect } from 'react'
import { Star, ArrowRight, Filter, Grid, ExternalLink, Sparkles, Award, Users } from 'lucide-react'

const portfolioCategories = [
  { id: 'all', name: 'All Work', icon: <Grid className="h-4 w-4" /> },
  { id: 'portrait', name: 'Portrait', icon: <Users className="h-4 w-4" /> },
  { id: 'product', name: 'Product', icon: <Award className="h-4 w-4" /> },
  { id: 'wedding', name: 'Wedding', icon: <Star className="h-4 w-4" /> },
  { id: 'restoration', name: 'Restoration', icon: <Sparkles className="h-4 w-4" /> }
]

const portfolioItems = [
  {
    id: 1,
    title: "Portrait Retouching",
    category: "portrait",
    beforeImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop",
    description: "Professional portrait enhancement with skin smoothing and color correction"
  },
  {
    id: 2,
    title: "Product Photography",
    category: "product",
    beforeImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=600&fit=crop",
    description: "Clean background removal and product enhancement for e-commerce"
  },
  {
    id: 3,
    title: "Wedding Memories",
    category: "wedding",
    beforeImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=600&fit=crop",
    description: "Romantic wedding photo enhancement with mood and lighting adjustments"
  },
  {
    id: 4,
    title: "Photo Restoration",
    category: "restoration",
    beforeImage: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=600&fit=crop",
    description: "Restored damaged vintage photograph bringing memories back to life"
  },
  {
    id: 5,
    title: "Professional Headshots",
    category: "portrait",
    beforeImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop",
    description: "Corporate headshot enhancement for professional branding"
  },
  {
    id: 6,
    title: "Luxury Product",
    category: "product",
    beforeImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=600&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=600&fit=crop",
    description: "High-end product photography with dramatic lighting and reflection"
  }
]

const stats = [
  { number: "500+", label: "Projects Completed", icon: <Award className="h-5 w-5" /> },
  { number: "200+", label: "Happy Clients", icon: <Users className="h-5 w-5" /> },
  { number: "4.9/5", label: "Average Rating", icon: <Star className="h-5 w-5" /> },
  { number: "24h", label: "Avg. Delivery", icon: <Sparkles className="h-5 w-5" /> }
]

export default function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const filteredItems = selectedCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory)

  return (
    <div className="bg-white min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-16 md:py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-4">
          <div className={`text-center transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-300" />
              <span className="text-sm font-medium">Our Best Work</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Our Creative
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent block">
                Portfolio
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto mb-12 leading-relaxed">
              Discover the magic of professional photo editing through our carefully curated collection of before-and-after transformations.
            </p>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-yellow-300 mb-2 flex justify-center">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.number}</div>
                  <div className="text-sm text-purple-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Content */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {portfolioCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group relative overflow-hidden px-6 py-3 rounded-xl font-medium transition-all duration-300 text-sm flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
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

          {/* Portfolio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-700 overflow-hidden border border-gray-100 hover:-translate-y-2 transform ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="relative h-64 overflow-hidden">
                  {/* Before/After Images */}
                  <div className="relative w-full h-full">
                    <img
                      src={item.beforeImage}
                      alt={`${item.title} - Before`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                        hoveredItem === item.id ? 'opacity-0' : 'opacity-100'
                      }`}
                    />
                    <img
                      src={item.afterImage}
                      alt={`${item.title} - After`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                        hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Before/After Label */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                      {hoveredItem === item.id ? 'After' : 'Before'}
                    </div>
                    
                    {/* View More Button */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                      <button className="bg-white/90 backdrop-blur-sm text-gray-900 p-2 rounded-full hover:bg-white transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-purple-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-500">Hover to see result</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Photos?
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Join hundreds of satisfied customers who trust us with their precious memories and business needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 inline-flex items-center justify-center">
                  Start Your Project
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
                  View All Services
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}