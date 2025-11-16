/**
 * ========================================
 * ITEM POPUP MODAL COMPONENT
 * ========================================
 * Modal popup for displaying inventory item or achievement details
 *
 * FEATURES:
 * - Displays item icon, name, and title
 * - Shows markdown-formatted popup content
 * - Click outside or X button to close
 * - Smooth animations
 * - Tag display
 */

import { useEffect } from 'react'
import Icon from './Icon'
import Tag from './Tag'
import './ItemPopupModal.css'

// ========================================
// ITEM POPUP MODAL COMPONENT
// ========================================

/**
 * ItemPopupModal - Displays item details in a modal popup
 * @param {Object} props - Component props
 * @param {Object} props.item - The item to display
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {boolean} props.isOpen - Whether modal is open
 */
function ItemPopupModal({ item, onClose, isOpen }) {
  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Handle escape key to close modal
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  /**
   * Prevent body scroll when modal is open
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // ========================================
  // RENDER
  // ========================================

  if (!isOpen || !item) {
    return null
  }

  /**
   * Handle backdrop click to close modal
   * @param {Event} e - Click event
   */
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('item-popup-backdrop')) {
      onClose()
    }
  }

  /**
   * Render basic markdown content
   * @param {string} content - Markdown content
   * @returns {string} - HTML string
   */
  const renderMarkdown = (content) => {
    if (!content) return ''

    // Simple markdown parsing
    let html = content
      // Escape HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Lists
      .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />')

    // Wrap in paragraph if not already structured
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>'
    }

    return html
  }

  return (
    <div className="item-popup-backdrop" onClick={handleBackdropClick}>
      <div className="item-popup-modal">
        {/* Close Button */}
        <button className="popup-close-button" onClick={onClose} aria-label="Close modal">
          <Icon name="cross" size={24} />
        </button>

        {/* Item Header */}
        <div className="popup-header">
          <div className="popup-icon">
            <Icon name={item.icon_name || 'treasure-chest'} size={64} />
          </div>
          <div className="popup-title-section">
            <h2 className="popup-item-name">{item.item_name}</h2>
            <p className="popup-item-title">{item.title}</p>
            {item.item_type === 'achievement' && (
              <span className="popup-badge achievement">
                <Icon name="trophy" size={16} />
                Achievement
              </span>
            )}
            {item.item_type === 'inventory' && (
              <span className="popup-badge inventory">
                <Icon name="treasure-chest" size={16} />
                Inventory Item
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="popup-tags">
            {item.tags.map((tag) => (
              <Tag key={tag.id} name={tag.name} color={tag.color} size="small" />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="popup-content">
          {item.popup_content ? (
            <div
              className="popup-content-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(item.popup_content) }}
            />
          ) : (
            <p className="popup-no-content">No additional details available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default ItemPopupModal
