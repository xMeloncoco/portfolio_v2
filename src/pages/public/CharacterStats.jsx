/**
 * ========================================
 * CHARACTER STATS PAGE
 * ========================================
 * D&D-style character sheet displaying developer profile
 *
 * SECTIONS:
 * - Hero section (photo, level, name, progress bar)
 * - Core Attributes (STR, INT, WIS, DEX, CON, CHA)
 * - Character Info (class, location, current quest)
 * - Specializations (skill boxes with tags)
 * - Languages, Frameworks, Tools
 * - Quests overview
 * - Inventory & Achievements
 * - Contact form
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  calculateCharacterStats,
  calculateModifier,
  formatModifier
} from '../../services/characterStatsService'
import { getAllQuests } from '../../services/questsService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import InventoryDisplay from '../../components/InventoryDisplay'
import AchievementsDisplay from '../../components/AchievementsDisplay'
import './CharacterStats.css'

// ========================================
// CONSTANTS
// ========================================

// Character info (would come from admin settings in future)
const CHARACTER_INFO = {
  name: 'Your Name',
  title: 'Software Tester / Vibe Coder',
  class: 'Software Tester / Vibe Coder',
  location: 'Ermelo, Netherlands',
  currentQuest: 'Finding my IT spark',
  birthday: '1995-03-14', // Format: YYYY-MM-DD
  linkedinUrl: 'https://linkedin.com/in/yourprofile',
  photoUrl: null // Will use placeholder if null
}

// Languages
const LANGUAGES = [
  { name: 'Dutch', level: 'Native' },
  { name: 'English', level: 'Fluent' },
  { name: 'Japanese', level: 'Intermediate' }
]

// Frameworks
const FRAMEWORKS = [
  { name: 'Node.js', tagId: null },
  { name: 'React', tagId: null }
]

// Tools
const TOOLS = [
  { name: 'Claude AI', tagId: null },
  { name: 'Mendix', tagId: null }
]

// ========================================
// CHARACTER STATS PAGE COMPONENT
// ========================================

function CharacterStats() {
  // ========================================
  // STATE
  // ========================================

  const [stats, setStats] = useState(null)
  const [quests, setQuests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showContactPopup, setShowContactPopup] = useState(false)
  const [hoveredStat, setHoveredStat] = useState(null)

  // ========================================
  // DATA FETCHING
  // ========================================

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch stats and quests in parallel
      const [statsResult, questsResult] = await Promise.all([
        calculateCharacterStats(),
        getAllQuests({ visibility: 'public' })
      ])

      if (statsResult.error) {
        logger.error('Error fetching stats', statsResult.error)
      } else {
        setStats(statsResult.data)
      }

      if (questsResult.error) {
        logger.error('Error fetching quests', questsResult.error)
      } else {
        setQuests(questsResult.data || [])
      }

      logger.info('Character stats page data loaded')
    } catch (err) {
      setError(err.message)
      logger.error('Error loading character stats', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // COMPUTED VALUES
  // ========================================

  /**
   * Calculate age (level) from birthday
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
   * Calculate progress to next birthday (level up)
   */
  const calculateBirthdayProgress = () => {
    const birthday = new Date(CHARACTER_INFO.birthday)
    const today = new Date()

    // Get this year's birthday
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())

    // Get next birthday
    let nextBirthday = thisYearBirthday
    if (today >= thisYearBirthday) {
      nextBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate())
    }

    // Get last birthday
    let lastBirthday = thisYearBirthday
    if (today < thisYearBirthday) {
      lastBirthday = new Date(today.getFullYear() - 1, birthday.getMonth(), birthday.getDate())
    }

    // Calculate progress
    const totalDays = (nextBirthday - lastBirthday) / (1000 * 60 * 60 * 24)
    const daysPassed = (today - lastBirthday) / (1000 * 60 * 60 * 24)
    const progress = Math.round((daysPassed / totalDays) * 100)

    return progress
  }

  /**
   * Get quest counts for overview
   */
  const getQuestCounts = () => {
    const publicQuests = quests.filter((q) => q.visibility === 'public')

    return {
      mainActive: publicQuests.filter(
        (q) => q.quest_type === 'main' && q.status === 'in_progress'
      ).length,
      sideActive: publicQuests.filter(
        (q) => q.quest_type === 'side' && q.status === 'in_progress'
      ).length,
      future: publicQuests.filter((q) => q.quest_type === 'future').length,
      completed: publicQuests.filter((q) => q.status === 'completed').length
    }
  }

  /**
   * Get main quests (2 most recent)
   */
  const getMainQuests = () => {
    return quests
      .filter((q) => q.quest_type === 'main' && q.status === 'in_progress')
      .slice(0, 2)
  }

  /**
   * Get side quests (4 most recent)
   */
  const getSideQuests = () => {
    return quests
      .filter((q) => q.quest_type === 'side' && q.status === 'in_progress')
      .slice(0, 4)
  }

  // ========================================
  // HANDLERS
  // ========================================

  const handleLinkedInClick = () => {
    window.open(CHARACTER_INFO.linkedinUrl, '_blank', 'noopener,noreferrer')
  }

  const handleContactClick = () => {
    setShowContactPopup(true)
  }

  const handleCloseContactPopup = () => {
    setShowContactPopup(false)
  }

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Render a single stat block
   */
  const renderStatBlock = (statKey) => {
    if (!stats || !stats[statKey]) return null

    const stat = stats[statKey]
    const modifier = calculateModifier(stat.score)
    const formattedMod = formatModifier(modifier)

    return (
      <div
        className={`stat-block ${hoveredStat === statKey ? 'hovered' : ''}`}
        onMouseEnter={() => setHoveredStat(statKey)}
        onMouseLeave={() => setHoveredStat(null)}
      >
        <div className="stat-name">{stat.name.substring(0, 3).toUpperCase()}</div>
        <div className="stat-score">{stat.score}</div>
        <div className="stat-modifier">{formattedMod}</div>
        <div className="stat-description">{stat.description}</div>
        <div className="stat-raw">({stat.rawValue})</div>

        {/* Tooltip */}
        {hoveredStat === statKey && (
          <div className="stat-tooltip">
            <strong>{stat.name}</strong>
            <p>{stat.tooltip}</p>
            <p className="stat-details">{stat.details}</p>
            {stat.inverseScoring && (
              <p className="inverse-note">Lower value = Higher score</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // ========================================
  // RENDER
  // ========================================

  if (isLoading) {
    return (
      <div className="character-stats-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading character stats...</p>
        </div>
      </div>
    )
  }

  const age = calculateAge()
  const birthdayProgress = calculateBirthdayProgress()
  const questCounts = getQuestCounts()

  return (
    <div className="character-stats-page">
      {/* ========================================
       * HERO SECTION
       * ======================================== */}
      <section className="hero-section">
        <div className="character-portrait">
          {CHARACTER_INFO.photoUrl ? (
            <img src={CHARACTER_INFO.photoUrl} alt={CHARACTER_INFO.name} />
          ) : (
            <div className="portrait-placeholder">
              <Icon name="character" size={100} />
            </div>
          )}
          <div className="level-badge">
            <span className="level-label">LVL</span>
            <span className="level-number">{age}</span>
          </div>
        </div>

        <div className="character-info">
          <h1 className="character-name">{CHARACTER_INFO.name}</h1>
          <p className="character-title">{CHARACTER_INFO.title}</p>

          <div className="xp-bar">
            <div className="xp-label">Progress to Level {age + 1}</div>
            <div className="xp-track">
              <div className="xp-fill" style={{ width: `${birthdayProgress}%` }}></div>
            </div>
            <div className="xp-percentage">{birthdayProgress}%</div>
          </div>

          <p className="character-description">
            A passionate developer on a quest to build amazing digital experiences. Always learning,
            always growing, always ready for the next adventure.
          </p>

          <div className="character-actions">
            <button className="action-button linkedin" onClick={handleLinkedInClick}>
              <Icon name="link" size={20} />
              <span>LinkedIn</span>
            </button>
            <button className="action-button contact" onClick={handleContactClick}>
              <Icon name="mail" size={20} />
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================
       * CHARACTER INFO
       * ======================================== */}
      <section className="info-section">
        <div className="info-card">
          <Icon name="crown" size={24} />
          <div>
            <span className="info-label">Class</span>
            <span className="info-value">{CHARACTER_INFO.class}</span>
          </div>
        </div>
        <div className="info-card">
          <Icon name="map" size={24} />
          <div>
            <span className="info-label">Location</span>
            <span className="info-value">{CHARACTER_INFO.location}</span>
          </div>
        </div>
        <div className="info-card">
          <Icon name="quests" size={24} />
          <div>
            <span className="info-label">Current Quest</span>
            <span className="info-value">{CHARACTER_INFO.currentQuest}</span>
          </div>
        </div>
      </section>

      {/* ========================================
       * CORE ATTRIBUTES
       * ======================================== */}
      <section className="attributes-section">
        <h2 className="section-title">
          <Icon name="stats" size={32} />
          Core Attributes
        </h2>

        {stats ? (
          <div className="stats-grid">
            {renderStatBlock('str')}
            {renderStatBlock('int')}
            {renderStatBlock('wis')}
            {renderStatBlock('dex')}
            {renderStatBlock('con')}
            {renderStatBlock('cha')}
          </div>
        ) : (
          <div className="stats-error">
            <p>Unable to calculate stats</p>
          </div>
        )}
      </section>

      {/* ========================================
       * LANGUAGES, FRAMEWORKS, TOOLS
       * ======================================== */}
      <section className="skills-section">
        <div className="skills-column">
          <h3 className="skills-title">Languages</h3>
          <ul className="skills-list">
            {LANGUAGES.map((lang) => (
              <li key={lang.name} className="skill-item">
                <span className="skill-name">{lang.name}</span>
                <span className="skill-level">{lang.level}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="skills-column">
          <h3 className="skills-title">Frameworks</h3>
          <ul className="skills-list">
            {FRAMEWORKS.map((fw) => (
              <li key={fw.name} className="skill-item">
                <span className="skill-name">{fw.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="skills-column">
          <h3 className="skills-title">Tools</h3>
          <ul className="skills-list">
            {TOOLS.map((tool) => (
              <li key={tool.name} className="skill-item">
                <span className="skill-name">{tool.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ========================================
       * QUESTS OVERVIEW
       * ======================================== */}
      <section className="quests-section">
        <h2 className="section-title">
          <Icon name="quests" size={32} />
          Quest Log
        </h2>

        {/* Quest Numbers Overview */}
        <div className="quest-stats">
          <div className="quest-stat">
            <span className="quest-stat-value">{questCounts.mainActive}</span>
            <span className="quest-stat-label">Main Active</span>
          </div>
          <div className="quest-stat">
            <span className="quest-stat-value">{questCounts.sideActive}</span>
            <span className="quest-stat-label">Side Active</span>
          </div>
          <div className="quest-stat">
            <span className="quest-stat-value">{questCounts.future}</span>
            <span className="quest-stat-label">Future</span>
          </div>
          <div className="quest-stat">
            <span className="quest-stat-value">{questCounts.completed}</span>
            <span className="quest-stat-label">Completed</span>
          </div>
        </div>

        <Link to="/quests" className="show-all-button">
          Show All Quests
          <Icon name="chevron-right" size={20} />
        </Link>

        {/* Main Quests */}
        {getMainQuests().length > 0 && (
          <div className="quest-category">
            <h3 className="quest-category-title">
              <Icon name="crown" size={24} />
              Main Quests
            </h3>
            <div className="quest-cards main-quests">
              {getMainQuests().map((quest) => (
                <Link key={quest.id} to="/quests" className="quest-card main">
                  <h4>{quest.title}</h4>
                  {quest.description && (
                    <p>{quest.description.substring(0, 100)}...</p>
                  )}
                  <span className="quest-status">{quest.status}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Side Quests */}
        {getSideQuests().length > 0 && (
          <div className="quest-category">
            <h3 className="quest-category-title">
              <Icon name="sword" size={24} />
              Side Quests
            </h3>
            <div className="quest-cards side-quests">
              {getSideQuests().map((quest) => (
                <Link key={quest.id} to="/quests" className="quest-card side">
                  <h4>{quest.title}</h4>
                  {quest.description && (
                    <p>{quest.description.substring(0, 60)}...</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ========================================
       * INVENTORY & ACHIEVEMENTS
       * ======================================== */}
      <section className="inventory-achievements-section">
        <InventoryDisplay limit={10} showHeader={true} />
      </section>

      <section className="inventory-achievements-section">
        <AchievementsDisplay limit={10} showHeader={true} />
      </section>

      {/* ========================================
       * CONTACT POPUP (Placeholder)
       * ======================================== */}
      {showContactPopup && (
        <div className="contact-popup-backdrop" onClick={handleCloseContactPopup}>
          <div className="contact-popup" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={handleCloseContactPopup}>
              <Icon name="cross" size={24} />
            </button>
            <Icon name="construction" size={48} />
            <h3>Coming Soon!</h3>
            <p>The contact form will be available in a later phase.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default CharacterStats
