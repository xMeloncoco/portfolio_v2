/**
 * ========================================
 * INVENTORY ITEM FORM (Create/Edit)
 * ========================================
 * Form for creating or editing inventory items and achievements
 *
 * FEATURES:
 * - Item name and title inputs
 * - Item type selector (inventory/achievement)
 * - Icon picker from available icons
 * - Visibility toggle
 * - Tag selector
 * - Popup content editor (markdown)
 * - Form validation
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem
} from '../services/inventoryService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import TagSelector from '../components/TagSelector'
import './InventoryForm.css'

// ========================================
// AVAILABLE ICONS
// ========================================

const AVAILABLE_ICONS = [
  'treasure-chest', 'trophy', 'crown', 'gem', 'star',
  'castle', 'sword', 'code', 'programming', 'web-design',
  'puzzle', 'idea', 'tools', 'controller', 'gameboy',
  'lintje1', 'lintje2', 'gift', 'finish', 'goal'
]

// ========================================
// INVENTORY FORM COMPONENT
// ========================================

function InventoryForm() {
  // ========================================
  // ROUTING
  // ========================================

  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Form data
  const [formData, setFormData] = useState({
    item_name: '',
    title: '',
    item_type: 'inventory',
    visibility: 'public',
    icon_name: 'treasure-chest',
    popup_content: ''
  })

  // Tags
  const [selectedTags, setSelectedTags] = useState([])

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch item data if editing
   */
  useEffect(() => {
    if (isEditing) {
      fetchItemData()
    }
  }, [id])

  /**
   * Load item data for editing
   */
  const fetchItemData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info(`Fetching inventory item data for ID: ${id}`)

      const { data, error: fetchError } = await getInventoryItemById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching item', fetchError)
      } else if (data) {
        // Populate form with existing data
        setFormData({
          item_name: data.item_name || '',
          title: data.title || '',
          item_type: data.item_type || 'inventory',
          visibility: data.visibility || 'public',
          icon_name: data.icon_name || 'treasure-chest',
          popup_content: data.popup_content || ''
        })

        // Set selected tags
        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTags(data.tags)
        }

        logger.info('Item data loaded successfully')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching item', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // FORM HANDLERS
  // ========================================

  /**
   * Handle form field changes
   * @param {Event} e - Change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  /**
   * Handle tags change
   * @param {Array} tags - Selected tags
   */
  const handleTagsChange = (tags) => {
    setSelectedTags(tags)
  }

  /**
   * Handle icon selection
   * @param {string} iconName - Selected icon name
   */
  const handleIconSelect = (iconName) => {
    setFormData((prev) => ({
      ...prev,
      icon_name: iconName
    }))
  }

  /**
   * Validate form data
   * @returns {boolean} - True if valid
   */
  const validateForm = () => {
    const errors = {}

    // Item name is required
    if (!formData.item_name.trim()) {
      errors.item_name = 'Item name is required'
    } else if (formData.item_name.length > 100) {
      errors.item_name = 'Item name must be less than 100 characters'
    }

    // Title is required
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      logger.warn('Form validation failed', validationErrors)
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      // Prepare item data
      const itemData = {
        item_name: formData.item_name.trim(),
        title: formData.title.trim(),
        item_type: formData.item_type,
        visibility: formData.visibility,
        icon_name: formData.icon_name,
        popup_content: formData.popup_content
      }

      // Add tag IDs
      const tagIds = selectedTags.map((t) => t.id)

      let result

      if (isEditing) {
        // Update existing item
        logger.info(`Updating inventory item: ${id}`)
        result = await updateInventoryItem(id, itemData, tagIds)
      } else {
        // Create new item
        logger.info('Creating new inventory item')
        result = await createInventoryItem(itemData, tagIds)
      }

      if (result.error) {
        setError(result.error)
        logger.error(`Error ${isEditing ? 'updating' : 'creating'} item`, result.error)
        return
      }

      logger.info(`Item ${isEditing ? 'updated' : 'created'} successfully`)

      // Navigate back to inventory list
      navigate('/admin/inventory')
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error saving item', err)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    navigate('/admin/inventory')
  }

  // ========================================
  // RENDER
  // ========================================

  // Show loading state
  if (isLoading) {
    return (
      <div className="inventory-form-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading item data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="inventory-form-container">
      {/* Header */}
      <div className="inventory-form-header">
        <Icon name={isEditing ? 'edit-pencil' : 'plus'} size={48} />
        <div>
          <h1>{isEditing ? 'Edit Item' : 'Create New Item'}</h1>
          <p className="form-subtitle">
            {isEditing ? 'Modify your inventory item or achievement' : 'Add a new item to your inventory'}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <Icon name="cross" size={24} />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="inventory-form">
        {/* Basic Info Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="treasure-chest" size={24} />
            Item Details
          </h2>

          {/* Item Name */}
          <div className="form-group">
            <label htmlFor="item_name" className="form-label">
              Item Name <span className="required">*</span>
              <span className="label-hint">(Display name in inventory grid)</span>
            </label>
            <input
              type="text"
              id="item_name"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder="e.g., Portfolio Website"
              className={`form-input ${validationErrors.item_name ? 'error' : ''}`}
              maxLength={100}
            />
            {validationErrors.item_name && (
              <span className="error-message">{validationErrors.item_name}</span>
            )}
            <span className="char-count">{formData.item_name.length}/100</span>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
              <span className="label-hint">(Internal/list view title)</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., RPG-themed Portfolio v2"
              className={`form-input ${validationErrors.title ? 'error' : ''}`}
              maxLength={200}
            />
            {validationErrors.title && (
              <span className="error-message">{validationErrors.title}</span>
            )}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Item Type */}
          <div className="form-group">
            <label className="form-label">Item Type</label>
            <div className="type-selector">
              <button
                type="button"
                className={`type-option ${formData.item_type === 'inventory' ? 'selected' : ''}`}
                onClick={() => handleChange({ target: { name: 'item_type', value: 'inventory' } })}
              >
                <Icon name="treasure-chest" size={32} />
                <span className="type-label">Inventory</span>
                <span className="type-description">Projects, tools, artifacts</span>
              </button>
              <button
                type="button"
                className={`type-option ${formData.item_type === 'achievement' ? 'selected' : ''}`}
                onClick={() => handleChange({ target: { name: 'item_type', value: 'achievement' } })}
              >
                <Icon name="trophy" size={32} />
                <span className="type-label">Achievement</span>
                <span className="type-description">Certificates, courses, badges</span>
              </button>
            </div>
          </div>

          {/* Visibility */}
          <div className="form-group">
            <label htmlFor="visibility" className="form-label">
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="form-select"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Icon Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="star" size={24} />
            Icon
          </h2>

          <div className="form-group">
            <label className="form-label">
              Select Icon
              <span className="label-hint">(Shown in inventory grid)</span>
            </label>
            <div className="icon-grid">
              {AVAILABLE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  className={`icon-option ${formData.icon_name === iconName ? 'selected' : ''}`}
                  onClick={() => handleIconSelect(iconName)}
                  title={iconName}
                >
                  <Icon name={iconName} size={32} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="gem" size={24} />
            Tags
          </h2>

          <div className="form-group">
            <label className="form-label">
              Add Tags
              <span className="label-hint">(Optional categorization)</span>
            </label>
            <TagSelector selectedTags={selectedTags} onTagsChange={handleTagsChange} />
          </div>
        </div>

        {/* Popup Content Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="writing" size={24} />
            Popup Content
          </h2>

          <div className="form-group">
            <label htmlFor="popup_content" className="form-label">
              Content
              <span className="label-hint">(Shown when item is clicked - supports markdown)</span>
            </label>
            <textarea
              id="popup_content"
              name="popup_content"
              value={formData.popup_content}
              onChange={handleChange}
              placeholder="Describe this item... You can use **bold**, *italic*, and other markdown."
              className="form-textarea"
              rows={10}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCancel} disabled={isSaving}>
            <Icon name="cross" size={24} />
            <span>Cancel</span>
          </button>

          <button type="submit" className="save-button" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="button-spinner"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon name="checkmark" size={24} />
                <span>{isEditing ? 'Update Item' : 'Create Item'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default InventoryForm
