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
    let timeoutId = null

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 AuthContext: Getting initial session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ AuthContext: Session error:', sessionError)
          throw sessionError
        }
        
        if (session?.user && isMounted) {
          console.log('✅ AuthContext: Session found, handling user session')
          await handleUserSession(session.user)
        } else {
          console.log('ℹ️ AuthContext: No session found')
        }
      } catch (error) {
        console.error('❌ AuthContext: Error getting initial session:', error)
        if (isMounted) {
          setError(error.message)
        }
      } finally {
        if (isMounted) {
          console.log('✅ AuthContext: Initial session check complete, setting loading to false')
          setLoading(false)
          // Clear timeout since we're done
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }
      }
    }

    // Set a timeout to ensure loading doesn't get stuck
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('⚠️ AuthContext: Loading timeout reached, forcing loading to false')
        setLoading(false)
      }
    }, 8000) // 8 second timeout to allow for slower database queries

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log('🔄 AuthContext: Auth state change:', event)
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ AuthContext: User signed in')
          await handleUserSession(session.user)
        } else if (event === 'SIGNED_OUT') {
          console.log('ℹ️ AuthContext: User signed out')
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('❌ AuthContext: Auth state change error:', error)
        setError(error.message)
      } finally {
        if (isMounted) {
          setLoading(false)
          // Clear timeout since auth state processing is complete
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }
      }
    })

    return () => {
      console.log('🧹 AuthContext: Cleanup')
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, [])

  const handleUserSession = async (user) => {
    try {
      console.log('👤 AuthContext: Handling user session for:', user.email)
      console.log('👤 AuthContext: User ID:', user.id)
      setUser(user)
      
      // Try direct profile fetch first (faster than RPC)
      let profileData = null
      let profileError = null
      
      console.log('🔍 AuthContext: Fetching profile from database...')
      try {
        // Add a race condition with timeout for the database query
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 3000)
        )
        
        const { data, error } = await Promise.race([queryPromise, timeoutPromise])
        
        console.log('🔍 AuthContext: Profile query result:', { data, error })
        profileData = data
        profileError = error
      } catch (err) {
        console.error('❌ AuthContext: Exception during profile fetch:', err)
        if (err.message === 'Database query timeout') {
          console.error('❌ AuthContext: Database query timed out after 3 seconds')
          // Try a simple test query to check database connectivity
          try {
            const { data: testData, error: testError } = await supabase
              .from('profiles')
              .select('count', { count: 'exact', head: true })
              .limit(1)
            console.log('🔍 AuthContext: Database connectivity test:', { testData, testError })
          } catch (testErr) {
            console.error('❌ AuthContext: Database connectivity test failed:', testErr)
          }
        }
        profileError = err
      }
      
      if (profileError) {
        console.error('❌ AuthContext: Error fetching profile:', profileError)
        console.log('🔍 AuthContext: Error code:', profileError.code)
        console.log('🔍 AuthContext: Error message:', profileError.message)
        
        // If profile doesn't exist, create one (ONLY for truly new users)
        if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows found')) {
          console.log('🔧 AuthContext: Profile not found, determining role for user:', user.email)
          
          // Determine role based on email for specific system accounts
          let userRole = 'customer' // Default for new users
          
          if (user.email === 'admin@admin.com') {
            userRole = 'admin'
          } else if (user.email === 'editor@editor.com') {
            userRole = 'editor'
          } else if (user.email === 'staff@staff.com') {
            userRole = 'staff'
          }
          
          console.log(`🔧 AuthContext: Assigning role '${userRole}' to user:`, user.email)
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              role: userRole,
              is_active: true
            })
            .select()
            .single()
          
          if (createError) {
            console.error('❌ AuthContext: Error creating profile:', createError)
            throw new Error(`Failed to create profile: ${createError.message}`)
          }
          
          setProfile(newProfile)
          console.log('✅ AuthContext: New profile created with role:', newProfile)
        } else {
          // For other database errors or timeouts
          console.error('❌ AuthContext: Database error, cannot determine user role')
          
          // Check if this is a timeout error
          const isTimeout = profileError.message === 'Database query timeout'
          
          if (isTimeout || user.email) {
            console.log('🔧 AuthContext: Creating fallback profile for refresh/timeout scenario')
            let fallbackRole = 'customer'
            
            // Check if this is a known system account
            if (user.email === 'admin@admin.com') {
              fallbackRole = 'admin'
            } else if (user.email === 'editor@editor.com') {
              fallbackRole = 'editor'
            } else if (user.email === 'staff@staff.com') {
              fallbackRole = 'staff'
            }
            
            const fallbackProfile = {
              id: user.id,
              full_name: user.email?.split('@')[0] || 'User',
              role: fallbackRole,
              is_active: true,
              avatar_url: null,
              phone: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            setProfile(fallbackProfile)
            console.log('✅ AuthContext: Using fallback profile with role:', fallbackRole)
            return
          }
          
          throw new Error(`Profile fetch failed: ${profileError.message}`)
        }
      } else if (profileData) {
        console.log('✅ AuthContext: Profile data found:', profileData)
        
        // Verify user is active
        if (!profileData.is_active) {
          console.error('❌ AuthContext: User account is deactivated')
          throw new Error('Account is deactivated. Please contact support.')
        }
        
        setProfile(profileData)
        console.log('✅ AuthContext: Profile loaded from database with role:', profileData.role)
      } else {
        // No profile data returned - this shouldn't happen
        console.error('❌ AuthContext: No profile data returned from database')
        throw new Error('No profile data available')
      }
      
    } catch (error) {
      console.error('❌ AuthContext: Error handling user session:', error)
      setError(error.message)
      // Clear user session on critical errors
      setUser(null)
      setProfile(null)
    } finally {
      // Ensure loading is cleared after profile processing
      console.log('✅ AuthContext: Handleling user session complete, clearing loading state')
      setLoading(false)
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