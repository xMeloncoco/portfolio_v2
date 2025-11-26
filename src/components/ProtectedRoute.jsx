/**
 * ========================================
 * PROTECTED ROUTE COMPONENT
 * ========================================
 * This component wraps admin routes to ensure only authenticated
 * users can access them
 *
 * HOW IT WORKS:
 * - Checks if user is authenticated using Supabase Auth
 * - Shows loading state while checking authentication
 * - If authenticated: shows the requested page
 * - If not authenticated: redirects to login page
 * - Listens for auth state changes in real-time
 *
 * USAGE:
 * <ProtectedRoute>
 *   <AdminDashboard />
 * </ProtectedRoute>
 */

import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// PROTECTED ROUTE COMPONENT
// ========================================

/**
 * ProtectedRoute Component
 *
 * Wraps child components and only renders them if user is authenticated
 * Otherwise redirects to login page
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to protect
 */
function ProtectedRoute({ children }) {
  // State to track authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(null) // null = loading, true/false = checked

  useEffect(() => {
    // Check initial session
    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('Auth state changed:', event)
      setIsAuthenticated(!!session)
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Check if user has valid session
   */
  async function checkAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        logger.error('Error checking authentication', error)
        setIsAuthenticated(false)
        return
      }

      logger.debug(`Authentication check: ${!!session}`)
      setIsAuthenticated(!!session)
    } catch (error) {
      logger.error('Error in checkAuth', error)
      setIsAuthenticated(false)
    }
  }

  // Loading state - show nothing or a loading spinner
  if (isAuthenticated === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a2e'
      }}>
        <div style={{
          color: '#00d9ff',
          fontSize: '1.2rem'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    logger.info('User not authenticated, redirecting to login')
    return <Navigate to="/admin/login" replace />
  }

  // Authenticated - render protected content
  logger.debug('User authenticated, rendering protected content')
  return children
}

// ========================================
// EXPORTS
// ========================================

export default ProtectedRoute
