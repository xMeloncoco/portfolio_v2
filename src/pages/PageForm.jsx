/**
 * ========================================
 * PAGE FORM (Create/Edit)
 * ========================================
 * Complete form for creating or editing pages
 *
 * FEATURES:
 * - Title input with validation
 * - Page type selector (Blog, Notes)
 * - Visibility toggle (Public/Private)
 * - Content editor (textarea with markdown support)
 * - Tag selector with create capability
 * - Quest and project linking (optional)
 * - Form validation
 * - Auto-save indicator
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPageById, createPage, updatePage } from '../services/pagesService'
import { getAllQuests } from '../services/questsService'
import { getAllProjects } from '../services/projectsService'
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
  { value: 'notes', label: 'Notes', icon: 'parchment', description: 'Quick notes and references' }
]

/**
 * Visibility options
 */
const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: 'lock', description: 'Only visible in admin' },
  { value: 'public', label: 'Public', icon: 'web', description: 'Visible to everyone' }
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
    content: ''
  })

  // Tags, quests, and projects
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedQuestIds, setSelectedQuestIds] = useState([])
  const [selectedProjectIds, setSelectedProjectIds] = useState([])
  const [availableQuests, setAvailableQuests] = useState([])
  const [availableProjects, setAvailableProjects] = useState([])

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
   * Fetch available quests and projects for linking
   */
  useEffect(() => {
    fetchQuests()
    fetchProjects()
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
          content: data.content || ''
        })

        // Set selected tags
        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTags(data.tags)
        }

        // Set selected quests
        if (data.quests && Array.isArray(data.quests)) {
          setSelectedQuestIds(data.quests.map((q) => q.id))
        }

        // Set selected projects
        if (data.projects && Array.isArray(data.projects)) {
          setSelectedProjectIds(data.projects.map((p) => p.id))
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

  /**
   * Fetch all available projects
   */
  const fetchProjects = async () => {
    try {
      const { data, error: fetchError } = await getAllProjects()

      if (fetchError) {
        logger.error('Error fetching projects', fetchError)
      } else {
        setAvailableProjects(data || [])
        logger.info(`Loaded ${data?.length || 0} projects for linking`)
      }
    } catch (err) {
      logger.error('Unexpected error fetching projects', err)
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
   * Handle project selection toggle
   * @param {string} projectId - Project ID
   */
  const handleProjectToggle = (projectId) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId)
      } else {
        return [...prev, projectId]
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

      // Add tag IDs, quest IDs, and project IDs
      const tagIds = selectedTags.map((t) => t.id)

      // Prepare page data with connections
      pageData.tagIds = tagIds
      pageData.questIds = selectedQuestIds
      pageData.projectIds = selectedProjectIds

      let result

      if (isEditing) {
        // Update existing page
        logger.info(`Updating page: ${id}`)
        result = await updatePage(id, pageData)
      } else {
        // Create new page
        logger.info('Creating new page')
        result = await createPage(pageData)
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

        {/* Quest Linking Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="quests" size={24} />
            Linked Quests
            <span className="label-hint">(Optional - Select quests related to this page)</span>
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
                    <span className="quest-checkbox"></span>
                    <span className="quest-title">{quest.title}</span>
                    <span className="quest-status">{quest.status}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Linking Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="castle" size={24} />
            Linked Projects
            <span className="label-hint">(Optional - Select projects related to this page)</span>
          </h2>

          <div className="form-group">
            {availableProjects.length === 0 ? (
              <div className="no-quests-message">
                <Icon name="castle" size={32} />
                <p>No projects available. Create projects first to link them to pages.</p>
              </div>
            ) : (
              <div className="quest-selector">
                {availableProjects.map((project) => (
                  <label key={project.id} className="quest-option">
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => handleProjectToggle(project.id)}
                    />
                    <span className="quest-checkbox"></span>
                    <span className="quest-title">{project.title}</span>
                    <span className="quest-status">{project.status}</span>
                  </label>
                ))}
              </div>
            )}
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
