import { Upload, Edit3, Download, Clock } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      icon: <Upload className="h-8 w-8" />,
      title: "Upload Your Photos",
      description: "Select a service and upload your high-quality images (JPG, PNG, or WebP). Our secure platform supports up to 10MB per file.",
      details: [
        "Choose from portrait editing, background removal, color correction, or restoration",
        "Upload up to 10 photos at once with drag & drop",
        "Add special instructions for our editors"
      ]
    },
    {
      icon: <Edit3 className="h-8 w-8" />,
      title: "Professional Editing",
      description: "Our expert editors work on your photos using industry-standard tools and techniques to achieve stunning results.",
      details: [
        "Each photo is manually edited by skilled professionals",
        "Quality control checks ensure perfection",
        "Revisions available if you're not completely satisfied"
      ]
    },
    {
      icon: <Download className="h-8 w-8" />,
      title: "Download Results",
      description: "Receive your professionally edited photos in high resolution, ready for any use - social media, printing, or professional portfolios.",
      details: [
        "High-resolution files delivered via secure download",
        "Multiple format options available",
        "Lifetime access to your edited photos"
      ]
    }
  ]

  const features = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Fast Turnaround",
      description: "Most services completed within 24-48 hours"
    },
    {
      icon: <Upload className="h-6 w-6" />,
      title: "Easy Upload",
      description: "Drag & drop interface with progress tracking"
    },
    {
      icon: <Edit3 className="h-6 w-6" />,
      title: "Expert Quality",
      description: "Professional editors with years of experience"
    }
  ]

  return (
    <div className="bg-white">
      {/* Main How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting professional photo editing has never been easier. Follow these simple steps to transform your photos.
            </p>
          </div>

          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col lg:flex-row items-center gap-8">
                {/* Step Number and Icon */}
                <div className="flex-shrink-0 text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 text-white rounded-full mb-4">
                    <span className="text-2xl font-bold">{index + 1}</span>
                  </div>
                  <div className="text-purple-600 mb-4">
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow text-center lg:text-left max-w-2xl">
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-lg text-gray-600 mb-6">{step.description}</p>
                  <ul className="space-y-2 text-gray-600">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Element */}
                <div className="flex-shrink-0 hidden lg:block">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                    <div className="text-purple-600 opacity-50">
                      {step.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Upload Guidelines */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Photo Upload Guidelines</h2>
            <p className="text-lg text-gray-600">
              Follow these tips to get the best results from our editing services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Image Quality</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use high-resolution images (minimum 1200px width)</li>
                <li>• Avoid heavily compressed or pixelated photos</li>
                <li>• Ensure good lighting and clear details</li>
                <li>• Avoid blurry or out-of-focus images</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">File Formats</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Recommended:</strong> JPG, PNG, WebP</li>
                <li>• <strong>Maximum size:</strong> 10MB per file</li>
                <li>• <strong>RAW files:</strong> Supported for premium services</li>
                <li>• <strong>Multiple uploads:</strong> Up to 10 photos at once</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Best Results</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Include specific instructions with your upload</li>
                <li>• Mention any problem areas or desired outcomes</li>
                <li>• Provide reference images if you have a vision</li>
                <li>• Be clear about the intended use of the photos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-purple-100 text-purple-600 rounded-full p-4 w-fit mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}