/**
 * ========================================
 * ISSUE FORM (Create/Edit)
 * ========================================
 * Complete form for creating or editing issues
 *
 * FEATURES:
 * - Title input with validation
 * - Issue type selector (Bug/Improvement)
 * - Status selector
 * - Severity selector (for bugs)
 * - Description textarea
 * - Attach to quest or project
 * - Form validation
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getIssueById,
  createIssue,
  updateIssue,
  getAllIssueStatuses,
  getAllIssueTypes,
  getAllSeverityLevels
} from '../services/issuesService'
import { getAllQuests } from '../services/questsService'
import { getAllProjects } from '../services/projectsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import './IssueForm.css'

// ========================================
// CONSTANTS
// ========================================

/**
 * Issue type options
 */
const ISSUE_TYPES = [
  { value: 'bug', label: 'Bug', icon: 'bug', description: 'Something is broken or not working' },
  { value: 'improvement', label: 'Improvement', icon: 'upgrade', description: 'Enhancement to existing functionality' }
]

// ========================================
// ISSUE FORM COMPONENT
// ========================================

function IssueForm() {
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
    issue_type: 'bug',
    status: 'open',
    severity: 'minor',
    description: '',
    attached_to_type: 'quest',
    attached_to_id: ''
  })

  // Available options
  const [availableQuests, setAvailableQuests] = useState([])
  const [availableProjects, setAvailableProjects] = useState([])
  const [issueStatuses] = useState(getAllIssueStatuses())
  const [severityLevels] = useState(getAllSeverityLevels())

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch issue data if editing
   */
  useEffect(() => {
    if (isEditing) {
      fetchIssueData()
    }
  }, [id])

  /**
   * Fetch available quests and projects for attachment
   */
  useEffect(() => {
    fetchQuests()
    fetchProjects()
  }, [])

  /**
   * Load issue data for editing
   */
  const fetchIssueData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info(`Fetching issue data for ID: ${id}`)

      const { data, error: fetchError } = await getIssueById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching issue', fetchError)
      } else if (data) {
        // Populate form with existing data
        setFormData({
          title: data.title || '',
          issue_type: data.issue_type || 'bug',
          status: data.status || 'open',
          severity: data.severity || 'minor',
          description: data.description || '',
          attached_to_type: data.attached_to_type || 'quest',
          attached_to_id: data.attached_to_id || ''
        })

        logger.info('Issue data loaded successfully')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching issue', err)
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
        logger.info(`Loaded ${data?.length || 0} quests for attachment`)
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
        logger.info(`Loaded ${data?.length || 0} projects for attachment`)
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
   * Handle issue type change
   * @param {string} type - Issue type
   */
  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      issue_type: type,
      // Clear severity if switching to improvement
      severity: type === 'improvement' ? '' : prev.severity || 'minor'
    }))
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

    // Attachment is required
    if (!formData.attached_to_id) {
      errors.attached_to_id = 'Please select a quest or project to attach the issue to'
    }

    // Severity required for bugs
    if (formData.issue_type === 'bug' && !formData.severity) {
      errors.severity = 'Severity is required for bugs'
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

      // Prepare issue data
      const issueData = {
        title: formData.title.trim(),
        issue_type: formData.issue_type,
        status: formData.status,
        description: formData.description.trim() || null,
        attached_to_type: formData.attached_to_type,
        attached_to_id: formData.attached_to_id
      }

      // Add severity only for bugs
      if (formData.issue_type === 'bug') {
        issueData.severity = formData.severity
      }

      let result

      if (isEditing) {
        // Update existing issue
        logger.info(`Updating issue: ${id}`)
        result = await updateIssue(id, issueData)
      } else {
        // Create new issue
        logger.info('Creating new issue')
        result = await createIssue(issueData)
      }

      if (result.error) {
        setError(result.error)
        logger.error(`Error ${isEditing ? 'updating' : 'creating'} issue`, result.error)
      } else {
        logger.info(`Issue ${isEditing ? 'updated' : 'created'} successfully`)

        // Navigate to issues list
        navigate('/admin/issues')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error saving issue', err)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    navigate('/admin/issues')
  }

  // ========================================
  // RENDER
  // ========================================

  // Show loading state
  if (isLoading) {
    return (
      <div className="issue-form-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading issue data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="issue-form-container">
      {/* Header */}
      <div className="issue-form-header">
        <Icon name={isEditing ? 'edit-pencil' : 'plus'} size={48} />
        <div>
          <h1>{isEditing ? 'Edit Issue' : 'Create New Issue'}</h1>
          <p className="form-subtitle">
            {isEditing ? 'Modify your issue details' : 'Track a bug or improvement'}
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
      <form onSubmit={handleSubmit} className="issue-form">
        {/* Basic Info Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="bug" size={24} />
            Issue Details
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
              placeholder="Enter issue title..."
              className={`form-input ${validationErrors.title ? 'error' : ''}`}
              maxLength={200}
            />
            {validationErrors.title && (
              <span className="error-message">{validationErrors.title}</span>
            )}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Issue Type */}
          <div className="form-group">
            <label className="form-label">Issue Type</label>
            <div className="type-selector">
              {ISSUE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-option ${formData.issue_type === type.value ? 'selected' : ''}`}
                  onClick={() => handleTypeChange(type.value)}
                >
                  <Icon name={type.icon} size={32} />
                  <span className="type-label">{type.label}</span>
                  <span className="type-description">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity (for bugs only) */}
          {formData.issue_type === 'bug' && (
            <div className="form-group">
              <label htmlFor="severity" className="form-label">
                Severity <span className="required">*</span>
              </label>
              <div className="severity-selector">
                {severityLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    className={`severity-option ${formData.severity === level.value ? 'selected' : ''}`}
                    style={{
                      '--severity-color': level.color,
                      borderColor: formData.severity === level.value ? level.color : undefined,
                      backgroundColor: formData.severity === level.value ? `${level.color}20` : undefined
                    }}
                    onClick={() => handleChange({ target: { name: 'severity', value: level.value } })}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
              {validationErrors.severity && (
                <span className="error-message">{validationErrors.severity}</span>
              )}
            </div>
          )}

          {/* Status */}
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
              {issueStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
              <span className="label-hint">(Optional details about the issue)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              className="form-textarea"
              rows={6}
            />
            <span className="char-count">{formData.description.length} characters</span>
          </div>
        </div>

        {/* Attachment Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="link" size={24} />
            Attach To
          </h2>

          {/* Attachment Type Selector */}
          <div className="form-group">
            <label className="form-label">
              Attach To Type <span className="required">*</span>
            </label>
            <div className="type-selector">
              <button
                type="button"
                className={`type-option ${formData.attached_to_type === 'quest' ? 'selected' : ''}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, attached_to_type: 'quest', attached_to_id: '' }))
                  setValidationErrors(prev => ({ ...prev, attached_to_id: undefined }))
                }}
              >
                <Icon name="quests" size={32} />
                <span className="type-label">Quest</span>
                <span className="type-description">Attach to a quest</span>
              </button>
              <button
                type="button"
                className={`type-option ${formData.attached_to_type === 'project' ? 'selected' : ''}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, attached_to_type: 'project', attached_to_id: '' }))
                  setValidationErrors(prev => ({ ...prev, attached_to_id: undefined }))
                }}
              >
                <Icon name="castle" size={32} />
                <span className="type-label">Project</span>
                <span className="type-description">Attach to a project</span>
              </button>
            </div>
          </div>

          {/* Quest/Project Selector */}
          <div className="form-group">
            <label htmlFor="attached_to_id" className="form-label">
              {formData.attached_to_type === 'quest' ? 'Quest' : 'Project'} <span className="required">*</span>
            </label>

            {formData.attached_to_type === 'quest' ? (
              availableQuests.length === 0 ? (
                <div className="no-quests-message">
                  <Icon name="quests" size={32} />
                  <p>No quests available. Create quests first to attach issues.</p>
                </div>
              ) : (
                <select
                  id="attached_to_id"
                  name="attached_to_id"
                  value={formData.attached_to_id}
                  onChange={handleChange}
                  className={`form-select ${validationErrors.attached_to_id ? 'error' : ''}`}
                >
                  <option value="">Select a quest...</option>
                  {availableQuests.map((quest) => (
                    <option key={quest.id} value={quest.id}>
                      {quest.title} ({quest.quest_type})
                    </option>
                  ))}
                </select>
              )
            ) : (
              availableProjects.length === 0 ? (
                <div className="no-quests-message">
                  <Icon name="castle" size={32} />
                  <p>No projects available. Create projects first to attach issues.</p>
                </div>
              ) : (
                <select
                  id="attached_to_id"
                  name="attached_to_id"
                  value={formData.attached_to_id}
                  onChange={handleChange}
                  className={`form-select ${validationErrors.attached_to_id ? 'error' : ''}`}
                >
                  <option value="">Select a project...</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              )
            )}
            {validationErrors.attached_to_id && (
              <span className="error-message">{validationErrors.attached_to_id}</span>
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
                <span>{isEditing ? 'Update Issue' : 'Create Issue'}</span>
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

export default IssueForm
