import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        })

        if (error) throw error

        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName
          })
        }

        alert('Check your email for the confirmation link!')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
        
        // Wait for AuthContext to handle the session and role
        // The AuthContext will automatically redirect based on role
        setTimeout(() => {
          // Get the current user session and role after AuthContext has processed it
          const checkRoleAndRedirect = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session?.user) {
              // Use hardcoded logic for editor@editor.com
              if (session.user.email === 'editor@editor.com') {
                navigate('/editor')
                return
              }
              
              // For other users, check their profile
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', session.user.id)
                  .single()
                
                // Role-based redirect
                switch (profile?.role) {
                  case 'admin':
                    navigate('/admin')
                    break
                  case 'editor':
                    navigate('/editor')
                    break
                  case 'staff':
                    navigate('/admin/orders')
                    break
                  case 'customer':
                  default:
                    navigate('/')
                    break
                }
              } catch (error) {
                console.error('Error checking profile:', error)
                navigate('/')
              }
            } else {
              navigate('/')
            }
          }
          
          checkRoleAndRedirect()
        }, 100) // Small delay to let AuthContext process the session
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isSignUp
              ? 'Sign up to start editing your photos'
              : 'Sign in to access your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="w-full border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition">
              Google
            </button>
            <button className="w-full border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition">
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}