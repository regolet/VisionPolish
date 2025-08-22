import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Image, Menu, X, Package } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)
  const navigate = useNavigate()
  const profileDropdownRef = useRef(null)
  const { user, profile, signOut, isAuthenticated, isAdmin, isEditor } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCartCount()
      fetchOrdersCount()
    } else {
      setCartCount(0)
      setOrdersCount(0)
    }
  }, [user])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchCartCount = async () => {
    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', user.id)

    if (!error && data) {
      const total = data.reduce((sum, item) => sum + item.quantity, 0)
      setCartCount(total)
    }
  }

  const fetchOrdersCount = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing', 'assigned', 'in_progress'])

    if (!error && data) {
      console.log('📦 Active orders found:', data.length)
      setOrdersCount(data.length)
    } else if (error) {
      console.error('❌ Error fetching orders count:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error during sign out:', error)
      // Force navigation even if signout fails
      navigate('/')
    }
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Image className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">VisionPolish</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {/* Show customer links for customers and unauthenticated users */}
            {(!user || profile?.role === 'customer') && (
              <>
                <Link to="/" className="text-gray-700 hover:text-purple-600 transition">
                  Home
                </Link>
                <Link to="/services" className="text-gray-700 hover:text-purple-600 transition">
                  Services
                </Link>
                <Link to="/portfolio" className="text-gray-700 hover:text-purple-600 transition">
                  Portfolio
                </Link>
                <Link to="/about" className="text-gray-700 hover:text-purple-600 transition">
                  About
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-purple-600 transition">
                  Contact
                </Link>
              </>
            )}
            
            {/* Show role-specific navigation */}
            {isEditor && (
              <Link to="/editor" className="text-gray-700 hover:text-purple-600 transition">
                Editor Dashboard
              </Link>
            )}
            {(isAdmin || profile?.role === 'staff') && (
              <>
                <Link to="/admin" className="text-gray-700 hover:text-purple-600 transition">
                  Admin
                </Link>
                <Link to="/admin/orders" className="text-gray-700 hover:text-purple-600 transition">
                  Orders
                </Link>
                <Link to="/admin/users" className="text-gray-700 hover:text-purple-600 transition">
                  Users
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Show orders and shopping cart only for customers */}
            {(!user || profile?.role === 'customer') && (
              <>
                {user && (
                  <Link to="/orders" className="relative" title="My Orders">
                    <Package className="h-6 w-6 text-gray-700 hover:text-purple-600 transition" />
                    {ordersCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {ordersCount > 99 ? '99+' : ordersCount}
                      </span>
                    )}
                  </Link>
                )}
                <Link to="/cart" className="relative" title="Shopping Cart">
                  <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-purple-600 transition" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition p-2 rounded-md"
                >
                  <User className="h-6 w-6" />
                  <span className="text-sm font-medium hidden sm:block">
                    {user.email?.split('@')[0] || 'Account'}
                  </span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {profile?.role || 'Customer'} Account
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      {/* Hide My Orders for editors, show only for customers and admins */}
                      {!isEditor && (
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          My Orders
                        </Link>
                      )}
                      {isEditor && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <Link
                            to="/editor"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 font-medium"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            Editor Dashboard
                          </Link>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 font-medium"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                          <Link
                            to="/admin/orders"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            Order Management
                          </Link>
                          {isAdmin && (
                            <Link
                              to="/admin/users"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                              onClick={() => setIsProfileDropdownOpen(false)}
                            >
                              User Management
                            </Link>
                          )}
                        </>
                      )}
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          handleSignOut()
                          setIsProfileDropdownOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
              >
                Sign In
              </Link>
            )}

            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            {/* Show customer links for customers and unauthenticated users */}
            {(!user || profile?.role === 'customer') && (
              <>
                <Link
                  to="/"
                  className="block py-2 text-gray-700 hover:text-purple-600 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/services"
                  className="block py-2 text-gray-700 hover:text-purple-600 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Services
                </Link>
                <Link
                  to="/portfolio"
                  className="block py-2 text-gray-700 hover:text-purple-600 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Portfolio
                </Link>
                <Link
                  to="/about"
                  className="block py-2 text-gray-700 hover:text-purple-600 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="block py-2 text-gray-700 hover:text-purple-600 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </>
            )}
            
            {/* Show role-specific navigation */}
            {isEditor && (
              <Link
                to="/editor"
                className="block py-2 text-gray-700 hover:text-purple-600 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Editor Dashboard
              </Link>
            )}
            {(isAdmin || profile?.role === 'staff') && (
              <>
                <Link
                  to="/admin"
                  className="block py-2 text-gray-700 hover:text-purple-600 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
                <Link
                  to="/admin/orders"
                  className="block py-2 text-gray-700 hover:text-purple-600 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  to="/admin/users"
                  className="block py-2 text-gray-700 hover:text-purple-600 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Users
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}