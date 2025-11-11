/**
 * Simple logging utility for development and debugging
 * This will help track issues across different phases
 */

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
}

class Logger {
  constructor() {
    this.isDevelopment = import.meta.env.DEV
  }

  /**
   * Log general information
   */
  info(message, data = null) {
    if (this.isDevelopment) {
      console.log(`ℹ️ [${LOG_LEVELS.INFO}]`, message, data || '')
    }
  }

  /**
   * Log warnings
   */
  warn(message, data = null) {
    if (this.isDevelopment) {
      console.warn(`⚠️ [${LOG_LEVELS.WARN}]`, message, data || '')
    }
  }

  /**
   * Log errors - these should always show
   */
  error(message, error = null) {
    console.error(`❌ [${LOG_LEVELS.ERROR}]`, message, error || '')
    
    // In production, you could send this to an error tracking service
    // like Sentry, LogRocket, etc.
  }

  /**
   * Debug logs - only in development
   */
  debug(message, data = null) {
    if (this.isDevelopment) {
      console.log(`🔍 [${LOG_LEVELS.DEBUG}]`, message, data || '')
    }
  }
}

// Export singleton instance
export const logger = new Logger()