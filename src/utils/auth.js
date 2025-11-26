/**
 * ========================================
 * AUTHENTICATION UTILITIES
 * ========================================
 * This file handles all authentication logic for the admin panel
 *
 * FEATURES:
 * - Supabase Auth integration for secure authentication
 * - Email/password authentication (email from environment variable)
 * - Session management using Supabase Auth
 * - Login/logout functionality
 * - Authentication state checking
 *
 * SECURITY NOTES:
 * - Uses Supabase Auth for proper authentication
 * - Session managed by Supabase (httpOnly cookies)
 * - RLS policies now properly enforce authenticated role
 * - No localStorage for auth state (more secure)
 */

import { supabase } from '../config/supabase'
import { logger } from './logger'

// ========================================
// CONSTANTS
// ========================================

/**
 * Admin email from environment variable
 * This allows password-only UX while using proper email/password auth behind the scenes
 */
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * Check if user is currently authenticated
 * Checks for valid Supabase Auth session
 *
 * @returns {Promise<boolean>} - True if authenticated and session is valid
 */
export async function isAuthenticated() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      logger.error('Error checking authentication session', error)
      return false
    }

    if (session) {
      logger.debug('User is authenticated with valid session')
      return true
    }

    logger.debug('No active session found')
    return false
  } catch (error) {
    logger.error('Error checking authentication status', error)
    return false
  }
}

/**
 * Get current session
 * @returns {Promise<Object|null>} - Current session or null
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      logger.error('Error getting session', error)
      return null
    }

    return session
  } catch (error) {
    logger.error('Error getting session', error)
    return null
  }
}

/**
 * Clear authentication state (logout)
 * Signs out from Supabase Auth
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error('Error during logout', error)
      throw error
    }

    logger.info('User logged out successfully')
  } catch (error) {
    logger.error('Error during logout', error)
    throw error
  }
}

// ========================================
// PASSWORD VERIFICATION
// ========================================

/**
 * Verify password using Supabase Auth
 *
 * HOW IT WORKS:
 * 1. Uses fixed admin email from environment variable
 * 2. Calls Supabase Auth signInWithPassword
 * 3. Supabase handles all password verification and session creation
 * 4. Return success/failure
 *
 * This maintains the password-only UX while using proper authentication
 *
 * @param {string} password - The password entered by the user
 * @returns {Promise<{success: boolean, error?: string}>} - Result of verification
 */
export async function verifyPassword(password) {
  try {
    logger.info('Attempting to verify password...')

    // ========================================
    // STEP 1: Validate input
    // ========================================
    if (!password || typeof password !== 'string') {
      logger.warn('Invalid password input')
      return {
        success: false,
        error: 'Password is required'
      }
    }

    // Validate admin email is configured
    if (!ADMIN_EMAIL) {
      logger.error('Admin email not configured in environment variables')
      return {
        success: false,
        error: 'Admin email not configured. Please check .env file.'
      }
    }

    // ========================================
    // STEP 2: Sign in with Supabase Auth
    // ========================================
    logger.debug('Signing in with Supabase Auth...')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: password
    })

    // Handle authentication errors
    if (error) {
      logger.warn('❌ Authentication failed:', error.message)

      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Incorrect password'
        }
      }

      return {
        success: false,
        error: 'Authentication failed. Please try again.'
      }
    }

    // Check if we got a valid session
    if (!data.session) {
      logger.error('No session created after authentication')
      return {
        success: false,
        error: 'Authentication failed. Please try again.'
      }
    }

    logger.info('✅ Authentication successful')
    logger.debug('Session created:', data.session.user.email)

    return {
      success: true,
      session: data.session
    }
  } catch (error) {
    logger.error('Error during password verification', error)
    return {
      success: false,
      error: 'An error occurred during login. Please try again.'
    }
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get remaining session time in milliseconds
 * @returns {Promise<number>} - Milliseconds until session expires (0 if not authenticated)
 */
export async function getSessionTimeRemaining() {
  try {
    const session = await getSession()

    if (!session || !session.expires_at) {
      return 0
    }

    const expiresAt = new Date(session.expires_at * 1000).getTime()
    const now = Date.now()
    const remaining = expiresAt - now

    return remaining > 0 ? remaining : 0
  } catch (error) {
    logger.error('Error getting session time remaining', error)
    return 0
  }
}

/**
 * Refresh the session
 * Call this periodically to keep the user logged in during active use
 */
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      logger.error('Error refreshing session', error)
      return false
    }

    if (data.session) {
      logger.debug('Session refreshed successfully')
      return true
    }

    return false
  } catch (error) {
    logger.error('Error refreshing session', error)
    return false
  }
}
