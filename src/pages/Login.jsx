/**
 * ========================================
 * LOGIN PAGE
 * ========================================
 * Admin login page for the portfolio backend
 *
 * FEATURES:
 * - Password-only authentication (no username needed)
 * - Shows/hides password toggle
 * - Error handling with user-friendly messages
 * - Loading state during authentication
 * - Redirects to admin dashboard after successful login
 *
 * USAGE:
 * This page is shown at /admin/login
 * After login, user is redirected to /admin
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { verifyPassword } from '../utils/auth'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import './Login.css'

// ========================================
// LOGIN COMPONENT
// ========================================

function Login() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Password input value
  const [password, setPassword] = useState('')

  // Show/hide password toggle
  const [showPassword, setShowPassword] = useState(false)

  // Loading state during authentication
  const [isLoading, setIsLoading] = useState(false)

  // Error message to display to user
  const [error, setError] = useState('')

  // React Router navigation
  const navigate = useNavigate()

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle form submission
   * Verifies password and redirects on success
   *
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault() // Prevent page reload

    // Clear any previous errors
    setError('')

    // Validate password is not empty
    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    try {
      // Set loading state
      setIsLoading(true)
      logger.info('Login attempt started')

      // Verify password with backend
      const result = await verifyPassword(password)

      if (result.success) {
        logger.info('✅ Login successful, redirecting to admin dashboard')

        // Redirect to admin dashboard
        navigate('/admin')
      } else {
        // Show error message from verification
        logger.warn('❌ Login failed:', result.error)
        setError(result.error || 'Login failed')

        // Clear password field on error
        setPassword('')
      }
    } catch (err) {
      // Handle unexpected errors
      logger.error('Unexpected error during login', err)
      setError('An unexpected error occurred. Please try again.')
      setPassword('')
    } finally {
      // Always reset loading state
      setIsLoading(false)
    }
  }

  /**
   * Handle password input change
   * @param {Event} e - Input change event
   */
  const handlePasswordChange = (e) => {
    setPassword(e.target.value)

    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  /**
   * Handle Enter key press on password visibility toggle
   * This is for accessibility (keyboard navigation)
   */
  const handleToggleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      togglePasswordVisibility()
    }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-background" aria-hidden="true"></div>

      {/* Login card */}
      <div className="login-card">
        {/* Header with castle icon */}
        <div className="login-header">
          <Icon name="castle" size={64} alt="Castle icon" />
          <h1 className="login-title">Admin Portal</h1>
          <p className="login-subtitle">Enter the Sacred Password</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Password input field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <Icon name="lock" size={20} alt="" />
              Password
            </label>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                className="form-input"
                placeholder="Enter admin password"
                disabled={isLoading}
                autoComplete="current-password"
                autoFocus
              />

              {/* Show/hide password toggle */}
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                onKeyPress={handleToggleKeyPress}
                tabIndex={0}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                <Icon
                  name={showPassword ? 'cross' : 'inspect-code'}
                  size={20}
                  alt=""
                />
              </button>
            </div>
          </div>

          {/* Error message display */}
          {error && (
            <div className="error-message" role="alert">
              <Icon name="cross" size={16} alt="Error" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <Icon name="sword" size={20} alt="" />
                <span>Enter</span>
              </>
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="login-footer">
          <p className="login-note">
            <Icon name="baby-feet" size={16} alt="" />
            Only authorized admins may enter
          </p>
        </div>
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default Login
