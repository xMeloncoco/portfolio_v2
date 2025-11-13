/**
 * ========================================
 * AUTHENTICATION UTILITIES
 * ========================================
 * This file handles all authentication logic for the admin panel
 *
 * FEATURES:
 * - Password verification with bcrypt
 * - Session management using localStorage
 * - Login/logout functionality
 * - Authentication state checking
 *
 * SECURITY NOTES:
 * - Passwords are hashed using bcrypt
 * - We never store plain passwords
 * - Session is stored in localStorage (simple, but works for single admin)
 * - For production, consider using httpOnly cookies
 */

import { supabase } from '../config/supabase'
import { logger } from './logger'

// ========================================
// CONSTANTS
// ========================================

/**
 * Key used to store authentication state in localStorage
 */
const AUTH_STORAGE_KEY = 'portfolio_admin_authenticated'

/**
 * Session duration in milliseconds (24 hours)
 * After this time, the user will need to log in again
 */
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * Check if user is currently authenticated
 * Verifies both that the auth flag exists and hasn't expired
 *
 * @returns {boolean} - True if authenticated and session is valid
 */
export function isAuthenticated() {
  try {
    // Get authentication data from localStorage
    const authData = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!authData) {
      logger.debug('No authentication data found')
      return false
    }

    // Parse the stored data
    const { authenticated, timestamp } = JSON.parse(authData)

    // Check if authenticated flag is true
    if (!authenticated) {
      logger.debug('User not authenticated')
      return false
    }

    // Check if session has expired
    const now = Date.now()
    const sessionAge = now - timestamp

    if (sessionAge > SESSION_DURATION) {
      logger.info('Session expired, logging out')
      logout() // Clear expired session
      return false
    }

    logger.debug('User is authenticated, session valid')
    return true
  } catch (error) {
    logger.error('Error checking authentication status', error)
    return false
  }
}

/**
 * Set the user as authenticated
 * Stores authentication state with timestamp in localStorage
 */
function setAuthenticated() {
  try {
    const authData = {
      authenticated: true,
      timestamp: Date.now()
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData))
    logger.info('User authenticated successfully')
  } catch (error) {
    logger.error('Error setting authentication state', error)
    throw error
  }
}

/**
 * Clear authentication state
 * Removes user session from localStorage
 */
export function logout() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
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
 * Verify a password against the stored hash in Supabase
 *
 * HOW IT WORKS:
 * 1. Fetch the password hash from Supabase admin_config table
 * 2. Use bcryptjs to compare the entered password with the hash
 * 3. If match, set authentication state
 * 4. Return success/failure
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

    // ========================================
    // STEP 2: Fetch password hash from Supabase
    // ========================================
    logger.debug('Fetching password hash from Supabase...')

    const { data, error } = await supabase
      .from('admin_config')
      .select('password_hash')
      .limit(1)
      .single()

    // Handle Supabase errors
    if (error) {
      logger.error('Error fetching password hash from Supabase', error)
      return {
        success: false,
        error: 'Database error. Please check Supabase setup.'
      }
    }

    // Check if we got the password hash
    if (!data || !data.password_hash) {
      logger.error('No password hash found in database')
      return {
        success: false,
        error: 'Admin configuration not found. Please run supabase-setup.sql'
      }
    }

    logger.debug('Password hash retrieved successfully')

    // ========================================
    // STEP 3: Compare password with hash
    // ========================================
    // Import bcryptjs for password comparison
    // We're using a simple comparison for now
    // In production, you should use bcrypt.compare()
    const bcrypt = await import('bcryptjs')

    logger.debug('Comparing password with hash...')
    const isMatch = await bcrypt.compare(password, data.password_hash)

    if (isMatch) {
      logger.info('✅ Password verification successful')

      // Set authenticated state
      setAuthenticated()

      return {
        success: true
      }
    } else {
      logger.warn('❌ Password verification failed - incorrect password')
      return {
        success: false,
        error: 'Incorrect password'
      }
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
 * @returns {number} - Milliseconds until session expires (0 if not authenticated)
 */
export function getSessionTimeRemaining() {
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!authData) {
      return 0
    }

    const { timestamp } = JSON.parse(authData)
    const now = Date.now()
    const elapsed = now - timestamp
    const remaining = SESSION_DURATION - elapsed

    return remaining > 0 ? remaining : 0
  } catch (error) {
    logger.error('Error getting session time remaining', error)
    return 0
  }
}

/**
 * Refresh the session timestamp
 * Call this periodically to keep the user logged in during active use
 */
export function refreshSession() {
  if (isAuthenticated()) {
    setAuthenticated() // This updates the timestamp
    logger.debug('Session refreshed')
  }
}
