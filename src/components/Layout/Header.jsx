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
  const { user, profile, signOut, forceSignOut, isAuthenticated, isAdmin, isEditor } = useAuth()

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
      console.log('🚪 Header: Starting sign out...')
      const result = await signOut()
      
      if (result?.error) {
        console.error('❌ Header: SignOut returned error, trying force signout:', result.error)
        forceSignOut()
      }
      
      console.log('✅ Header: Navigating to home page')
      navigate('/')
    } catch (error) {
      console.error('❌ Header: SignOut exception, using force signout:', error)
      // If normal signout fails, force clear everything
      forceSignOut()
      // Force navigation regardless of errors
      navigate('/')
    }
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Image className="h-7 w-7 md:h-8 md:w-8 text-purple-600" />
            <span className="text-xl md:text-2xl font-bold text-gray-900">VisionPolish</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {/* Show customer links for customers and unauthenticated users */}
            {(!user || profile?.role === 'customer') && (
              <>
                <Link to="/" className="text-gray-700 hover:text-purple-600 transition text-sm lg:text-base">
                  Home
                </Link>
                <Link to="/services" className="text-gray-700 hover:text-purple-600 transition text-sm lg:text-base">
                  Services
                </Link>
                <Link to="/portfolio" className="text-gray-700 hover:text-purple-600 transition text-sm lg:text-base">
                  Portfolio
                </Link>
                <Link to="/about" className="text-gray-700 hover:text-purple-600 transition text-sm lg:text-base">
                  About
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-purple-600 transition text-sm lg:text-base">
                  Contact
                </Link>
              </>
            )}
            
            {/* Show role-specific navigation */}
            {isEditor && !isAdmin && (
              <Link to="/editor" className="text-gray-700 hover:text-purple-600 transition text-sm lg:text-base">
                Editor Dashboard
              </Link>
            )}
            {(isAdmin || profile?.role === 'staff') && (
              <>
                <Link to="/admin" className="text-gray-700 hover:text-purple-600 transition text-sm lg:text-base">
                  Admin
                </Link>
                <Link to="/admin/orders" className="text-gray-700 hover:text-purple-600 transition text-sm lg:text-base">
                  Orders
                </Link>
                <Link to="/admin/users" className="text-gray-700 hover:text-purple-600 transition text-sm lg:text-base">
                  Users
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Show orders and shopping cart only for customers */}
            {(!user || profile?.role === 'customer') && (
              <>
                {user && (
                  <Link to="/orders" className="relative p-2 md:p-1" title="My Orders">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-gray-700 hover:text-purple-600 transition" />
                    {ordersCount > 0 && (
                      <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-blue-600 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-xs">
                        {ordersCount > 99 ? '99+' : ordersCount}
                      </span>
                    )}
                  </Link>
                )}
                <Link to="/cart" className="relative p-2 md:p-1" title="Shopping Cart">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-gray-700 hover:text-purple-600 transition" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-purple-600 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-xs">
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
                  className="flex items-center space-x-1 md:space-x-2 text-gray-700 hover:text-purple-600 transition p-2 rounded-md min-w-0"
                >
                  <User className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                  <span className="text-sm font-medium hidden sm:block truncate max-w-20 md:max-w-none">
                    {user.email?.split('@')[0] || 'Account'}
                  </span>
                  <svg className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {profile?.role ? `${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Account` : 'Loading...'}
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
                      {isEditor && !isAdmin && (
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
                className="bg-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-purple-700 transition text-sm font-medium"
              >
                Sign In
              </Link>
            )}

            <button
              className="md:hidden p-2 -mr-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
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
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="pt-4 space-y-1">
              {/* Show customer links for customers and unauthenticated users */}
              {(!user || profile?.role === 'customer') && (
                <>
                  <Link
                    to="/"
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/services"
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Services
                  </Link>
                  <Link
                    to="/portfolio"
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Portfolio
                  </Link>
                  <Link
                    to="/about"
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </>
              )}
              
              {/* Show role-specific navigation */}
              {isEditor && !isAdmin && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/editor"
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Editor Dashboard
                  </Link>
                </>
              )}
              {(isAdmin || profile?.role === 'staff') && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/admin"
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                  <Link
                    to="/admin/orders"
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link
                    to="/admin/users"
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Users
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}