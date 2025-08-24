import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ 
  children, 
  requiredRole = null, 
  requiredRoles = [], 
  fallbackPath = '/login',
  adminOnly = false,
  staffOnly = false,
  editorOnly = false 
}) {
  const { user, profile, loading, isAuthenticated } = useAuth()
  const location = useLocation()
  const [verifying, setVerifying] = useState(true)  // Start with true since we need to verify
  const [hasAccess, setHasAccess] = useState(null)  // Use null to indicate "not yet determined"

  useEffect(() => {
    const verifyAccess = async () => {
      if (!isAuthenticated || !user) {
        setHasAccess(false)
        setVerifying(false)
        return
      }
      try {
        // Check specific role requirements using secure database function
        if (adminOnly) {
          const { data: isAdmin } = await supabase.rpc('has_role', { required_role: 'admin' })
          setHasAccess(isAdmin || false)
        } else if (staffOnly) {
          const { data: isStaff } = await supabase.rpc('has_role', { required_role: 'staff' })
          const { data: isAdmin } = await supabase.rpc('has_role', { required_role: 'admin' })
          setHasAccess(isStaff || isAdmin || false)
        } else if (editorOnly) {
          const { data: isEditor } = await supabase.rpc('has_role', { required_role: 'editor' })
          const { data: isStaff } = await supabase.rpc('has_role', { required_role: 'staff' })
          const { data: isAdmin } = await supabase.rpc('has_role', { required_role: 'admin' })
          setHasAccess(isEditor || isStaff || isAdmin || false)
        } else if (requiredRole) {
          const { data: hasRole } = await supabase.rpc('has_role', { required_role: requiredRole })
          setHasAccess(hasRole || false)
        } else if (requiredRoles.length > 0) {
          let hasAnyRole = false
          for (const role of requiredRoles) {
            const { data: hasRole } = await supabase.rpc('has_role', { required_role: role })
            if (hasRole) {
              hasAnyRole = true
              break
            }
          }
          setHasAccess(hasAnyRole)
        } else {
          // No specific role required, just authenticated
          setHasAccess(true)
        }
      } catch (error) {
        console.error('Error verifying access:', error)
        setHasAccess(false)
      } finally {
        setVerifying(false)
      }
    }

    verifyAccess()
  }, [user, isAuthenticated, adminOnly, staffOnly, editorOnly, requiredRole, requiredRoles])

  // Show loading spinner while checking auth or verifying access
  if (loading || verifying || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location.pathname }} replace />
  }

  // Redirect to unauthorized if access denied (only when definitively false)
  if (hasAccess === false) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}