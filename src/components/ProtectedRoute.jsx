/**
 * ========================================
 * PROTECTED ROUTE COMPONENT
 * ========================================
 * This component wraps admin routes to ensure only authenticated
 * users can access them
 *
 * HOW IT WORKS:
 * - Checks if user is authenticated using isAuthenticated()
 * - If authenticated: shows the requested page
 * - If not authenticated: redirects to login page
 *
 * USAGE:
 * <ProtectedRoute>
 *   <AdminDashboard />
 * </ProtectedRoute>
 */

import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../utils/auth'
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
  // Check authentication status
  const authenticated = isAuthenticated()

  // Log the authentication check for debugging
  logger.debug(`ProtectedRoute: Authentication check = ${authenticated}`)

  // If not authenticated, redirect to login
  if (!authenticated) {
    logger.info('User not authenticated, redirecting to login')
    return <Navigate to="/admin/login" replace />
  }

  // If authenticated, render the children
  logger.debug('User authenticated, rendering protected content')
  return children
}

// ========================================
// EXPORTS
// ========================================

export default ProtectedRoute
