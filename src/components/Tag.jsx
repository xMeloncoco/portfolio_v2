/**
 * ========================================
 * TAG COMPONENT
 * ========================================
 * Reusable tag display component
 *
 * FEATURES:
 * - Displays a tag with name and color
 * - Optional remove button
 * - Click handler for selection
 * - Compact and full size variants
 *
 * USAGE:
 * <Tag name="React" color="#61dafb" />
 * <Tag name="CSS" onRemove={() => handleRemove()} />
 * <Tag name="JavaScript" onClick={() => handleClick()} />
 */

import Icon from './Icon'
import './Tag.css'

// ========================================
// TAG COMPONENT
// ========================================

/**
 * Tag Component
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Tag name to display
 * @param {string} [props.color='#d4af37'] - Tag color (hex)
 * @param {string} [props.size='normal'] - Tag size ('small', 'normal', 'large')
 * @param {boolean} [props.removable=false] - Show remove button
 * @param {Function} [props.onRemove] - Handler when remove button is clicked
 * @param {Function} [props.onClick] - Handler when tag is clicked
 * @param {string} [props.className] - Additional CSS classes
 */
function Tag({
  name,
  color = '#d4af37',
  size = 'normal',
  removable = false,
  onRemove,
  onClick,
  className = ''
}) {
  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle tag click
   * @param {Event} e - Click event
   */
  const handleClick = (e) => {
    if (onClick && !e.target.classList.contains('tag-remove')) {
      onClick()
    }
  }

  /**
   * Handle remove button click
   * @param {Event} e - Click event
   */
  const handleRemove = (e) => {
    e.stopPropagation() // Prevent tag click
    if (onRemove) {
      onRemove()
    }
  }

  /**
   * Handle keyboard interaction for remove button
   * @param {Event} e - Keyboard event
   */
  const handleRemoveKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRemove(e)
    }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <span
      className={`tag tag--${size} ${onClick ? 'tag--clickable' : ''} ${className}`}
      style={{
        '--tag-color': color,
        backgroundColor: `${color}20`, // 20% opacity
        borderColor: color,
        color: color
      }}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Select tag: ${name}` : undefined}
    >
      <span className="tag-name">{name}</span>

      {removable && (
        <button
          type="button"
          className="tag-remove"
          onClick={handleRemove}
          onKeyPress={handleRemoveKeyPress}
          aria-label={`Remove tag: ${name}`}
          title="Remove tag"
        >
          <Icon name="cross" size={size === 'small' ? 12 : size === 'large' ? 18 : 14} />
        </button>
      )}
    </span>
  )
}

// ========================================
// EXPORTS
// ========================================

export default Tag
