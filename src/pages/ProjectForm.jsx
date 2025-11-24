/**
 * ========================================
 * PROJECT FORM (Create/Edit)
 * ========================================
 * Complete form for creating or editing projects
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getProjectById,
  createProject,
  updateProject,
  getProjectQuests
} from '../services/projectsService'
import { getAllQuests, updateQuest } from '../services/questsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import TagSelector from '../components/TagSelector'
import './ProjectForm.css'

// ========================================
// CONSTANTS
// ========================================

/**
 * Project status options
 */
const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'archived', label: 'Archived' }
]

/**
 * Visibility options
 */
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' }
]

// ========================================
// PROJECT FORM COMPONENT
// ========================================

function ProjectForm() {
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
    description: '',
    slug: '',
    status: 'active',
    visibility: 'public',
    external_link: '',
    start_date: '',
    end_date: ''
  })

  // Tags
  const [selectedTags, setSelectedTags] = useState([])

  // Quests
  const [availableQuests, setAvailableQuests] = useState([])
  const [selectedQuests, setSelectedQuests] = useState([])
  const [initialQuestIds, setInitialQuestIds] = useState([]) // Track original quest links

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [slugEdited, setSlugEdited] = useState(false)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch project data if editing
   */
  useEffect(() => {
    if (isEditing) {
      fetchProjectData()
    }
  }, [id])

  /**
   * Fetch all available quests
   */
  useEffect(() => {
    fetchQuests()
  }, [])

  /**
   * Auto-generate slug from title
   */
  useEffect(() => {
    if (!slugEdited && formData.title) {
      const generatedSlug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.title, slugEdited])

  /**
   * Load project data for editing
   */
  const fetchProjectData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info(`Fetching project data for ID: ${id}`)

      const { data, error: fetchError } = await getProjectById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching project', fetchError)
      } else if (data) {
        // Populate form with existing data
        setFormData({
          title: data.title || '',
          description: data.description || '',
          slug: data.slug || '',
          status: data.status || 'active',
          visibility: data.visibility || 'public',
          external_link: data.external_link || '',
          start_date: data.start_date || '',
          end_date: data.end_date || ''
        })

        // Mark slug as edited since it's loaded from DB
        setSlugEdited(true)

        // Set selected tags
        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTags(data.tags)
        }

        // Fetch quests linked to this project
        const { data: quests, error: questError } = await getProjectQuests(id)
        if (!questError && quests) {
          const questIds = quests.map(q => q.id)
          setSelectedQuests(questIds)
          setInitialQuestIds(questIds) // Track for updates
          logger.info(`Loaded ${questIds.length} linked quests`)
        }

        logger.info('Project data loaded successfully')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching project', err)
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

    // Track if slug was manually edited
    if (name === 'slug') {
      setSlugEdited(true)
    }

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
   * Handle quest checkbox toggle
   * @param {string} questId - Quest ID to toggle
   */
  const handleQuestToggle = (questId) => {
    if (selectedQuests.includes(questId)) {
      setSelectedQuests(selectedQuests.filter(id => id !== questId))
    } else {
      setSelectedQuests([...selectedQuests, questId])
    }
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

    // Slug is required
    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    // Description has max length
    if (formData.description && formData.description.length > 10000) {
      errors.description = 'Description is too long (max 10,000 characters)'
    }

    // Validate external_link if provided
    if (formData.external_link && formData.external_link.trim()) {
      try {
        new URL(formData.external_link)
      } catch {
        errors.external_link = 'Please enter a valid URL (including http:// or https://)'
      }
    }

    // Validate dates
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        errors.end_date = 'End date must be after start date'
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

      // Prepare project data
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim(),
        status: formData.status,
        visibility: formData.visibility
      }

      // Add optional fields if provided
      if (formData.external_link && formData.external_link.trim()) {
        projectData.external_link = formData.external_link.trim()
      }
      if (formData.start_date) {
        projectData.start_date = formData.start_date
      }
      if (formData.end_date) {
        projectData.end_date = formData.end_date
      }

      // Add tag IDs
      const tagIds = selectedTags.map((t) => t.id)

      let result

      if (isEditing) {
        // Update existing project
        logger.info(`Updating project: ${id}`)
        result = await updateProject(id, projectData, tagIds)
      } else {
        // Create new project
        logger.info('Creating new project')
        result = await createProject(projectData, tagIds)
      }

      if (result.error) {
        setError(result.error)
        logger.error(`Error ${isEditing ? 'updating' : 'creating'} project`, result.error)
        return
      }

      const projectId = isEditing ? id : result.data?.id

      // Update quest links
      if (projectId) {
        // Determine which quests need to be linked/unlinked
        const questsToLink = selectedQuests.filter(qId => !initialQuestIds.includes(qId))
        const questsToUnlink = initialQuestIds.filter(qId => !selectedQuests.includes(qId))

        // Link new quests to this project
        for (const questId of questsToLink) {
          await updateQuest(questId, { project_id: projectId }, [])
          logger.info(`Linked quest ${questId} to project ${projectId}`)
        }

        // Unlink removed quests from this project
        for (const questId of questsToUnlink) {
          await updateQuest(questId, { project_id: null }, [])
          logger.info(`Unlinked quest ${questId} from project ${projectId}`)
        }

        logger.info(`Updated ${questsToLink.length} quest links, removed ${questsToUnlink.length}`)
      }

      logger.info(`Project ${isEditing ? 'updated' : 'created'} successfully`)

      // Navigate to projects list
      navigate('/admin/projects')
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error saving project', err)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    navigate('/admin/projects')
  }

  // ========================================
  // RENDER
  // ========================================

  // Show loading state
  if (isLoading) {
    return (
      <div className="project-form-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading project data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="project-form-container">
      {/* Header */}
      <div className="project-form-header">
        <Icon name={isEditing ? 'edit-pencil' : 'plus'} size={48} />
        <div>
          <h1>{isEditing ? 'Edit Project' : 'Create New Project'}</h1>
          <p className="form-subtitle">
            {isEditing ? 'Modify your project details' : 'Start a new project'}
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
      <form onSubmit={handleSubmit} className="project-form">
        {/* Basic Info Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="castle" size={24} />
            Project Details
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
              placeholder="Enter project title..."
              className={`form-input ${validationErrors.title ? 'error' : ''}`}
              maxLength={200}
            />
            {validationErrors.title && (
              <span className="error-message">{validationErrors.title}</span>
            )}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Slug */}
          <div className="form-group">
            <label htmlFor="slug" className="form-label">
              URL Slug <span className="required">*</span>
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="project-url-slug"
              className={`form-input ${validationErrors.slug ? 'error' : ''}`}
            />
            {validationErrors.slug && (
              <span className="error-message">{validationErrors.slug}</span>
            )}
            <span className="field-hint">
              Used in URLs (lowercase letters, numbers, and hyphens only)
            </span>
          </div>

          {/* Status and Visibility */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
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

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
              <span className="label-hint">(Optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your project..."
              className={`form-textarea ${validationErrors.description ? 'error' : ''}`}
              rows={6}
              maxLength={10000}
            />
            {validationErrors.description && (
              <span className="error-message">{validationErrors.description}</span>
            )}
            <span className="char-count">{formData.description.length}/10,000</span>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="link" size={24} />
            Additional Information
          </h2>

          {/* External Link */}
          <div className="form-group">
            <label htmlFor="external_link" className="form-label">
              External Link
              <span className="label-hint">(Optional)</span>
            </label>
            <input
              type="url"
              id="external_link"
              name="external_link"
              value={formData.external_link}
              onChange={handleChange}
              placeholder="https://example.com/project"
              className={`form-input ${validationErrors.external_link ? 'error' : ''}`}
            />
            {validationErrors.external_link && (
              <span className="error-message">{validationErrors.external_link}</span>
            )}
            <span className="field-hint">
              Link to GitHub repo, live demo, or project homepage
            </span>
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date" className="form-label">
                Start Date
                <span className="label-hint">(Optional)</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_date" className="form-label">
                End Date
                <span className="label-hint">(Optional)</span>
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`form-input ${validationErrors.end_date ? 'error' : ''}`}
              />
              {validationErrors.end_date && (
                <span className="error-message">{validationErrors.end_date}</span>
              )}
            </div>
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
            onTagsChange={handleTagsChange}
          />
        </div>

        {/* Quests Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="quests" size={24} />
            Link Quests to this Project
          </h2>
          <div className="form-group">
            <label className="form-label">
              Select Quests
              <span className="label-hint">(Optional)</span>
            </label>
            <div className="checkbox-list">
              {availableQuests.length === 0 ? (
                <p className="empty-message">No quests available</p>
              ) : (
                availableQuests.map((quest) => (
                  <label key={quest.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedQuests.includes(quest.id)}
                      onChange={() => handleQuestToggle(quest.id)}
                    />
                    <span className="checkbox-label">{quest.title}</span>
                  </label>
                ))
              )}
            </div>
            {selectedQuests.length > 0 && (
              <span className="field-hint">
                {selectedQuests.length} quest{selectedQuests.length !== 1 ? 's' : ''} will be linked to this project
              </span>
            )}
          </div>
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
              <span>{isEditing ? 'Save Changes' : 'Create Project'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectForm
