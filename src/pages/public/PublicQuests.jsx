/**
 * ========================================
 * PUBLIC QUESTS PAGE
 * ========================================
 * Public view of quest progress and achievements
 *
 * FEATURES:
 * - Display quest progress
 * - RPG-style status
 * - Quest categories (Main/Side/Future)
 * - Sub-quest completion tracking
 */

import { useState, useEffect } from 'react'
import { getAllQuests, STATUS_DISPLAY_NAMES } from '../../services/questsService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import Tag from '../../components/Tag'
import './PublicQuests.css'

// ========================================
// QUEST CONFIGURATION
// ========================================

const QUEST_TYPES = {
  main: { label: 'Main Quest', icon: 'crown', color: '#f1c40f' },
  side: { label: 'Side Quest', icon: 'sword', color: '#3498db' },
  future: { label: 'Future Quest', icon: 'future', color: '#9b59b6' }
}

const QUEST_STATUS_CONFIG = {
  not_started: { label: STATUS_DISPLAY_NAMES.not_started, color: '#95a5a6' },
  in_progress: { label: STATUS_DISPLAY_NAMES.in_progress, color: '#3498db' },
  debugging: { label: STATUS_DISPLAY_NAMES.debugging, color: '#e74c3c' },
  on_hold: { label: STATUS_DISPLAY_NAMES.on_hold, color: '#f39c12' },
  completed: { label: STATUS_DISPLAY_NAMES.completed, color: '#2ecc71' },
  abandoned: { label: STATUS_DISPLAY_NAMES.abandoned, color: '#7f8c8d' }
}

// ========================================
// PUBLIC QUESTS COMPONENT
// ========================================

function PublicQuests() {
  // ========================================
  // STATE
  // ========================================

  const [quests, setQuests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch quests on mount
   */
  useEffect(() => {
    fetchQuests()
  }, [])

  /**
   * Load all quests
   */
  const fetchQuests = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await getAllQuests()

      if (error) {
        logger.error('Error fetching quests', error)
      } else if (data) {
        setQuests(data)
        logger.info(`Loaded ${data.length} quests`)
      }
    } catch (err) {
      logger.error('Unexpected error fetching quests', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Calculate quest progress
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

  /**
   * Filter quests by type
   * @returns {Array} - Filtered quests
   */
  const getFilteredQuests = () => {
    if (selectedType === 'all') return quests
    return quests.filter((q) => q.quest_type === selectedType)
  }

  /**
   * Get overall stats
   * @returns {Object} - Stats
   */
  const getStats = () => {
    const total = quests.length
    const completed = quests.filter((q) => q.status === 'completed').length
    const inProgress = quests.filter((q) => q.status === 'in_progress').length

    return { total, completed, inProgress }
  }

  const stats = getStats()
  const filteredQuests = getFilteredQuests()

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="public-quests-page">
      {/* Header */}
      <div className="quests-header-public">
        <div className="quests-title-public">
          <Icon name="quests" size={48} />
          <div>
            <h1>Quest Log</h1>
            <p>Track my ongoing adventures and completed journeys</p>
          </div>
        </div>

        {/* Stats */}
        <div className="quest-stats-public">
          <div className="stat-card">
            <Icon name="quests" size={32} />
            <div className="stat-info">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Quests</span>
            </div>
          </div>
          <div className="stat-card">
            <Icon name="adventure" size={32} />
            <div className="stat-info">
              <span className="stat-number">{stats.inProgress}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
          <div className="stat-card">
            <Icon name="done" size={32} />
            <div className="stat-info">
              <span className="stat-number">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="quest-type-filter">
        <button
          className={`type-btn ${selectedType === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedType('all')}
        >
          All Quests
        </button>
        {Object.entries(QUEST_TYPES).map(([type, config]) => (
          <button
            key={type}
            className={`type-btn ${selectedType === type ? 'active' : ''}`}
            onClick={() => setSelectedType(type)}
          >
            <Icon name={config.icon} size={20} />
            {config.label.replace(' Quest', '')}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading quest log...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredQuests.length === 0 && (
        <div className="empty-state">
          <Icon name="quests" size={64} />
          <h2>No quests found</h2>
          <p>The adventure hasn&apos;t started yet. Check back soon!</p>
        </div>
      )}

      {/* Quests List */}
      {!isLoading && filteredQuests.length > 0 && (
        <div className="quests-grid-public">
          {filteredQuests.map((quest) => {
            const typeConfig = QUEST_TYPES[quest.quest_type] || QUEST_TYPES.side
            const statusConfig = QUEST_STATUS_CONFIG[quest.status] || QUEST_STATUS_CONFIG.not_started
            const progress = calculateProgress(quest.sub_quests)

            return (
              <div key={quest.id} className="quest-card-public-full">
                <div className="quest-card-header-public">
                  <div
                    className="quest-type-icon"
                    style={{ backgroundColor: typeConfig.color }}
                  >
                    <Icon name={typeConfig.icon} size={28} />
                  </div>
                  <div
                    className="quest-status-public"
                    style={{ color: statusConfig.color, borderColor: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </div>
                </div>

                <h3>{quest.title}</h3>

                {quest.description && (
                  <p className="quest-description-public">
                    {quest.description.length > 200
                      ? quest.description.substring(0, 200) + '...'
                      : quest.description}
                  </p>
                )}

                {/* Progress */}
                {progress.total > 0 && (
                  <div className="quest-progress-public-full">
                    <div className="progress-label">
                      <span>Progress</span>
                      <span>{progress.percentage}%</span>
                    </div>
                    <div className="progress-bar-public">
                      <div
                        className="progress-fill-public"
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="progress-detail">
                      {progress.completed} / {progress.total} objectives
                    </div>
                  </div>
                )}

                {/* Tags */}
                {quest.tags && quest.tags.length > 0 && (
                  <div className="quest-tags-public-full">
                    {quest.tags.slice(0, 3).map((tag) => (
                      <Tag key={tag.id} name={tag.name} color={tag.color} size="small" />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default PublicQuests
