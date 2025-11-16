/**
 * ========================================
 * ACHIEVEMENTS DISPLAY COMPONENT
 * ========================================
 * Displays achievements in a badge-style layout
 *
 * FEATURES:
 * - Badge-style display (different from inventory boxes)
 * - Limited to specified number of items
 * - "Show all" link when more items available
 * - Click on achievement to open popup modal
 * - Golden/trophy themed styling
 * - Responsive layout
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllInventoryItems } from '../services/inventoryService'
import { logger } from '../utils/logger'
import Icon from './Icon'
import Tag from './Tag'
import ItemPopupModal from './ItemPopupModal'
import './AchievementsDisplay.css'

// ========================================
// ACHIEVEMENTS DISPLAY COMPONENT
// ========================================

/**
 * AchievementsDisplay - Shows achievements in a badge layout
 * @param {Object} props - Component props
 * @param {number} [props.limit=10] - Maximum items to display
 * @param {boolean} [props.showHeader=true] - Show section header
 * @param {boolean} [props.showAll=false] - Show all items (ignore limit)
 */
function AchievementsDisplay({ limit = 10, showHeader = true, showAll = false }) {
  // ========================================
  // STATE
  // ========================================

  const [achievements, setAchievements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch achievements on mount
   */
  useEffect(() => {
    fetchAchievements()
  }, [])

  /**
   * Load achievements from database
   */
  const fetchAchievements = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await getAllInventoryItems({
        itemType: 'achievement',
        visibility: 'public'
      })

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching achievements', fetchError)
      } else {
        setAchievements(data || [])
        logger.info(`Fetched ${data?.length || 0} achievements`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching achievements', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Handle achievement click to open modal
   * @param {Object} achievement - The clicked achievement
   */
  const handleAchievementClick = (achievement) => {
    setSelectedItem(achievement)
    setIsModalOpen(true)
  }

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  // ========================================
  // COMPUTED VALUES
  // ========================================

  // Get achievements to display based on limit
  const displayAchievements = showAll ? achievements : achievements.slice(0, limit)
  const hasMore = !showAll && achievements.length > limit
  const remainingCount = achievements.length - limit

  // ========================================
  // RENDER
  // ========================================

  // Error state
  if (error) {
    return (
      <div className="achievements-display-container">
        {showHeader && (
          <div className="achievements-display-header">
            <div className="header-title">
              <Icon name="trophy" size={36} />
              <h2>Achievements</h2>
            </div>
          </div>
        )}
        <div className="achievements-error">
          <Icon name="cross" size={32} />
          <p>Failed to load achievements</p>
        </div>
      </div>
    )
  }

  return (
    <div className="achievements-display-container">
      {/* Header */}
      {showHeader && (
        <div className="achievements-display-header">
          <div className="header-title">
            <Icon name="trophy" size={36} />
            <h2>Achievements</h2>
          </div>
          {hasMore && (
            <Link to="/achievements" className="show-all-link">
              Show all ({achievements.length})
              <Icon name="chevron-right" size={16} />
            </Link>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="achievements-loading">
          <div className="loading-spinner"></div>
          <span>Loading achievements...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && achievements.length === 0 && (
        <div className="achievements-empty">
          <Icon name="trophy" size={48} />
          <p>No achievements unlocked yet</p>
        </div>
      )}

      {/* Achievements List */}
      {!isLoading && displayAchievements.length > 0 && (
        <div className="achievements-list">
          {displayAchievements.map((achievement) => (
            <button
              key={achievement.id}
              className="achievement-badge"
              onClick={() => handleAchievementClick(achievement)}
            >
              <div className="badge-icon">
                <Icon name={achievement.icon_name || 'trophy'} size={32} />
              </div>
              <div className="badge-info">
                <h4 className="badge-name">{achievement.item_name}</h4>
                <p className="badge-title">{achievement.title}</p>
                {achievement.tags && achievement.tags.length > 0 && (
                  <div className="badge-tags">
                    {achievement.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag.id} name={tag.name} color={tag.color} size="tiny" />
                    ))}
                    {achievement.tags.length > 2 && (
                      <span className="more-tags">+{achievement.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="badge-glow"></div>
            </button>
          ))}

          {/* Show more indicator */}
          {hasMore && (
            <Link to="/achievements" className="achievements-more-badge">
              <div className="more-icon">
                <Icon name="star" size={24} />
              </div>
              <div className="more-info">
                <span className="more-count">+{remainingCount} more</span>
                <span className="more-label">achievements</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Item Popup Modal */}
      <ItemPopupModal item={selectedItem} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default AchievementsDisplay
