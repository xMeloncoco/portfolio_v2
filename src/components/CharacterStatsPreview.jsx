/**
 * ========================================
 * CHARACTER STATS PREVIEW COMPONENT
 * ========================================
 * Compact D&D-style character stats for Home page
 *
 * FEATURES:
 * - Profile photo with level badge
 * - Name and title
 * - Core attributes in compact form
 * - Link to full character page
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  calculateCharacterStats,
  calculateModifier,
  formatModifier
} from '../services/characterStatsService'
import { logger } from '../utils/logger'
import Icon from './Icon'
import './CharacterStatsPreview.css'

// ========================================
// CONSTANTS (hardcoded for now, will be editable later)
// ========================================

const CHARACTER_INFO = {
  name: 'Your Name',
  title: 'Software Tester / Vibe Coder',
  birthday: '1995-03-14',
  photoUrl: null
}

// ========================================
// CHARACTER STATS PREVIEW COMPONENT
// ========================================

function CharacterStatsPreview() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredStat, setHoveredStat] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await calculateCharacterStats()

      if (error) {
        logger.error('Error fetching stats', error)
      } else {
        setStats(data)
      }
    } catch (err) {
      logger.error('Error loading stats', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Calculate age from birthday
   */
  const calculateAge = () => {
    const birthday = new Date(CHARACTER_INFO.birthday)
    const today = new Date()
    let age = today.getFullYear() - birthday.getFullYear()
    const monthDiff = today.getMonth() - birthday.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--
    }
    return age
  }

  /**
   * Render single stat
   */
  const renderStat = (key) => {
    if (!stats || !stats[key]) return null
    const stat = stats[key]
    const modifier = calculateModifier(stat.score)

    return (
      <div
        className="stat-mini"
        onMouseEnter={() => setHoveredStat(key)}
        onMouseLeave={() => setHoveredStat(null)}
      >
        <span className="stat-mini-name">{stat.name.substring(0, 3).toUpperCase()}</span>
        <span className="stat-mini-score">{stat.score}</span>
        <span className="stat-mini-mod">{formatModifier(modifier)}</span>

        {hoveredStat === key && (
          <div className="stat-mini-tooltip">
            <strong>{stat.name}</strong>
            <p>{stat.description}: {stat.rawValue}</p>
            <p className="tooltip-detail">{stat.tooltip}</p>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="character-preview loading">
        <div className="loading-spinner"></div>
        <span>Loading character...</span>
      </div>
    )
  }

  const age = calculateAge()

  return (
    <div className="character-preview">
      <div className="character-preview-header">
        <div className="preview-portrait">
          {CHARACTER_INFO.photoUrl ? (
            <img src={CHARACTER_INFO.photoUrl} alt={CHARACTER_INFO.name} />
          ) : (
            <div className="preview-portrait-placeholder">
              <Icon name="character" size={60} />
            </div>
          )}
          <div className="preview-level">LVL {age}</div>
        </div>

        <div className="preview-info">
          <h3 className="preview-name">{CHARACTER_INFO.name}</h3>
          <p className="preview-title">{CHARACTER_INFO.title}</p>
          <Link to="/character" className="view-character-link">
            View Full Character Sheet
            <Icon name="chevron-right" size={16} />
          </Link>
        </div>
      </div>

      {stats && (
        <div className="stats-mini-grid">
          {renderStat('str')}
          {renderStat('int')}
          {renderStat('wis')}
          {renderStat('dex')}
          {renderStat('con')}
          {renderStat('cha')}
        </div>
      )}
    </div>
  )
}

export default CharacterStatsPreview
