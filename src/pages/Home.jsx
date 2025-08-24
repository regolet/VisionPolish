import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Clock, Shield, DollarSign, Image, Palette, Wand2, Camera, Star, Users, CheckCircle, Play, Zap, Award, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import HowItWorks from '../components/HowItWorks'

const services = [
  {
    icon: <Wand2 className="h-8 w-8" />,
    title: "Photo Retouching",
    description: "Professional retouching to enhance portraits and remove imperfections",
    price: "From $15",
    gradient: "from-pink-500 to-purple-600",
    popular: true
  },
  {
    icon: <Image className="h-8 w-8" />,
    title: "Background Removal",
    description: "Clean, precise background removal for product photos and portraits",
    price: "From $5",
    gradient: "from-blue-500 to-cyan-600",
    popular: false
  },
  {
    icon: <Palette className="h-8 w-8" />,
    title: "Color Correction",
    description: "Expert color grading and correction for vibrant, balanced images",
    price: "From $10",
    gradient: "from-emerald-500 to-teal-600",
    popular: false
  },
  {
    icon: <Camera className="h-8 w-8" />,
    title: "Image Restoration",
    description: "Restore old, damaged photos to their former glory",
    price: "From $25",
    gradient: "from-orange-500 to-red-600",
    popular: false
  }
]

const features = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Lightning Fast",
    description: "Get your edited photos back within 24-48 hours",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50"
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "100% Secure",
    description: "Your photos are safe with enterprise-level security",
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Satisfaction Guaranteed",
    description: "Professional quality or your money back",
    color: "text-red-500",
    bgColor: "bg-red-50"
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Award-Winning Team",
    description: "Expert editors with years of experience",
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  }
]

const stats = [
  { number: "50K+", label: "Photos Edited", icon: <Image className="h-5 w-5" /> },
  { number: "10K+", label: "Happy Customers", icon: <Users className="h-5 w-5" /> },
  { number: "4.9/5", label: "Average Rating", icon: <Star className="h-5 w-5" /> },
  { number: "24h", label: "Avg. Turnaround", icon: <Clock className="h-5 w-5" /> }
]

const testimonials = [
  {
    text: "VisionPolish transformed my wedding photos beautifully. The attention to detail is incredible!",
    author: "Sarah Johnson",
    role: "Bride",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
  },
  {
    text: "Professional service with quick turnaround. My product photos look amazing now!",
    author: "Mike Chen",
    role: "E-commerce Owner",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
  },
  {
    text: "The color correction service brought my old family photos back to life. Highly recommended!",
    author: "Emma Davis",
    role: "Family Photographer",
    rating: 5,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
  }
]

const portfolioImages = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400"
]

export default function Home() {
  const navigate = useNavigate()
  const { user, profile, isEditor } = useAuth()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  
  // Redirect editors to their dashboard
  useEffect(() => {
    if (user && isEditor) {
      console.log('🎯 Editor detected, redirecting to dashboard')
      navigate('/editor')
    }
  }, [user, isEditor, navigate])

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % portfolioImages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(testimonialInterval)
  }, [])

  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center min-h-[80vh]">
            <div className={`text-center lg:text-left transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
                <Sparkles className="h-4 w-4 mr-2 text-yellow-300" />
                <span className="text-sm font-medium">Trusted by 10,000+ customers</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                Transform Your Photos Into
                <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent block">
                  Masterpieces
                </span>
              </h1>
              
              <p className="text-lg md:text-xl mb-8 text-purple-100 leading-relaxed max-w-xl">
                Professional photo editing services powered by expert designers. 
                Fast turnaround, stunning results, satisfaction guaranteed.
              </p>
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center text-yellow-300 mb-1">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold">{stat.number}</div>
                    <div className="text-sm text-purple-200">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/services"
                  className="group bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="group border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 text-lg backdrop-blur-sm flex items-center justify-center">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className={`relative transform transition-all duration-1000 delay-300 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="relative h-[500px] lg:h-[600px]">
                {/* Main featured image */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={portfolioImages[currentImageIndex]}
                    alt="Featured work"
                    className="w-full h-full object-cover transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Floating cards */}
                <div className="absolute -top-4 -left-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">24h Delivery</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20">
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">4.9/5</span>
                  </div>
                </div>
                
                {/* Thumbnail strip */}
                <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 space-y-3">
                  {portfolioImages.slice(1, 4).map((img, index) => (
                    <div key={index} className="w-16 h-16 rounded-lg overflow-hidden shadow-lg border-2 border-white/50">
                      <img src={img} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Why Choose VisionPolish?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the difference with our premium photo editing services
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group text-center">
                <div className={`${feature.bgColor} ${feature.color} rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-purple-100 text-purple-600 rounded-full px-4 py-2 mb-4">
              <Palette className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">SERVICES</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
              Transform Every Pixel
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional photo editing services crafted by expert designers
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:-translate-y-2"
              >
                {service.popular && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Popular
                  </div>
                )}
                
                <div className={`h-2 bg-gradient-to-r ${service.gradient}`}></div>
                
                <div className="p-6">
                  <div className={`bg-gradient-to-r ${service.gradient} text-white rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {service.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent`}>
                      {service.price}
                    </span>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Link
              to="/services"
              className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 inline-flex items-center text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Explore All Services
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white rounded-full"></div>
        </div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Thousands
            </h2>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              See what our customers say about their VisionPolish experience
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>
                
                <div className="flex items-center justify-center space-x-4">
                  <img
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].author}
                    className="w-16 h-16 rounded-full border-2 border-white/50"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-lg">{testimonials[currentTestimonial].author}</div>
                    <div className="text-purple-200">{testimonials[currentTestimonial].role}</div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-8 space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentTestimonial ? 'bg-white' : 'bg-white/30'
                      }`}
                      onClick={() => setCurrentTestimonial(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 md:p-16 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Photos?
              </h2>
              <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto leading-relaxed">
                Join thousands of satisfied customers who trust us with their precious memories
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/services"
                  className="group bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 inline-flex items-center text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Start Your First Project
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 text-lg backdrop-blur-sm">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}