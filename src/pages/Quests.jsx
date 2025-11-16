/**
 * ========================================
 * QUESTS MANAGEMENT PAGE (Admin)
 * ========================================
 * List view for managing all quests with RPG-style status display
 *
 * FEATURES:
 * - List all quests with sorting by last updated
 * - Filter by quest type and status
 * - Create new quests
 * - Edit existing quests
 * - Delete quests with confirmation
 * - Click quest name to view details
 * - Shows progress via sub-quests
 * - RPG-style status names
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllQuests, deleteQuest, STATUS_DISPLAY_NAMES } from '../services/questsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import Tag from '../components/Tag'
import ConfirmModal from '../components/ConfirmModal'
import './Quests.css'

// ========================================
// QUEST CONFIGURATION
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
// QUESTS COMPONENT
// ========================================

function Quests() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Quests data
  const [quests, setQuests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtering
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [questToDelete, setQuestToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Navigation
  const navigate = useNavigate()

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch all quests from the database
   */
  const fetchQuests = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info('Fetching quests...')

      const options = {}
      if (filterType !== 'all') {
        options.questType = filterType
      }
      if (filterStatus !== 'all') {
        options.status = filterStatus
      }

      const { data, error: fetchError } = await getAllQuests(options)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching quests', fetchError)
      } else {
        setQuests(data)
        logger.info(`Loaded ${data.length} quests`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching quests', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch quests on mount and when filters change
  useEffect(() => {
    fetchQuests()
  }, [filterType, filterStatus])

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Navigate to create new quest
   */
  const handleCreateQuest = () => {
    navigate('/admin/quests/new')
  }

  /**
   * Navigate to edit quest
   * @param {string} questId - Quest UUID
   */
  const handleEditQuest = (questId) => {
    navigate(`/admin/quests/${questId}/edit`)
  }

  /**
   * Navigate to view quest details
   * @param {string} questId - Quest UUID
   */
  const handleViewQuest = (questId) => {
    navigate(`/admin/quests/${questId}`)
  }

  /**
   * Open delete confirmation modal
   * @param {Object} quest - Quest object
   */
  const handleDeleteClick = (quest) => {
    setQuestToDelete(quest)
    setShowDeleteModal(true)
  }

  /**
   * Confirm quest deletion
   */
  const handleConfirmDelete = async () => {
    if (!questToDelete) return

    try {
      setIsDeleting(true)
      logger.info(`Deleting quest: ${questToDelete.id}`)

      const { success, error: deleteError } = await deleteQuest(questToDelete.id)

      if (deleteError) {
        setError(deleteError)
        logger.error('Error deleting quest', deleteError)
      } else if (success) {
        logger.info(`Quest deleted successfully: ${questToDelete.id}`)
        // Refresh the list
        await fetchQuests()
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error deleting quest', err)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setQuestToDelete(null)
    }
  }

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setQuestToDelete(null)
  }

  /**
   * Handle type filter change
   * @param {string} type - Quest type to filter by
   */
  const handleTypeFilterChange = (type) => {
    setFilterType(type)
  }

  /**
   * Handle status filter change
   * @param {string} status - Quest status to filter by
   */
  const handleStatusFilterChange = (status) => {
    setFilterStatus(status)
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Format time ago for last updated
   * @param {string} dateString - ISO date string
   * @returns {string} - Time ago string
   */
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  /**
   * Calculate quest progress from sub-quests
   * @param {Array} subQuests - Sub-quest array
   * @returns {Object} - Progress data
   */
  const calculateProgress = (subQuests) => {
    if (!subQuests || subQuests.length === 0) {
      return { completed: 0, total: 0, percentage: 0 }
    }

    const completed = subQuests.filter((sq) => sq.is_completed).length
    const total = subQuests.length
    const percentage = Math.round((completed / total) * 100)

    return { completed, total, percentage }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="quests-container">
      {/* Page Header */}
      <div className="quests-header">
        <div className="quests-title-section">
          <Icon name="quests" size={48} />
          <div>
            <h1>Quests</h1>
            <p className="quests-subtitle">Track your adventures and projects</p>
          </div>
        </div>

        <button
          className="create-button"
          onClick={handleCreateQuest}
          title="Create new quest"
        >
          <Icon name="plus" size={24} />
          <span>New Quest</span>
        </button>
      </div>

      {/* Filters */}
      <div className="quests-filters">
        {/* Type Filter */}
        <div className="filter-group">
          <span className="filter-label">Type:</span>
          <div className="filter-buttons">
            <button
              className={`filter-button ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleTypeFilterChange('all')}
            >
              All
            </button>
            {Object.entries(QUEST_TYPES).map(([type, config]) => (
              <button
                key={type}
                className={`filter-button ${filterType === type ? 'active' : ''}`}
                onClick={() => handleTypeFilterChange(type)}
              >
                <Icon name={config.icon} size={18} />
                {config.label.replace(' Quest', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          <div className="filter-buttons">
            <button
              className={`filter-button ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('all')}
            >
              All
            </button>
            <button
              className={`filter-button ${filterStatus === 'in_progress' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('in_progress')}
            >
              Active
            </button>
            <button
              className={`filter-button ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="quests-count">
          {!isLoading && <span>{quests.length} quest{quests.length !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <Icon name="cross" size={24} />
          <span>{error}</span>
          <button onClick={fetchQuests} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading quests...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && quests.length === 0 && (
        <div className="empty-state">
          <Icon name="quests" size={64} />
          <h2>No quests yet</h2>
          <p>
            {filterType === 'all' && filterStatus === 'all'
              ? 'Start your first adventure by creating a quest!'
              : 'No quests match your current filters.'}
          </p>
          <button className="create-button" onClick={handleCreateQuest}>
            <Icon name="plus" size={24} />
            <span>Create Quest</span>
          </button>
        </div>
      )}

      {/* Quests List */}
      {!isLoading && !error && quests.length > 0 && (
        <div className="quests-list">
          {quests.map((quest) => {
            const typeConfig = QUEST_TYPES[quest.quest_type] || QUEST_TYPES.side
            const statusConfig = QUEST_STATUSES[quest.status] || QUEST_STATUSES.not_started
            const progress = calculateProgress(quest.sub_quests)

            return (
              <div key={quest.id} className="quest-item">
                {/* Quest Type Badge */}
                <div
                  className="quest-type-badge"
                  style={{ backgroundColor: typeConfig.color }}
                >
                  <Icon name={typeConfig.icon} size={24} />
                  <span>{typeConfig.label.replace(' Quest', '')}</span>
                </div>

                {/* Quest Info */}
                <div className="quest-info">
                  <h3
                    className="quest-title"
                    onClick={() => handleViewQuest(quest.id)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handleViewQuest(quest.id)}
                  >
                    {quest.title}
                  </h3>

                  <div className="quest-meta">
                    <span
                      className="quest-status-badge"
                      style={{ borderColor: statusConfig.color, color: statusConfig.color }}
                    >
                      {statusConfig.label}
                    </span>

                    <span className="quest-date">
                      <Icon name="time" size={16} />
                      {formatTimeAgo(quest.updated_at)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {progress.total > 0 && (
                    <div className="quest-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {progress.completed}/{progress.total} sub-quests ({progress.percentage}%)
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {quest.tags && quest.tags.length > 0 && (
                    <div className="quest-tags">
                      {quest.tags.slice(0, 3).map((tag) => (
                        <Tag
                          key={tag.id}
                          name={tag.name}
                          color={tag.color}
                          size="small"
                        />
                      ))}
                      {quest.tags.length > 3 && (
                        <span className="more-tags">+{quest.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="quest-actions">
                  <button
                    className="action-button edit"
                    onClick={() => handleEditQuest(quest.id)}
                    title="Edit quest"
                  >
                    <Icon name="edit-pencil" size={20} />
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => handleDeleteClick(quest)}
                    title="Delete quest"
                  >
                    <Icon name="trash-can" size={20} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Quest"
        message={`Are you sure you want to delete "${questToDelete?.title}"? This will also delete all sub-quests. This action cannot be undone.`}
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

export default Quests
