/**
 * ========================================
 * QUEST FORM (Create/Edit)
 * ========================================
 * Complete form for creating or editing quests with sub-quests
 *
 * FEATURES:
 * - Title input with validation
 * - Quest type selector (Main, Side, Future)
 * - Status selector with RPG names
 * - Description textarea
 * - Tag selector with create capability
 * - Sub-quest management (add, remove, reorder)
 * - Form validation
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getQuestById,
  createQuest,
  updateQuest,
  addSubQuest,
  updateSubQuest,
  deleteSubQuest,
  STATUS_DISPLAY_NAMES
} from '../services/questsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import TagSelector from '../components/TagSelector'
import './QuestForm.css'

// ========================================
// CONSTANTS
// ========================================

/**
 * Quest type options
 */
const QUEST_TYPES = [
  { value: 'main', label: 'Main Quest', icon: 'crown', description: 'Major projects and primary goals' },
  { value: 'side', label: 'Side Quest', icon: 'sword', description: 'Secondary tasks and features' },
  { value: 'future', label: 'Future Quest', icon: 'future', description: 'Planned future work' }
]

/**
 * Quest status options with RPG names
 */
const QUEST_STATUSES = [
  { value: 'not_started', label: STATUS_DISPLAY_NAMES.not_started },
  { value: 'in_progress', label: STATUS_DISPLAY_NAMES.in_progress },
  { value: 'debugging', label: STATUS_DISPLAY_NAMES.debugging },
  { value: 'on_hold', label: STATUS_DISPLAY_NAMES.on_hold },
  { value: 'completed', label: STATUS_DISPLAY_NAMES.completed },
  { value: 'abandoned', label: STATUS_DISPLAY_NAMES.abandoned }
]

// ========================================
// QUEST FORM COMPONENT
// ========================================

function QuestForm() {
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
    quest_type: 'side',
    status: 'not_started',
    description: ''
  })

  // Tags
  const [selectedTags, setSelectedTags] = useState([])

  // Sub-quests
  const [subQuests, setSubQuests] = useState([])
  const [newSubQuestTitle, setNewSubQuestTitle] = useState('')

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch quest data if editing
   */
  useEffect(() => {
    if (isEditing) {
      fetchQuestData()
    }
  }, [id])

  /**
   * Load quest data for editing
   */
  const fetchQuestData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info(`Fetching quest data for ID: ${id}`)

      const { data, error: fetchError } = await getQuestById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching quest', fetchError)
      } else if (data) {
        // Populate form with existing data
        setFormData({
          title: data.title || '',
          quest_type: data.quest_type || 'side',
          status: data.status || 'not_started',
          description: data.description || ''
        })

        // Set selected tags
        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTags(data.tags)
        }

        // Set sub-quests
        if (data.sub_quests && Array.isArray(data.sub_quests)) {
          setSubQuests(data.sub_quests)
        }

        logger.info('Quest data loaded successfully')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching quest', err)
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
   * Add a new sub-quest
   */
  const handleAddSubQuest = () => {
    if (!newSubQuestTitle.trim()) return

    const newSubQuest = {
      id: `temp-${Date.now()}`,
      title: newSubQuestTitle.trim(),
      is_completed: false,
      is_new: true
    }

    setSubQuests([...subQuests, newSubQuest])
    setNewSubQuestTitle('')
    logger.info(`Added sub-quest: ${newSubQuest.title}`)
  }

  /**
   * Toggle sub-quest completion
   * @param {string} subQuestId - Sub-quest ID
   */
  const handleToggleSubQuest = (subQuestId) => {
    setSubQuests(
      subQuests.map((sq) =>
        sq.id === subQuestId ? { ...sq, is_completed: !sq.is_completed } : sq
      )
    )
  }

  /**
   * Remove a sub-quest
   * @param {string} subQuestId - Sub-quest ID
   */
  const handleRemoveSubQuest = (subQuestId) => {
    setSubQuests(subQuests.filter((sq) => sq.id !== subQuestId))
    logger.info(`Removed sub-quest: ${subQuestId}`)
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

    // Description has max length
    if (formData.description && formData.description.length > 10000) {
      errors.description = 'Description is too long (max 10,000 characters)'
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

      // Prepare quest data
      const questData = {
        title: formData.title.trim(),
        quest_type: formData.quest_type,
        status: formData.status,
        description: formData.description
      }

      // Add tag IDs
      const tagIds = selectedTags.map((t) => t.id)

      let result
      let questId

      if (isEditing) {
        // Update existing quest
        logger.info(`Updating quest: ${id}`)
        result = await updateQuest(id, questData, tagIds)
        questId = id
      } else {
        // Create new quest
        logger.info('Creating new quest')
        result = await createQuest(questData, tagIds)
        questId = result.data?.id
      }

      if (result.error) {
        setError(result.error)
        logger.error(`Error ${isEditing ? 'updating' : 'creating'} quest`, result.error)
        return
      }

      // Handle sub-quests
      if (questId) {
        for (const subQuest of subQuests) {
          if (subQuest.is_new) {
            // Add new sub-quest
            await addSubQuest(questId, { title: subQuest.title })
          } else if (subQuest.is_deleted) {
            // Delete sub-quest
            await deleteSubQuest(subQuest.id)
          } else {
            // Update existing sub-quest
            await updateSubQuest(subQuest.id, {
              title: subQuest.title,
              is_completed: subQuest.is_completed
            })
          }
        }
      }

      logger.info(`Quest ${isEditing ? 'updated' : 'created'} successfully`)

      // Navigate to quests list
      navigate('/admin/quests')
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error saving quest', err)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    navigate('/admin/quests')
  }

  // ========================================
  // RENDER
  // ========================================

  // Show loading state
  if (isLoading) {
    return (
      <div className="quest-form-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading quest data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="quest-form-container">
      {/* Header */}
      <div className="quest-form-header">
        <Icon name={isEditing ? 'edit-pencil' : 'plus'} size={48} />
        <div>
          <h1>{isEditing ? 'Edit Quest' : 'Create New Quest'}</h1>
          <p className="form-subtitle">
            {isEditing ? 'Modify your quest details and sub-quests' : 'Start a new adventure'}
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
      <form onSubmit={handleSubmit} className="quest-form">
        {/* Basic Info Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="quests" size={24} />
            Quest Details
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
              placeholder="Enter quest title..."
              className={`form-input ${validationErrors.title ? 'error' : ''}`}
              maxLength={200}
            />
            {validationErrors.title && (
              <span className="error-message">{validationErrors.title}</span>
            )}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Quest Type */}
          <div className="form-group">
            <label className="form-label">Quest Type</label>
            <div className="type-selector">
              {QUEST_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-option ${formData.quest_type === type.value ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'quest_type', value: type.value } })}
                >
                  <Icon name={type.icon} size={32} />
                  <span className="type-label">{type.label}</span>
                  <span className="type-description">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

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
              {QUEST_STATUSES.map((status) => (
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
              <span className="label-hint">(Optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your quest objectives..."
              className={`form-textarea ${validationErrors.description ? 'error' : ''}`}
              rows={6}
            />
            {validationErrors.description && (
              <span className="error-message">{validationErrors.description}</span>
            )}
            <span className="char-count">{formData.description.length} characters</span>
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

        {/* Sub-quests Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="done" size={24} />
            Sub-quests
          </h2>

          <div className="form-group">
            <label className="form-label">
              Quest Objectives
              <span className="label-hint">(Add checkable items)</span>
            </label>

            {/* Add Sub-quest Input */}
            <div className="add-subquest-input">
              <input
                type="text"
                value={newSubQuestTitle}
                onChange={(e) => setNewSubQuestTitle(e.target.value)}
                placeholder="Add a sub-quest..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubQuest())}
              />
              <button
                type="button"
                className="add-subquest-button"
                onClick={handleAddSubQuest}
                disabled={!newSubQuestTitle.trim()}
              >
                <Icon name="plus" size={20} />
              </button>
            </div>

            {/* Sub-quests List */}
            {subQuests.length > 0 && (
              <div className="subquests-list">
                {subQuests.map((subQuest) => (
                  <div key={subQuest.id} className="subquest-item">
                    <label className="subquest-checkbox">
                      <input
                        type="checkbox"
                        checked={subQuest.is_completed}
                        onChange={() => handleToggleSubQuest(subQuest.id)}
                      />
                      <span className="checkbox-custom">
                        <Icon name="checkmark" size={14} />
                      </span>
                    </label>
                    <span
                      className={`subquest-title ${subQuest.is_completed ? 'completed' : ''}`}
                    >
                      {subQuest.title}
                    </span>
                    <button
                      type="button"
                      className="remove-subquest-button"
                      onClick={() => handleRemoveSubQuest(subQuest.id)}
                      title="Remove sub-quest"
                    >
                      <Icon name="cross" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {subQuests.length === 0 && (
              <div className="no-subquests">
                <Icon name="done" size={24} />
                <span>No sub-quests added yet</span>
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
                <span>{isEditing ? 'Update Quest' : 'Create Quest'}</span>
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

export default QuestForm
