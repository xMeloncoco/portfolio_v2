/**
 * ========================================
 * PAGE FORM (Create/Edit)
 * ========================================
 * Complete form for creating or editing pages
 *
 * FEATURES:
 * - Title input with validation
 * - Page type selector (Blog, Devlog, Notes, Project)
 * - Visibility toggle (Public/Private)
 * - Content editor (textarea with markdown support)
 * - Tag selector with create capability
 * - Quest linking (optional)
 * - Project-specific fields (status, dates)
 * - Form validation
 * - Auto-save indicator
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPageById, createPage, updatePage } from '../services/pagesService'
import { getAllQuests } from '../services/questsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import TagSelector from '../components/TagSelector'
import './PageForm.css'

// ========================================
// CONSTANTS
// ========================================

/**
 * Page type options
 */
const PAGE_TYPES = [
  { value: 'blog', label: 'Blog', icon: 'writing', description: 'General blog posts and articles' },
  { value: 'devlog', label: 'Devlog', icon: 'logbook', description: 'Development logs with to-do lists' },
  { value: 'notes', label: 'Notes', icon: 'parchment', description: 'Quick notes and references' },
  { value: 'project', label: 'Project', icon: 'castle', description: 'Project documentation with status tracking' }
]

/**
 * Visibility options
 */
const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: 'lock', description: 'Only visible in admin' },
  { value: 'public', label: 'Public', icon: 'web', description: 'Visible to everyone' }
]

/**
 * Project status options
 */
const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
]

// ========================================
// PAGE FORM COMPONENT
// ========================================

function PageForm() {
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
    title: '',
    page_type: 'notes',
    visibility: 'private',
    content: '',
    project_status: 'planning',
    project_start_date: '',
    project_end_date: '',
    external_link: ''
  })

  // Tags and quests
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedQuestIds, setSelectedQuestIds] = useState([])
  const [availableQuests, setAvailableQuests] = useState([])

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch page data if editing
   */
  useEffect(() => {
    if (isEditing) {
      fetchPageData()
    }
  }, [id])

  /**
   * Fetch available quests for linking
   */
  useEffect(() => {
    fetchQuests()
  }, [])

  /**
   * Load page data for editing
   */
  const fetchPageData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info(`Fetching page data for ID: ${id}`)

      const { data, error: fetchError } = await getPageById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching page', fetchError)
      } else if (data) {
        // Populate form with existing data
        setFormData({
          title: data.title || '',
          page_type: data.page_type || 'notes',
          visibility: data.visibility || 'private',
          content: data.content || '',
          project_status: data.project_status || 'planning',
          project_start_date: data.project_start_date || '',
          project_end_date: data.project_end_date || '',
          external_link: data.external_link || ''
        })

        // Set selected tags
        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTags(data.tags)
        }

        // Set selected quests
        if (data.quests && Array.isArray(data.quests)) {
          setSelectedQuestIds(data.quests.map((q) => q.id))
        }

        logger.info('Page data loaded successfully')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching page', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fetch all available quests
   */
  const fetchQuests = async () => {
    try {
      const { data, error: fetchError } = await getAllQuests()

      if (fetchError) {
        logger.error('Error fetching quests', fetchError)
      } else {
        setAvailableQuests(data || [])
        logger.info(`Loaded ${data?.length || 0} quests for linking`)
      }
    } catch (err) {
      logger.error('Unexpected error fetching quests', err)
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
   * Handle quest selection toggle
   * @param {string} questId - Quest ID
   */
  const handleQuestToggle = (questId) => {
    setSelectedQuestIds((prev) => {
      if (prev.includes(questId)) {
        return prev.filter((id) => id !== questId)
      } else {
        return [...prev, questId]
      }
    })
  }

  /**
   * Validate form data
   * @returns {boolean} - True if valid
   */
  const validateForm = () => {
    const errors = {}

    // Title is required
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters'
    }

    // Content can be empty but has max length
    if (formData.content && formData.content.length > 100000) {
      errors.content = 'Content is too long (max 100,000 characters)'
    }

    // Project date validation
    if (formData.page_type === 'project') {
      if (formData.project_start_date && formData.project_end_date) {
        const start = new Date(formData.project_start_date)
        const end = new Date(formData.project_end_date)
        if (end < start) {
          errors.project_end_date = 'End date must be after start date'
        }
      }
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

      // Prepare page data
      const pageData = {
        title: formData.title.trim(),
        page_type: formData.page_type,
        visibility: formData.visibility,
        content: formData.content
      }

      // Add project-specific fields if project type
      if (formData.page_type === 'project') {
        pageData.project_status = formData.project_status
        pageData.project_start_date = formData.project_start_date || null
        pageData.project_end_date = formData.project_end_date || null
        pageData.external_link = formData.external_link || null
      }

      // Add tag IDs
      const tagIds = selectedTags.map((t) => t.id)

      let result

      if (isEditing) {
        // Update existing page
        logger.info(`Updating page: ${id}`)
        result = await updatePage(id, pageData, tagIds, selectedQuestIds)
      } else {
        // Create new page
        logger.info('Creating new page')
        result = await createPage(pageData, tagIds, selectedQuestIds)
      }

      if (result.error) {
        setError(result.error)
        logger.error(`Error ${isEditing ? 'updating' : 'creating'} page`, result.error)
      } else {
        logger.info(`Page ${isEditing ? 'updated' : 'created'} successfully`)

        // Navigate to pages list
        navigate('/admin/pages')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error saving page', err)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    navigate('/admin/pages')
  }

  // ========================================
  // RENDER
  // ========================================

  // Show loading state
  if (isLoading) {
    return (
      <div className="page-form-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading page data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-form-container">
      {/* Header */}
      <div className="page-form-header">
        <Icon name={isEditing ? 'edit-pencil' : 'plus'} size={48} />
        <div>
          <h1>{isEditing ? 'Edit Page' : 'Create New Page'}</h1>
          <p className="form-subtitle">
            {isEditing ? 'Modify your page content and settings' : 'Add a new page to your portfolio'}
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
      <form onSubmit={handleSubmit} className="page-form">
        {/* Basic Info Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="parchment" size={24} />
            Basic Information
          </h2>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter page title..."
              className={`form-input ${validationErrors.title ? 'error' : ''}`}
              maxLength={200}
            />
            {validationErrors.title && (
              <span className="error-message">{validationErrors.title}</span>
            )}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Page Type */}
          <div className="form-group">
            <label className="form-label">Page Type</label>
            <div className="type-selector">
              {PAGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-option ${formData.page_type === type.value ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'page_type', value: type.value } })}
                >
                  <Icon name={type.icon} size={32} />
                  <span className="type-label">{type.label}</span>
                  <span className="type-description">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div className="visibility-selector">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`visibility-option ${formData.visibility === option.value ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'visibility', value: option.value } })}
                >
                  <Icon name={option.icon} size={24} />
                  <span className="visibility-label">{option.label}</span>
                  <span className="visibility-description">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="writing" size={24} />
            Content
          </h2>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Page Content
              <span className="label-hint">(Markdown supported)</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your content here... (Markdown is supported)"
              className={`form-textarea ${validationErrors.content ? 'error' : ''}`}
              rows={15}
            />
            {validationErrors.content && (
              <span className="error-message">{validationErrors.content}</span>
            )}
            <span className="char-count">{formData.content.length} characters</span>
          </div>
        </div>

        {/* Project-Specific Fields */}
        {formData.page_type === 'project' && (
          <div className="form-section">
            <h2 className="section-title">
              <Icon name="castle" size={24} />
              Project Details
            </h2>

            <div className="form-row">
              {/* Project Status */}
              <div className="form-group">
                <label htmlFor="project_status" className="form-label">
                  Project Status
                </label>
                <select
                  id="project_status"
                  name="project_status"
                  value={formData.project_status}
                  onChange={handleChange}
                  className="form-select"
                >
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label htmlFor="project_start_date" className="form-label">
                  Start Date
                </label>
                <input
                  type="date"
                  id="project_start_date"
                  name="project_start_date"
                  value={formData.project_start_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* End Date */}
              <div className="form-group">
                <label htmlFor="project_end_date" className="form-label">
                  End Date
                </label>
                <input
                  type="date"
                  id="project_end_date"
                  name="project_end_date"
                  value={formData.project_end_date}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.project_end_date ? 'error' : ''}`}
                />
                {validationErrors.project_end_date && (
                  <span className="error-message">{validationErrors.project_end_date}</span>
                )}
              </div>
            </div>

            {/* External Link */}
            <div className="form-group">
              <label htmlFor="external_link" className="form-label">
                External Link
                <span className="label-hint">(Live project URL)</span>
              </label>
              <input
                type="url"
                id="external_link"
                name="external_link"
                value={formData.external_link}
                onChange={handleChange}
                className="form-input"
                placeholder="https://your-project.com"
              />
            </div>
          </div>
        )}

        {/* Tags Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="gem" size={24} />
            Tags
          </h2>

          <div className="form-group">
            <label className="form-label">
              Add Tags
              <span className="label-hint">(Search or create new tags)</span>
            </label>
            <TagSelector selectedTags={selectedTags} onTagsChange={handleTagsChange} />
          </div>
        </div>

        {/* Quest Linking Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="quests" size={24} />
            Linked Quests
          </h2>

          <div className="form-group">
            <label className="form-label">
              Link to Quests
              <span className="label-hint">(Optional)</span>
            </label>

            {availableQuests.length === 0 ? (
              <div className="no-quests-message">
                <Icon name="quests" size={32} />
                <p>No quests available. Create quests first to link them to pages.</p>
              </div>
            ) : (
              <div className="quest-selector">
                {availableQuests.map((quest) => (
                  <label key={quest.id} className="quest-option">
                    <input
                      type="checkbox"
                      checked={selectedQuestIds.includes(quest.id)}
                      onChange={() => handleQuestToggle(quest.id)}
                    />
                    <span className="quest-checkbox">
                      <Icon name="checkmark" size={14} />
                    </span>
                    <span className="quest-title">{quest.title}</span>
                    <span className="quest-status">{quest.status}</span>
                  </label>
                ))}
              </div>
            )}
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
                <span>{isEditing ? 'Update Page' : 'Create Page'}</span>
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

export default PageForm
