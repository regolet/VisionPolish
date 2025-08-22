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
        <div className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                Transform Your Photos Into
                <span className="text-yellow-300"> Masterpieces</span>
              </h1>
              <p className="text-xl mb-8 text-purple-100">
                Professional photo editing services that bring your vision to life. 
                Fast, affordable, and stunning results guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/services"
                  className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/portfolio"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition"
                >
                  View Portfolio
                </Link>
              </div>
            </div>
            <div className="relative h-96 lg:h-full">
              <div className="grid grid-cols-2 gap-4 h-full">
                {portfolioImages.slice(0, 4).map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Portfolio ${index + 1}`}
                    className={`rounded-lg object-cover w-full h-44 lg:h-48 transition-all duration-500 ${
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-purple-100 text-purple-600 rounded-full p-3 w-fit mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-gray-600">
              Professional photo editing services tailored to your needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-purple-600 mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <p className="text-purple-600 font-semibold">{service.price}</p>
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
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Photos?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Join thousands of satisfied customers who trust us with their memories
          </p>
          <Link
            to="/services"
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center"
          >
            Start Your First Order
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}