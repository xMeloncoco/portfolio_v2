/**
 * ========================================
 * DEVLOG FORM (Create/Edit)
 * ========================================
 * Complete form for creating or editing devlogs
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getDevlogById,
  createDevlog,
  updateDevlog
} from '../services/devlogsService'
import { getAllProjects } from '../services/projectsService'
import { getAllQuests } from '../services/questsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import TagSelector from '../components/TagSelector'
import './DevlogForm.css'

// ========================================
// CONSTANTS
// ========================================

/**
 * Visibility options
 */
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' }
]

// ========================================
// DEVLOG FORM COMPONENT
// ========================================

function DevlogForm() {
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
    content: '',
    project_id: null,
    session_date: new Date().toISOString().split('T')[0],
    visibility: 'private'
  })

  // Tags
  const [selectedTags, setSelectedTags] = useState([])

  // Projects and Quests
  const [availableProjects, setAvailableProjects] = useState([])
  const [availableQuests, setAvailableQuests] = useState([])
  const [selectedQuests, setSelectedQuests] = useState([])

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch devlog data if editing
   */
  useEffect(() => {
    if (isEditing) {
      fetchDevlogData()
    }
  }, [id])

  /**
   * Fetch projects and quests
   */
  useEffect(() => {
    fetchProjects()
    fetchQuests()
  }, [])

  /**
   * Load devlog data for editing
   */
  const fetchDevlogData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info(`Fetching devlog data for ID: ${id}`)

      const { data, error: fetchError } = await getDevlogById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching devlog', fetchError)
      } else if (data) {
        // Populate form with existing data
        setFormData({
          title: data.title || '',
          content: data.content || '',
          project_id: data.project_id || null,
          session_date: data.session_date || new Date().toISOString().split('T')[0],
          visibility: data.visibility || 'private'
        })

        // Set selected tags
        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTags(data.tags)
        }

        // Set selected quests
        if (data.quests && Array.isArray(data.quests)) {
          setSelectedQuests(data.quests.map(q => q.id))
        }

        logger.info('Devlog data loaded successfully')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching devlog', err)
    } finally {
      setIsLoading(false)
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
      [name]: value === '' && name === 'project_id' ? null : value
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
   * Handle quest selection
   * @param {Event} e - Change event
   */
  const handleQuestSelection = (e) => {
    const options = e.target.options
    const selected = []
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value)
      }
    }
    setSelectedQuests(selected)
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

    // Content has max length
    if (formData.content && formData.content.length > 50000) {
      errors.content = 'Content is too long (max 50,000 characters)'
    }

    // Session date is required
    if (!formData.session_date) {
      errors.session_date = 'Session date is required'
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

      // Prepare devlog data
      const devlogData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        session_date: formData.session_date,
        visibility: formData.visibility,
        project_id: formData.project_id || null
      }

      // Add tag IDs
      const tagIds = selectedTags.map((t) => t.id)

      // Add quest IDs
      const questIds = selectedQuests

      let result

      if (isEditing) {
        // Update existing devlog
        logger.info(`Updating devlog: ${id}`)
        result = await updateDevlog(id, devlogData, tagIds, questIds)
      } else {
        // Create new devlog
        logger.info('Creating new devlog')
        result = await createDevlog(devlogData, tagIds, questIds)
      }

      if (result.error) {
        setError(result.error)
        logger.error(`Error ${isEditing ? 'updating' : 'creating'} devlog`, result.error)
        return
      }

      logger.info(`Devlog ${isEditing ? 'updated' : 'created'} successfully`)

      // Navigate to devlogs list
      navigate('/admin/devlogs')
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error saving devlog', err)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    navigate('/admin/devlogs')
  }

  // ========================================
  // RENDER
  // ========================================

  // Show loading state
  if (isLoading) {
    return (
      <div className="devlog-form-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading devlog data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="devlog-form-container">
      {/* Header */}
      <div className="devlog-form-header">
        <Icon name={isEditing ? 'edit-pencil' : 'plus'} size={48} />
        <div>
          <h1>{isEditing ? 'Edit Devlog' : 'Create New Devlog'}</h1>
          <p className="form-subtitle">
            {isEditing ? 'Modify your devlog entry' : 'Document your development session'}
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
      <form onSubmit={handleSubmit} className="devlog-form">
        {/* Basic Info Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="logbook" size={24} />
            Devlog Details
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
              placeholder="Enter devlog title..."
              className={`form-input ${validationErrors.title ? 'error' : ''}`}
              maxLength={200}
            />
            {validationErrors.title && (
              <span className="error-message">{validationErrors.title}</span>
            )}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Session Date and Visibility */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="session_date" className="form-label">
                Session Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="session_date"
                name="session_date"
                value={formData.session_date}
                onChange={handleChange}
                className={`form-input ${validationErrors.session_date ? 'error' : ''}`}
              />
              {validationErrors.session_date && (
                <span className="error-message">{validationErrors.session_date}</span>
              )}
            </div>

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
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Content
              <span className="label-hint">(Markdown supported)</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Document your development progress, challenges, and solutions..."
              className={`form-textarea ${validationErrors.content ? 'error' : ''}`}
              rows={12}
              maxLength={50000}
            />
            {validationErrors.content && (
              <span className="error-message">{validationErrors.content}</span>
            )}
            <span className="char-count">{formData.content.length}/50,000</span>
          </div>
        </div>

        {/* Linking Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="link" size={24} />
            Link to Project & Quests
          </h2>

          {/* Project Link */}
          <div className="form-group">
            <label htmlFor="project_id" className="form-label">
              Link to Project
              <span className="label-hint">(Optional)</span>
            </label>
            <select
              id="project_id"
              name="project_id"
              value={formData.project_id || ''}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">No Project</option>
              {availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quest Links */}
          <div className="form-group">
            <label htmlFor="quests" className="form-label">
              Link to Quests
              <span className="label-hint">(Optional - hold Ctrl/Cmd to select multiple)</span>
            </label>
            <select
              id="quests"
              multiple
              value={selectedQuests}
              onChange={handleQuestSelection}
              className="form-select-multiple"
              size={Math.min(availableQuests.length, 8)}
            >
              {availableQuests.map((quest) => (
                <option key={quest.id} value={quest.id}>
                  {quest.title}
                </option>
              ))}
            </select>
            {selectedQuests.length > 0 && (
              <span className="field-hint">
                {selectedQuests.length} quest{selectedQuests.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="tags" size={24} />
            Tags
          </h2>
          <TagSelector
            selectedTags={selectedTags}
            onChange={handleTagsChange}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="loading-spinner-small"></div>
                <span>{isEditing ? 'Saving...' : 'Creating...'}</span>
              </>
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Create Devlog'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DevlogForm
