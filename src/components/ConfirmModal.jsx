/**
 * ========================================
 * CONFIRM MODAL COMPONENT
 * ========================================
 * Reusable modal for confirmations (e.g., delete actions)
 *
 * FEATURES:
 * - Customizable title, message, and buttons
 * - Closes on backdrop click or Escape key
 * - Accessible with focus management
 * - Danger/warning styling options
 *
 * USAGE:
 * <ConfirmModal
 *   isOpen={showModal}
 *   title="Delete Page"
 *   message="Are you sure you want to delete this page?"
 *   confirmText="Delete"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowModal(false)}
 *   variant="danger"
 * />
 */

import { useEffect, useRef } from 'react'
import Icon from './Icon'
import './ConfirmModal.css'

// ========================================
// CONFIRM MODAL COMPONENT
// ========================================

/**
 * ConfirmModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message/description
 * @param {string} [props.confirmText='Confirm'] - Confirm button text
 * @param {string} [props.cancelText='Cancel'] - Cancel button text
 * @param {Function} props.onConfirm - Handler for confirm action
 * @param {Function} props.onCancel - Handler for cancel action
 * @param {string} [props.variant='default'] - Variant ('default', 'danger', 'warning')
 * @param {boolean} [props.isLoading=false] - Show loading state on confirm button
 * @param {string} [props.iconName] - Optional icon name for the header
 */
function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false,
  iconName
}) {
  // Reference to the modal for focus management
  const modalRef = useRef(null)
  const confirmButtonRef = useRef(null)

  // ========================================
  // EFFECTS
  // ========================================

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the cancel button when modal opens
      if (confirmButtonRef.current) {
        confirmButtonRef.current.focus()
      }
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onCancel, isLoading])

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle backdrop click
   * Only closes if clicking directly on the backdrop
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel()
    }
  }

  /**
   * Handle confirm button click
   */
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm()
    }
  }

  // ========================================
  // RENDER
  // ========================================

  // Don't render if not open
  if (!isOpen) {
    return null
  }

  // Determine icon based on variant if not provided
  const displayIcon = iconName || (variant === 'danger' ? 'trash-can' : variant === 'warning' ? 'bug' : 'inspect-code')

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-message"
    >
      <div
        className={`modal-content modal-content--${variant}`}
        ref={modalRef}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <Icon name={displayIcon} size={32} />
          <h2 id="modal-title" className="modal-title">{title}</h2>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <p id="modal-message" className="modal-message">{message}</p>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="modal-button modal-button--cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            <Icon name="cross" size={20} />
            {cancelText}
          </button>

          <button
            type="button"
            className={`modal-button modal-button--confirm modal-button--${variant}`}
            onClick={handleConfirm}
            disabled={isLoading}
            ref={confirmButtonRef}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                <Icon name={variant === 'danger' ? 'trash-can' : 'done'} size={20} />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default ConfirmModal
