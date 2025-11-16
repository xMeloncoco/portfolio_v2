/**
 * ========================================
 * QUEST VIEW (Detail)
 * ========================================
 * View complete quest details with sub-quests and progress
 *
 * FEATURES:
 * - Display quest title and type
 * - Show RPG-style status
 * - Progress bar for sub-quests
 * - Interactive sub-quest checklist
 * - Tags display
 * - Linked pages
 * - Edit and delete actions
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getQuestById,
  deleteQuest,
  toggleSubQuestCompletion,
  STATUS_DISPLAY_NAMES
} from '../services/questsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import Tag from '../components/Tag'
import ConfirmModal from '../components/ConfirmModal'
import './QuestView.css'

// ========================================
// CONSTANTS
// ========================================

/**
 * Quest type display configuration
 */
const QUEST_TYPES = {
  main: { label: 'Main Quest', icon: 'crown', color: '#f1c40f' },
  side: { label: 'Side Quest', icon: 'sword', color: '#3498db' },
  future: { label: 'Future Quest', icon: 'future', color: '#9b59b6' }
}

/**
 * Quest status display configuration
 */
const QUEST_STATUSES = {
  not_started: { label: STATUS_DISPLAY_NAMES.not_started, color: '#95a5a6' },
  in_progress: { label: STATUS_DISPLAY_NAMES.in_progress, color: '#3498db' },
  debugging: { label: STATUS_DISPLAY_NAMES.debugging, color: '#e74c3c' },
  on_hold: { label: STATUS_DISPLAY_NAMES.on_hold, color: '#f39c12' },
  completed: { label: STATUS_DISPLAY_NAMES.completed, color: '#2ecc71' },
  abandoned: { label: STATUS_DISPLAY_NAMES.abandoned, color: '#7f8c8d' }
}

// ========================================
// QUEST VIEW COMPONENT
// ========================================

function QuestView() {
  // ========================================
  // ROUTING
  // ========================================

  const { id } = useParams()
  const navigate = useNavigate()

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  const [quest, setQuest] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch quest data on mount
   */
  useEffect(() => {
    fetchQuestData()
  }, [id])

  /**
   * Load quest data from database
   */
  const fetchQuestData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info(`Fetching quest details for ID: ${id}`)

      const { data, error: fetchError } = await getQuestById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching quest', fetchError)
      } else if (data) {
        setQuest(data)
        logger.info('Quest data loaded successfully')
      } else {
        setError('Quest not found')
        logger.warn(`Quest not found: ${id}`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching quest', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Navigate back to quests list
   */
  const handleBackToList = () => {
    navigate('/admin/quests')
  }

  /**
   * Navigate to edit quest
   */
  const handleEditQuest = () => {
    navigate(`/admin/quests/${id}/edit`)
  }

  /**
   * Open delete confirmation modal
   */
  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  /**
   * Confirm quest deletion
   */
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      logger.info(`Deleting quest: ${id}`)

      const { success, error: deleteError } = await deleteQuest(id)

      if (deleteError) {
        setError(deleteError)
        logger.error('Error deleting quest', deleteError)
      } else if (success) {
        logger.info('Quest deleted successfully')
        navigate('/admin/quests')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error deleting quest', err)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  /**
   * Toggle sub-quest completion
   * @param {string} subQuestId - Sub-quest ID
   */
  const handleToggleSubQuest = async (subQuestId) => {
    try {
      const { success, error: toggleError } = await toggleSubQuestCompletion(subQuestId)

      if (toggleError) {
        logger.error('Error toggling sub-quest', toggleError)
      } else if (success) {
        // Update local state
        setQuest((prev) => ({
          ...prev,
          sub_quests: prev.sub_quests.map((sq) =>
            sq.id === subQuestId ? { ...sq, is_completed: !sq.is_completed } : sq
          )
        }))
        logger.info(`Sub-quest toggled: ${subQuestId}`)
      }
    } catch (err) {
      logger.error('Unexpected error toggling sub-quest', err)
    }
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Format datetime for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted datetime
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Calculate quest progress from sub-quests
   * @returns {Object} - Progress data
   */
  const calculateProgress = () => {
    if (!quest || !quest.sub_quests || quest.sub_quests.length === 0) {
      return { completed: 0, total: 0, percentage: 0 }
    }

    const completed = quest.sub_quests.filter((sq) => sq.is_completed).length
    const total = quest.sub_quests.length
    const percentage = Math.round((completed / total) * 100)

    return { completed, total, percentage }
  }

  // ========================================
  // RENDER
  // ========================================

  // Loading state
  if (isLoading) {
    return (
      <div className="quest-view-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading quest details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="quest-view-container">
        <div className="error-state">
          <Icon name="cross" size={48} />
          <h2>Error Loading Quest</h2>
          <p>{error}</p>
          <button className="back-button" onClick={handleBackToList}>
            <Icon name="back-arrow" size={24} />
            <span>Back to Quests</span>
          </button>
        </div>
      </div>
    )
  }

  // No quest found
  if (!quest) {
    return (
      <div className="quest-view-container">
        <div className="error-state">
          <Icon name="quests" size={48} />
          <h2>Quest Not Found</h2>
          <p>The quest you&apos;re looking for doesn&apos;t exist.</p>
          <button className="back-button" onClick={handleBackToList}>
            <Icon name="back-arrow" size={24} />
            <span>Back to Quests</span>
          </button>
        </div>
      </div>
    )
  }

  const typeConfig = QUEST_TYPES[quest.quest_type] || QUEST_TYPES.side
  const statusConfig = QUEST_STATUSES[quest.status] || QUEST_STATUSES.not_started
  const progress = calculateProgress()

  return (
    <div className="quest-view-container">
      {/* Header */}
      <div className="quest-view-header">
        <button className="back-button-small" onClick={handleBackToList} title="Back to quests list">
          <Icon name="back-arrow" size={24} />
        </button>

        <div className="quest-type-badge-large" style={{ backgroundColor: typeConfig.color }}>
          <Icon name={typeConfig.icon} size={32} />
          <span>{typeConfig.label}</span>
        </div>

        <h1 className="quest-title">{quest.title}</h1>

        <div className="quest-actions">
          <button className="action-button edit" onClick={handleEditQuest} title="Edit quest">
            <Icon name="edit-pencil" size={24} />
            <span>Edit</span>
          </button>
          <button className="action-button delete" onClick={handleDeleteClick} title="Delete quest">
            <Icon name="trash-can" size={24} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Status and Meta Information */}
      <div className="quest-status-section">
        <div
          className="status-badge-large"
          style={{ borderColor: statusConfig.color, color: statusConfig.color }}
        >
          {statusConfig.label}
        </div>

        <div className="quest-meta-info">
          <div className="meta-item">
            <Icon name="time" size={20} />
            <span>Created: {formatDateTime(quest.created_at)}</span>
          </div>

          <div className="meta-item">
            <Icon name="edit-pencil" size={20} />
            <span>Updated: {formatDateTime(quest.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      {progress.total > 0 && (
        <div className="quest-progress-section">
          <h3>
            <Icon name="done" size={24} />
            Quest Progress
          </h3>
          <div className="progress-container">
            <div className="progress-bar-large">
              <div
                className="progress-fill"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="progress-stats">
              <span className="progress-percentage">{progress.percentage}%</span>
              <span className="progress-count">
                {progress.completed} of {progress.total} objectives completed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {quest.description && (
        <div className="quest-description-section">
          <h3>
            <Icon name="writing" size={24} />
            Description
          </h3>
          <div className="description-content">
            {quest.description}
          </div>
        </div>
      )}

      {/* Tags */}
      {quest.tags && quest.tags.length > 0 && (
        <div className="quest-tags-section">
          <h3>
            <Icon name="gem" size={24} />
            Tags
          </h3>
          <div className="tags-list">
            {quest.tags.map((tag) => (
              <Tag key={tag.id} name={tag.name} color={tag.color} size="normal" />
            ))}
          </div>
        </div>
      )}

      {/* Sub-quests */}
      <div className="quest-subquests-section">
        <h3>
          <Icon name="done" size={24} />
          Quest Objectives
        </h3>

        {quest.sub_quests && quest.sub_quests.length > 0 ? (
          <div className="subquests-checklist">
            {quest.sub_quests.map((subQuest) => (
              <label key={subQuest.id} className="subquest-item">
                <input
                  type="checkbox"
                  checked={subQuest.is_completed}
                  onChange={() => handleToggleSubQuest(subQuest.id)}
                />
                <span className="checkbox-custom">
                  <Icon name="checkmark" size={16} />
                </span>
                <span className={`subquest-title ${subQuest.is_completed ? 'completed' : ''}`}>
                  {subQuest.title}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="no-subquests">
            <Icon name="done" size={32} />
            <p>No objectives defined for this quest.</p>
          </div>
        )}
      </div>

      {/* Linked Pages */}
      {quest.pages && quest.pages.length > 0 && (
        <div className="quest-pages-section">
          <h3>
            <Icon name="parchment" size={24} />
            Linked Pages
          </h3>
          <div className="pages-list">
            {quest.pages.map((page) => (
              <div
                key={page.id}
                className="page-item"
                onClick={() => navigate(`/admin/pages/${page.id}`)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/admin/pages/${page.id}`)}
              >
                <Icon name="parchment" size={20} />
                <span className="page-title">{page.title}</span>
                <Icon name="chevron-right" size={16} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Quest"
        message={`Are you sure you want to delete "${quest.title}"? This will also delete all sub-quests. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default QuestView
