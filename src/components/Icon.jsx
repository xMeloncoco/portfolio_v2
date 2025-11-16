/**
 * ========================================
 * ICON COMPONENT
 * ========================================
 * This component displays custom icons from your icon sets.
 *
 * FEATURES:
 * - Loads icons from different icon sets (currently set1)
 * - Allows changing entire icon set by modifying one variable
 * - Supports fallback icons if icon is not found
 * - Configurable size and styling
 * - Accessible with alt text
 *
 * USAGE EXAMPLES:
 * <Icon name="home" />
 * <Icon name="logout" size={32} />
 * <Icon name="sword" alt="Quest icon" className="custom-class" />
 *
 * HOW TO CHANGE ICON SET:
 * - Change the ICON_SET constant below to 'set2', 'set3', etc.
 * - Make sure you have the corresponding folder in assets/icons/
 */

import { useState } from 'react'
import { logger } from '../utils/logger'
import './Icon.css'

// ========================================
// CONFIGURATION
// ========================================

/**
 * Active icon set name
 * Change this to switch between different icon sets
 * Must match a folder name in src/assets/icons/
 */
const ICON_SET = 'set1'

/**
 * Default fallback icon when requested icon is not found
 */
const FALLBACK_ICON = 'default-user'

/**
 * Default size for icons (in pixels)
 */
const DEFAULT_ICON_SIZE = 28

// ========================================
// ICON COMPONENT
// ========================================

/**
 * Icon Component
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Name of the icon file (without extension)
 * @param {number} [props.size=24] - Size of the icon in pixels
 * @param {string} [props.alt] - Alt text for accessibility (defaults to icon name)
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Additional inline styles
 * @param {Function} [props.onClick] - Click handler
 */
function Icon({
  name,
  size = DEFAULT_ICON_SIZE,
  alt,
  className = '',
  style = {},
  onClick
}) {
  // Track if icon failed to load so we can use fallback
  const [iconError, setIconError] = useState(false)
  const [fallbackError, setFallbackError] = useState(false)

  // ========================================
  // ICON PATH GENERATION
  // ========================================

  /**
   * Generates the path to the icon file
   * @param {string} iconName - Name of the icon
   * @returns {string} - Path to the icon file
   */
  const getIconPath = (iconName) => {
    try {
      // Use Vite's import.meta.glob for dynamic imports
      // This constructs the path: /src/assets/icons/set1/home.png
      return `/src/assets/icons/${ICON_SET}/${iconName}.png`
    } catch (error) {
      logger.error(`Error generating icon path for: ${iconName}`, error)
      return null
    }
  }

  // ========================================
  // ERROR HANDLING
  // ========================================

  /**
   * Handle icon load error
   * Falls back to the default icon
   */
  const handleIconError = () => {
    if (!iconError) {
      logger.warn(`Icon not found: ${name}, falling back to: ${FALLBACK_ICON}`)
      setIconError(true)
    }
  }

  /**
   * Handle fallback icon error
   * This means even the fallback icon is missing
   */
  const handleFallbackError = () => {
    if (!fallbackError) {
      logger.error(`Fallback icon not found: ${FALLBACK_ICON}`)
      setFallbackError(true)
    }
  }

  // ========================================
  // DETERMINE WHICH ICON TO SHOW
  // ========================================

  // If main icon failed and fallback also failed, show text fallback
  if (iconError && fallbackError) {
    return (
      <span
        className={`icon-text-fallback ${className}`}
        style={{
          fontSize: size * 0.6, // Scale text to roughly match icon size
          display: 'inline-block',
          width: size,
          height: size,
          lineHeight: `${size}px`,
          textAlign: 'center',
          ...style
        }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Show first letter of icon name as last resort */}
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }

  // Determine which icon path to use
  const iconPath = iconError ? getIconPath(FALLBACK_ICON) : getIconPath(name)
  const iconAlt = alt || `${name} icon`

  // ========================================
  // RENDER ICON
  // ========================================

  return (
    <img
      src={iconPath}
      alt={iconAlt}
      className={`icon ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
      onError={iconError ? handleFallbackError : handleIconError}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    />
  )
}

// ========================================
// EXPORTS
// ========================================

export default Icon

/**
 * Export configuration for testing or external use
 */
export { ICON_SET, FALLBACK_ICON, DEFAULT_ICON_SIZE }
