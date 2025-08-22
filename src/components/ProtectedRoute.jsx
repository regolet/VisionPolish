import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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

  // Show loading spinner while checking auth
  if (loading) {
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

  // Check role-based access
  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  if (staffOnly && !['admin', 'staff'].includes(profile?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (editorOnly && !['admin', 'staff', 'editor'].includes(profile?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(profile?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}