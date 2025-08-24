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
  const [profileLoading, setProfileLoading] = useState(false)
  const [lastProcessedUserId, setLastProcessedUserId] = useState(null)

  useEffect(() => {
    let mounted = true
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔍 SimpleAuth: Getting session...')
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted && session?.user) {
          console.log('✅ SimpleAuth: Session found, loading profile')
          await loadUserProfile(session.user)
        } else {
          console.log('ℹ️ SimpleAuth: No session found')
        }
      } catch (error) {
        console.error('❌ SimpleAuth: Session error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('✅ SimpleAuth: Loading complete')
        }
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 SimpleAuth: Auth change:', event)
      if (event === 'SIGNED_IN' && session?.user) {
        // Only load profile if it's a different user or no profile exists
        if (!profile || profile.id !== session.user.id) {
          await loadUserProfile(session.user)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLastProcessedUserId(null)
      }
      // Only set loading to false for auth events, not for initial session
      if (event !== 'INITIAL_SESSION') {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (authUser) => {
    // Prevent concurrent profile loading
    if (profileLoading) {
      console.log('⏳ SimpleAuth: Profile loading already in progress, skipping')
      return
    }
    
    // Prevent duplicate processing of the same user - more robust check
    if (lastProcessedUserId === authUser.id && user?.id === authUser.id) {
      console.log('✋ SimpleAuth: User profile already loaded, skipping')
      return
    }
    
    setProfileLoading(true)
    setLastProcessedUserId(authUser.id)
    try {
      console.log('👤 SimpleAuth: Loading profile for:', authUser.email)
      setUser(authUser)
      
      console.log('🔍 SimpleAuth: Starting database query...')
      // Try to get profile from database with a shorter timeout
      const queryPromise = supabase
        .from('profiles')
        .select('id, full_name, role, is_active, created_at, updated_at')
        .eq('id', authUser.id)
        .single()
      
      // Reduced timeout to 3 seconds for faster fallback
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 3000)
      )
      
      const { data: profileData, error } = await Promise.race([queryPromise, timeoutPromise])

      console.log('🔍 SimpleAuth: Database query complete:', { hasData: !!profileData, error: error?.code })

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create a simple one
        console.log('🔧 SimpleAuth: Creating new profile')
        const newProfile = await createSimpleProfile(authUser)
        setProfile(newProfile)
        console.log('✅ SimpleAuth: Profile creation complete')
      } else if (profileData) {
        console.log('✅ SimpleAuth: Profile loaded from database:', profileData.role)
        setProfile(profileData)
      } else {
        // Fallback: create minimal profile (no database dependency)
        console.log('🔧 SimpleAuth: Using fallback profile')
        const fallbackProfile = createFallbackProfile(authUser)
        setProfile(fallbackProfile)
      }
      
      console.log('✅ SimpleAuth: Profile loading completed successfully')
    } catch (error) {
      // Check if it's a timeout error (expected behavior)
      if (error.message === 'Database timeout') {
        console.log('⏱️ SimpleAuth: Database query timed out (3s), using fallback profile')
      } else {
        console.error('❌ SimpleAuth: Profile loading error:', error)
        console.log('🔧 SimpleAuth: Using fallback due to error')
      }
      
      // Always create a fallback so user isn't stuck
      const fallbackProfile = createFallbackProfile(authUser)
      setProfile(fallbackProfile)
      console.log('✅ SimpleAuth: Fallback profile set')
    } finally {
      setProfileLoading(false)
    }
  }

  const createSimpleProfile = async (authUser) => {
    const role = getDefaultRole(authUser.email)
    
    const profileData = {
      id: authUser.id,
      full_name: authUser.email.split('@')[0],
      role: role,
      is_active: true
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('❌ SimpleAuth: Error creating profile in DB:', error)
        return createFallbackProfile(authUser)
      }
      
      console.log('✅ SimpleAuth: Profile created in database')
      return data
    } catch (error) {
      console.error('❌ SimpleAuth: Exception creating profile:', error)
      return createFallbackProfile(authUser)
    }
  }

  const createFallbackProfile = (authUser) => {
    const fallbackProfile = {
      id: authUser.id,
      full_name: authUser.email.split('@')[0],
      role: getDefaultRole(authUser.email),
      is_active: true,
      created_at: new Date().toISOString()
    }
    console.log('✅ SimpleAuth: Created fallback profile with role:', fallbackProfile.role)
    return fallbackProfile
  }

  const getDefaultRole = (email) => {
    if (email === 'admin@admin.com') return 'admin'
    if (email === 'editor@editor.com') return 'editor'
    if (email === 'staff@staff.com') return 'staff'
    return 'customer'
  }

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
    return { error }
  }

  const updateProfile = async (updates) => {
    try {
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
      return { data: null, error }
    }
  }

  // Simple role checks
  const isAdmin = () => profile?.role === 'admin'
  const isStaff = () => ['admin', 'staff'].includes(profile?.role)
  const isEditor = () => ['admin', 'staff', 'editor'].includes(profile?.role)
  const isCustomer = () => profile?.role === 'customer'

  const value = {
    user,
    profile,
    loading,
    error: null, // Simplified - no complex error state
    signIn,
    signUp: null, // Can add later if needed
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