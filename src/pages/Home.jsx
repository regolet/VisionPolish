import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Clock, Shield, DollarSign, Image, Palette, Wand2, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import HowItWorks from '../components/HowItWorks'

const services = [
  {
    icon: <Wand2 className="h-8 w-8" />,
    title: "Photo Retouching",
    description: "Professional retouching to enhance portraits and remove imperfections",
    price: "From $15"
  },
  {
    icon: <Image className="h-8 w-8" />,
    title: "Background Removal",
    description: "Clean, precise background removal for product photos and portraits",
    price: "From $5"
  },
  {
    icon: <Palette className="h-8 w-8" />,
    title: "Color Correction",
    description: "Expert color grading and correction for vibrant, balanced images",
    price: "From $10"
  },
  {
    icon: <Camera className="h-8 w-8" />,
    title: "Image Restoration",
    description: "Restore old, damaged photos to their former glory",
    price: "From $25"
  }
]

const features = [
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Fast Turnaround",
    description: "Get your edited photos back within 24-48 hours"
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "100% Secure",
    description: "Your photos are safe with enterprise-level security"
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Affordable Pricing",
    description: "Professional quality at competitive prices"
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Premium Quality",
    description: "Expert editors with years of experience"
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
  
  // Redirect editors to their dashboard
  useEffect(() => {
    if (user && isEditor) {
      console.log('🎯 Editor detected, redirecting to dashboard')
      navigate('/editor')
    }
  }, [user, isEditor, navigate])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % portfolioImages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                Transform Your Photos Into
                <span className="text-yellow-300"> Masterpieces</span>
              </h1>
              <p className="text-lg md:text-xl mb-6 md:mb-8 text-purple-100 leading-relaxed">
                Professional photo editing services that bring your vision to life. 
                Fast, affordable, and stunning results guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Link
                  to="/services"
                  className="bg-white text-purple-600 px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center text-sm md:text-base"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Link>
                <Link
                  to="/portfolio"
                  className="border-2 border-white text-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition text-sm md:text-base"
                >
                  View Portfolio
                </Link>
              </div>
            </div>
            <div className="relative h-64 sm:h-80 md:h-96 lg:h-full mt-8 lg:mt-0">
              <div className="grid grid-cols-2 gap-3 md:gap-4 h-full">
                {portfolioImages.slice(0, 4).map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Portfolio ${index + 1}`}
                    className={`rounded-lg object-cover w-full h-32 sm:h-40 md:h-44 lg:h-48 transition-all duration-500 ${
                      index === currentImageIndex % 4 ? 'scale-105 shadow-2xl' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 md:p-0">
                <div className="bg-purple-100 text-purple-600 rounded-full p-3 w-fit mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-lg md:text-xl text-gray-600">
              Professional photo editing services tailored to your needs
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-purple-600 mb-3 md:mb-4">{service.icon}</div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base leading-relaxed">{service.description}</p>
                <p className="text-purple-600 font-semibold text-sm md:text-base">{service.price}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/services"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition inline-flex items-center"
            >
              View All Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Photos?
          </h2>
          <p className="text-lg md:text-xl mb-6 md:mb-8 text-purple-100 max-w-2xl mx-auto leading-relaxed">
            Join thousands of satisfied customers who trust us with their memories
          </p>
          <Link
            to="/services"
            className="bg-white text-purple-600 px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center text-sm md:text-base"
          >
            Start Your First Order
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}