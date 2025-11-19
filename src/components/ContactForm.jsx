/**
 * ========================================
 * CONTACT FORM COMPONENT
 * ========================================
 * Modal form for submitting contact messages
 *
 * FEATURES:
 * - Email validation
 * - Category selection with RPG theme
 * - Form validation before submission
 * - Success/error feedback
 * - Accessible with keyboard navigation
 *
 * USAGE:
 * <ContactForm
 *   isOpen={showForm}
 *   onClose={() => setShowForm(false)}
 *   onSuccess={() => showSuccessMessage()}
 * />
 */

import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'
import { submitMessage, getAllCategories, isValidEmail } from '../services/contactService'
import './ContactForm.css'

// ========================================
// CONTACT FORM COMPONENT
// ========================================

/**
 * ContactForm Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the form is open
 * @param {Function} props.onClose - Handler to close the form
 * @param {Function} [props.onSuccess] - Optional success callback
 */
function ContactForm({ isOpen, onClose, onSuccess }) {
  // ========================================
  // STATE
  // ========================================

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    category: '',
    subject: '',
    message: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const categories = getAllCategories()
  const formRef = useRef(null)
  const emailInputRef = useRef(null)

  // ========================================
  // EFFECTS
  // ========================================

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset form state
      setFormData({
        email: '',
        name: '',
        category: '',
        subject: '',
        message: ''
      })
      setErrors({})
      setSubmitError(null)
      setSubmitSuccess(false)

      // Focus first input
      if (emailInputRef.current) {
        emailInputRef.current.focus()
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, isSubmitting])

  // ========================================
  // VALIDATION
  // ========================================

  /**
   * Validate a single field
   */
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) {
          return 'Email is required'
        }
        if (!isValidEmail(value)) {
          return 'Please enter a valid email address'
        }
        return null

      case 'name':
        if (!value.trim()) {
          return 'Name is required'
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters'
        }
        return null

      case 'category':
        if (!value) {
          return 'Please select a category'
        }
        return null

      case 'subject':
        if (!value.trim()) {
          return 'Subject is required'
        }
        if (value.trim().length < 5) {
          return 'Subject must be at least 5 characters'
        }
        return null

      case 'message':
        if (!value.trim()) {
          return 'Message is required'
        }
        if (value.trim().length < 10) {
          return 'Message must be at least 10 characters'
        }
        return null

      default:
        return null
    }
  }

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const newErrors = {}

    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field])
      if (error) {
        newErrors[field] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }

    // Clear submit error
    if (submitError) {
      setSubmitError(null)
    }
  }

  /**
   * Handle field blur (validate on blur)
   */
  const handleBlur = (e) => {
    const { name, value } = e.target
    const error = validateField(name, value)
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear previous errors
    setSubmitError(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    // Submit message
    setIsSubmitting(true)

    try {
      const { data, error } = await submitMessage(formData)

      if (error) {
        setSubmitError(error)
        setIsSubmitting(false)
        return
      }

      // Success!
      setSubmitSuccess(true)
      setIsSubmitting(false)

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }

      // Close after a short delay
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setSubmitError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose()
    }
  }

  // ========================================
  // RENDER
  // ========================================

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="contact-form-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-form-title"
    >
      <div className="contact-form-modal" ref={formRef}>
        {/* Header */}
        <div className="contact-form-header">
          <Icon name="mail" size={32} />
          <h2 id="contact-form-title">Send Me a Message</h2>
          <button
            type="button"
            className="contact-form-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close form"
          >
            <Icon name="cross" size={24} />
          </button>
        </div>

        {/* Success message */}
        {submitSuccess && (
          <div className="contact-form-success">
            <Icon name="done" size={24} />
            <p>Message sent successfully! I&apos;ll get back to you soon.</p>
          </div>
        )}

        {/* Error message */}
        {submitError && (
          <div className="contact-form-error">
            <Icon name="bug" size={24} />
            <p>{submitError}</p>
          </div>
        )}

        {/* Form */}
        {!submitSuccess && (
          <form onSubmit={handleSubmit} className="contact-form">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                ref={emailInputRef}
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.email ? 'error' : ''}
                disabled={isSubmitting}
                placeholder="your.email@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            {/* Name */}
            <div className="form-group">
              <label htmlFor="name">
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.name ? 'error' : ''}
                disabled={isSubmitting}
                placeholder="Your Name"
                autoComplete="name"
              />
              {errors.name && <p className="error-message">{errors.name}</p>}
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="category">
                Quest Type <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.category ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="">Select a quest type...</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} - {cat.description}
                  </option>
                ))}
              </select>
              {formData.category && (
                <p className="category-description">
                  {categories.find(c => c.value === formData.category)?.description}
                </p>
              )}
              {errors.category && <p className="error-message">{errors.category}</p>}
            </div>

            {/* Subject */}
            <div className="form-group">
              <label htmlFor="subject">
                Subject <span className="required">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.subject ? 'error' : ''}
                disabled={isSubmitting}
                placeholder="What's this quest about?"
              />
              {errors.subject && <p className="error-message">{errors.subject}</p>}
            </div>

            {/* Message */}
            <div className="form-group">
              <label htmlFor="message">
                Message <span className="required">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.message ? 'error' : ''}
                disabled={isSubmitting}
                placeholder="Tell me about your quest..."
                rows={6}
              />
              {errors.message && <p className="error-message">{errors.message}</p>}
            </div>

            {/* Submit button */}
            <div className="contact-form-footer">
              <button
                type="button"
                className="button button--secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <Icon name="cross" size={20} />
                Cancel
              </button>

              <button
                type="submit"
                className="button button--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Icon name="mail" size={20} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default ContactForm
