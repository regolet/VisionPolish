import { useState, useEffect } from 'react'
import { Award, Users, Heart, Zap, Shield, Star, CheckCircle, ArrowRight, Sparkles, Camera, Palette, Target } from 'lucide-react'

const values = [
  {
    icon: <Heart className="h-8 w-8" />,
    title: "Passion for Excellence",
    description: "Every pixel matters. We pour our heart into each project, ensuring your photos receive the attention they deserve.",
    gradient: "from-red-500 to-pink-600"
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Lightning Fast",
    description: "Time is precious. Our streamlined workflow ensures you get professional results within 24-48 hours.",
    gradient: "from-yellow-500 to-orange-600"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Trust & Security",
    description: "Your memories are safe with us. Enterprise-level security protects your photos throughout the entire process.",
    gradient: "from-green-500 to-emerald-600"
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Professional Quality",
    description: "Our team of expert editors brings years of experience to deliver results that exceed expectations.",
    gradient: "from-purple-500 to-indigo-600"
  }
]

const team = [
  {
    name: "Sarah Johnson",
    role: "Lead Photo Editor",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
    specialties: ["Portrait Retouching", "Wedding Photography", "Color Grading"],
    experience: "8+ years"
  },
  {
    name: "Michael Chen",
    role: "Product Photography Specialist",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    specialties: ["E-commerce", "Background Removal", "Product Enhancement"],
    experience: "6+ years"
  },
  {
    name: "Emma Davis",
    role: "Creative Director",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face",
    specialties: ["Creative Editing", "Art Direction", "Brand Photography"],
    experience: "10+ years"
  },
  {
    name: "David Wilson",
    role: "Restoration Expert",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    specialties: ["Photo Restoration", "Damage Repair", "Historical Photos"],
    experience: "12+ years"
  }
]

const stats = [
  { number: "50,000+", label: "Photos Edited", icon: <Camera className="h-6 w-6" /> },
  { number: "10,000+", label: "Happy Customers", icon: <Users className="h-6 w-6" /> },
  { number: "4.9/5", label: "Average Rating", icon: <Star className="h-6 w-6" /> },
  { number: "99.9%", label: "Customer Satisfaction", icon: <CheckCircle className="h-6 w-6" /> }
]

const milestones = [
  {
    year: "2020",
    title: "VisionPolish Founded",
    description: "Started with a simple mission: make professional photo editing accessible to everyone."
  },
  {
    year: "2021",
    title: "10,000 Photos Edited",
    description: "Reached our first major milestone, establishing trust with customers worldwide."
  },
  {
    year: "2022",
    title: "AI-Enhanced Workflow",
    description: "Integrated cutting-edge AI tools to improve quality and reduce turnaround time."
  },
  {
    year: "2023",
    title: "Global Expansion",
    description: "Expanded our team globally, serving customers across multiple time zones."
  },
  {
    year: "2024",
    title: "50,000+ Projects",
    description: "Celebrating our largest milestone with continuous innovation and growth."
  }
]

export default function About() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="bg-white min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-16 md:py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-4">
          <div className={`text-center transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-300" />
              <span className="text-sm font-medium">Our Story</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              About
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent block">
                VisionPolish
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-purple-100 max-w-3xl mx-auto mb-12 leading-relaxed">
              We're passionate about transforming ordinary photos into extraordinary memories. 
              Since 2020, we've been helping thousands of customers bring their vision to life 
              through professional photo editing services.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-yellow-300 mb-3 flex justify-center">
                    {stat.icon}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-2">{stat.number}</div>
                  <div className="text-sm text-purple-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center bg-purple-100 text-purple-600 rounded-full px-4 py-2 mb-6">
              <Target className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">OUR MISSION</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Democratizing Professional Photo Editing
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              We believe everyone deserves access to professional-quality photo editing, 
              regardless of their technical skills or budget. Our mission is to bridge the gap 
              between amateur photography and professional results, making it simple for anyone 
              to enhance their most precious memories.
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div
                key={index}
                className={`group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:-translate-y-2 transform ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className={`bg-gradient-to-r ${value.gradient} text-white rounded-2xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-purple-600 transition-colors">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-blue-100 text-blue-600 rounded-full px-4 py-2 mb-6">
              <Users className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">MEET THE TEAM</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Expert Editors, Passionate Artists
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our team of professional photo editors brings years of experience and 
              artistic vision to every project. Get to know the talented individuals 
              who make your photos shine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:-translate-y-2 transform ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${(index + 4) * 150}ms` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{member.name}</h3>
                  <p className="text-purple-600 font-semibold mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600 mb-4">{member.experience} experience</p>
                  
                  <div className="space-y-2">
                    {member.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium mr-2"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-emerald-100 text-emerald-600 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">OUR JOURNEY</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Growing Together Since 2020
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From humble beginnings to serving thousands of customers worldwide, 
              here's how VisionPolish has evolved over the years.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gradient-to-b from-purple-600 to-blue-600"></div>
              
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'} mb-12`}
                >
                  <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 transform transition-all duration-700 ${
                      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                    }`}
                    style={{ transitionDelay: `${(index + 8) * 200}ms` }}
                    >
                      <div className="text-2xl font-bold text-purple-600 mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 md:p-16 text-white text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Join Our Story?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Be part of our growing community of satisfied customers. 
              Let's create something amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 inline-flex items-center justify-center">
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
                View Our Work
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}