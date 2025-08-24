import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Sparkles, ArrowRight, CheckCircle, Users, Zap, Shield } from 'lucide-react'

const contactMethods = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email Us",
    description: "Get in touch via email",
    contact: "hello@visionpolish.com",
    response: "Response within 2 hours",
    gradient: "from-blue-500 to-cyan-600"
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Call Us",
    description: "Speak with our team",
    contact: "+1 (555) 123-4567",
    response: "Available 9 AM - 6 PM EST",
    gradient: "from-green-500 to-emerald-600"
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Live Chat",
    description: "Chat with support",
    contact: "Available on website",
    response: "Instant response",
    gradient: "from-purple-500 to-indigo-600"
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Visit Us",
    description: "Our headquarters",
    contact: "123 Creative St, Design City",
    response: "By appointment only",
    gradient: "from-orange-500 to-red-600"
  }
]

const faqs = [
  {
    question: "How long does it take to edit my photos?",
    answer: "Most projects are completed within 24-48 hours. Complex restorations or large batches may take 3-5 business days. We always communicate expected timelines upfront."
  },
  {
    question: "What file formats do you accept?",
    answer: "We accept all major image formats including JPEG, PNG, TIFF, RAW files (CR2, NEF, ARW), and PSD. For best results, we recommend uploading high-resolution images."
  },
  {
    question: "Do you offer revisions?",
    answer: "Yes! We include up to 3 rounds of revisions with every order to ensure you're completely satisfied with the results. Additional revisions can be requested for a small fee."
  },
  {
    question: "Is my personal information secure?",
    answer: "Absolutely. We use enterprise-level security and encryption to protect your photos and personal data. Your images are automatically deleted from our servers after 30 days."
  },
  {
    question: "Can you handle large volume orders?",
    answer: "Yes, we specialize in both individual projects and bulk orders. For orders over 50 images, we offer volume discounts and dedicated project management."
  },
  {
    question: "What if I'm not satisfied with the results?",
    answer: "We offer a 100% satisfaction guarantee. If you're not happy with the final results, we'll either revise the work at no charge or provide a full refund."
  }
]

const features = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Quick Response",
    description: "24/7 support with 2-hour response time"
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Expert Team",
    description: "Professional editors with 10+ years experience"
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Secure Process",
    description: "Enterprise security for your precious memories"
  }
]

export default function Contact() {
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    projectType: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        projectType: 'general'
      })
    }, 3000)
  }

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

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
              <span className="text-sm font-medium">Get In Touch</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Contact
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent block">
                VisionPolish
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-purple-100 max-w-3xl mx-auto mb-12 leading-relaxed">
              Have questions about our services? Need a custom quote? 
              Our friendly team is here to help you bring your vision to life.
            </p>
            
            {/* Quick Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-yellow-300 mb-3 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-purple-200">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods & Form Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Methods */}
            <div>
              <div className="mb-12">
                <div className="inline-flex items-center bg-purple-100 text-purple-600 rounded-full px-4 py-2 mb-6">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm font-semibold">CONTACT INFO</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                  Multiple Ways to Reach Us
                </h2>
                <p className="text-xl text-gray-600">
                  Choose the method that works best for you. We're here to help 
                  with any questions or concerns you might have.
                </p>
              </div>

              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <div
                    key={index}
                    className={`group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:-translate-y-1 transform ${
                      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`bg-gradient-to-r ${method.gradient} text-white rounded-xl p-3 group-hover:scale-110 transition-transform duration-300`}>
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                          {method.title}
                        </h3>
                        <p className="text-gray-600 mb-2">{method.description}</p>
                        <p className="font-semibold text-gray-900">{method.contact}</p>
                        <p className="text-sm text-purple-600">{method.response}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center bg-blue-100 text-blue-600 rounded-full px-4 py-2 mb-6">
                  <Send className="h-4 w-4 mr-2" />
                  <span className="text-sm font-semibold">SEND MESSAGE</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                  Start a Conversation
                </h2>
                <p className="text-xl text-gray-600">
                  Fill out the form below and we'll get back to you within 2 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="projectType" className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Type
                  </label>
                  <select
                    id="projectType"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="portrait">Portrait Retouching</option>
                    <option value="product">Product Photography</option>
                    <option value="wedding">Wedding Photos</option>
                    <option value="restoration">Photo Restoration</option>
                    <option value="bulk">Bulk Order</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                    placeholder="Tell us about your project or question..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isSubmitted}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                    isSubmitted
                      ? 'bg-green-600 text-white'
                      : isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-lg transform hover:-translate-y-1'
                  }`}
                >
                  {isSubmitted ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Message Sent Successfully!
                    </>
                  ) : isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Message...
                    </>
                  ) : (
                    <>
                      Send Message
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-emerald-100 text-emerald-600 rounded-full px-4 py-2 mb-6">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about our services, process, 
              and policies. Can't find what you're looking for? Contact us directly.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`bg-gray-50 rounded-2xl transition-all duration-300 ${
                    openFaq === index ? 'shadow-lg' : 'hover:shadow-md'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-6 text-left flex items-center justify-between focus:outline-none"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <div className={`transform transition-transform duration-300 ${
                      openFaq === index ? 'rotate-45' : 'rotate-0'
                    }`}>
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className="w-4 h-0.5 bg-purple-600 absolute"></div>
                        <div className="w-0.5 h-4 bg-purple-600 absolute"></div>
                      </div>
                    </div>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index ? 'max-h-96 pb-6' : 'max-h-0'
                  }`}>
                    <div className="px-6">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 md:p-16 text-white text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Don't let your photos stay ordinary. Transform them into 
              extraordinary memories with VisionPolish today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 inline-flex items-center justify-center">
                Upload Your Photos
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
                View Our Services
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}