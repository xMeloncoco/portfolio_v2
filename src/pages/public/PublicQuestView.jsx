/**
 * ========================================
 * PUBLIC QUEST VIEW (Detail)
 * ========================================
 * Public view of quest details with sub-quests, pages, and devlogs
 *
 * FEATURES:
 * - Display quest title and type
 * - Show RPG-style status
 * - Progress bar for sub-quests
 * - Read-only sub-quest list
 * - Tags display
 * - Linked pages
 * - Devlog entries
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getQuestById,
  STATUS_DISPLAY_NAMES
} from '../../services/questsService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import Tag from '../../components/Tag'
import './PublicQuestView.css'

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
// PUBLIC QUEST VIEW COMPONENT
// ========================================

function PublicQuestView() {
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
        // Only show public quests
        if (data.visibility === 'private') {
          setError('This quest is private')
          logger.warn(`Quest is private: ${id}`)
        } else {
          setQuest(data)
          logger.info('Quest data loaded successfully')
        }
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
    navigate('/quests')
  }

  /**
   * Navigate to page view
   * @param {string} pageId - Page UUID
   */
  const handlePageClick = (pageId) => {
    navigate(`/page/${pageId}`)
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
      <div className="public-quest-view-container">
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
      <div className="public-quest-view-container">
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
      <div className="public-quest-view-container">
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
    <div className="public-quest-view-container">
      {/* Header */}
      <div className="public-quest-view-header">
        <button className="back-button-small" onClick={handleBackToList} title="Back to quests list">
          <Icon name="back-arrow" size={24} />
        </button>

        <div className="quest-type-badge-large" style={{ backgroundColor: typeConfig.color }}>
          <Icon name={typeConfig.icon} size={32} />
          <span>{typeConfig.label}</span>
        </div>

        <h1 className="quest-title">{quest.title}</h1>
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

      {/* Sub-quests (Read-only) */}
      <div className="quest-subquests-section">
        <h3>
          <Icon name="done" size={24} />
          Quest Objectives
        </h3>

        {quest.sub_quests && quest.sub_quests.length > 0 ? (
          <div className="subquests-list">
            {quest.sub_quests.map((subQuest) => (
              <div key={subQuest.id} className="subquest-item-readonly">
                <span className={`checkbox-display ${subQuest.is_completed ? 'completed' : ''}`}>
                  {subQuest.is_completed && '✓'}
                </span>
                <span className={`subquest-title ${subQuest.is_completed ? 'completed' : ''}`}>
                  {subQuest.title}
                </span>
              </div>
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
            Related Pages
          </h3>
          <div className="pages-list">
            {quest.pages.map((page) => (
              <div
                key={page.id}
                className="page-item"
                onClick={() => handlePageClick(page.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handlePageClick(page.id)}
              >
                <Icon name="parchment" size={20} />
                <span className="page-title">{page.title}</span>
                <Icon name="chevron-right" size={16} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default PublicQuestView
