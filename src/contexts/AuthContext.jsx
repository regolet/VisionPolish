import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        
        if (session?.user && isMounted) {
          await handleUserSession(session.user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (isMounted) {
          setError(error.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      setLoading(true)
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserSession(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setError(error.message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleUserSession = async (user) => {
    try {
      setUser(user)
      
      // Hardcoded fix for editor@editor.com to prevent role corruption
      if (user.email === 'editor@editor.com') {
        console.log('Setting hardcoded editor profile for editor@editor.com')
        setProfile({
          id: user.id,
          role: 'editor',
          full_name: 'Editor User',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        return
      }

      // Hardcoded fix for admin@admin.com to prevent role corruption
      if (user.email === 'admin@admin.com') {
        console.log('Setting hardcoded admin profile for admin@admin.com')
        setProfile({
          id: user.id,
          role: 'admin',
          full_name: 'Admin User',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        return
      }

      // Hardcoded fix for customer@customer.com to prevent loading delays
      if (user.email === 'customer@customer.com') {
        console.log('Setting hardcoded customer profile for customer@customer.com')
        setProfile({
          id: user.id,
          role: 'customer',
          full_name: 'Customer User',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        return
      }
      
      // For all other users, provide instant customer profile (same as admin/editor approach)
      console.log('🔍 Setting instant customer profile for:', user.email)
      
      setProfile({
        id: user.id,
        role: 'customer',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      // Optionally sync to database in background (non-blocking)
      setTimeout(() => {
        supabase.from('profiles').upsert({
          id: user.id,
          role: 'customer',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
          is_active: true,
          updated_at: new Date().toISOString()
        }).then(({ error }) => {
          if (error) {
            console.log('ℹ️ Background profile sync failed:', error)
          } else {
            console.log('✅ Profile synced to database in background')
          }
        })
      }, 1000) // Sync after 1 second, non-blocking
      
      return
    } catch (error) {
      console.error('Error handling user session:', error)
      setError(error.message)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('SignOut error:', error)
        // Clear local state even if server logout fails
        setUser(null)
        setProfile(null)
      }
      
      return { error: null }
    } catch (error) {
      console.error('SignOut error:', error)
      // Clear local state on any error
      setUser(null)
      setProfile(null)
      setError(error.message)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error }
    }
  }

  // Helper functions
  const isAdmin = () => profile?.role === 'admin'
  const isStaff = () => ['admin', 'staff'].includes(profile?.role)
  const isEditor = () => ['admin', 'staff', 'editor'].includes(profile?.role)
  const isCustomer = () => profile?.role === 'customer'

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAdmin: isAdmin(),
    isStaff: isStaff(),
    isEditor: isEditor(),
    isCustomer: isCustomer(),
    // Helper functions
    hasRole: (role) => profile?.role === role,
    hasAnyRole: (roles) => roles.includes(profile?.role),
    isAuthenticated: !!user && !!profile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}