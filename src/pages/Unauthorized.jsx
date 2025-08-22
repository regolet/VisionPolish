import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Unauthorized() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>

        <p className="text-gray-600 mb-6">
          Sorry, you don't have permission to access this page. Your current role is{' '}
          <span className="font-medium text-gray-900">
            {profile?.role || 'unknown'}
          </span>.
        </p>

        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Logged in as:</strong> {user.email}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>

          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Homepage
          </button>

          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-800 transition"
          >
            Sign out and login with different account
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}