/**
 * ========================================
 * PUBLIC HOME PAGE (REDESIGNED)
 * ========================================
 * Landing page integrating character sheet with portfolio
 *
 * SECTIONS:
 * - Hero/Top section (photo, name, level, progress)
 * - Class/Location/Current Quest cards
 * - Core Attributes (D&D stats)
 * - Languages, Frameworks, Tools
 * - Current Projects (latest 2)
 * - Quest Log (with sidequests)
 * - Inventory display
 * - Achievements display
 * - Contact section
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllPages } from '../../services/pagesService'
import { getAllQuests } from '../../services/questsService'
import {
  calculateCharacterStats,
  calculateModifier,
  formatModifier
} from '../../services/characterStatsService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import Tag from '../../components/Tag'
import InventoryDisplay from '../../components/InventoryDisplay'
import AchievementsDisplay from '../../components/AchievementsDisplay'
import './Home.css'

// ========================================
// CONSTANTS
// ========================================

// Character info (would come from admin settings in future)
const CHARACTER_INFO = {
  name: 'Miriam Schouten',
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
// HOME PAGE COMPONENT
// ========================================

function Home() {
  // ========================================
  // STATE
  // ========================================

  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [quests, setQuests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredStat, setHoveredStat] = useState(null)
  const [showContactPopup, setShowContactPopup] = useState(false)

  // ========================================
  // DATA FETCHING
  // ========================================

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setIsLoading(true)

      // Fetch stats, pages, and quests in parallel
      const [statsResult, pagesResult, questsResult] = await Promise.all([
        calculateCharacterStats(),
        getAllPages({ visibility: 'public' }),
        getAllQuests({ visibility: 'public' })
      ])

      // Set stats
      if (statsResult.error) {
        logger.error('Error fetching stats', statsResult.error)
      } else {
        setStats(statsResult.data)
      }

      // Set projects (sorted by updated_at, latest first)
      if (pagesResult.data) {
        const projectList = pagesResult.data
          .filter((p) => p.page_type === 'project')
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        setProjects(projectList)
      }

      // Set quests
      if (questsResult.data) {
        setQuests(questsResult.data)
      }

      logger.info('Home page content loaded')
    } catch (err) {
      logger.error('Error fetching home content', err)
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
    return {
      mainActive: quests.filter((q) => q.quest_type === 'main' && q.status === 'in_progress')
        .length,
      sideActive: quests.filter((q) => q.quest_type === 'side' && q.status === 'in_progress')
        .length,
      future: quests.filter((q) => q.quest_type === 'future').length,
      completed: quests.filter((q) => q.status === 'completed').length
    }
  }

  /**
   * Get main quests with subquests
   */
  const getMainQuests = () => {
    return quests
      .filter((q) => q.quest_type === 'main' && q.status === 'in_progress')
      .slice(0, 2)
  }

  /**
   * Get side quests
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
  // HELPER FUNCTIONS
  // ========================================

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
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
        key={statKey}
        className={`stat-block ${hoveredStat === statKey ? 'hovered' : ''}`}
        onMouseEnter={() => setHoveredStat(statKey)}
        onMouseLeave={() => setHoveredStat(null)}
        onClick={() => setHoveredStat(hoveredStat === statKey ? null : statKey)}
      >
        <div className="stat-name">{stat.name.substring(0, 3).toUpperCase()}</div>
        <div className="stat-score">{stat.score}</div>
        <div className="stat-modifier">{formattedMod}</div>

        {/* Mobile/Tablet: Click to show tooltip */}
        {hoveredStat === statKey && (
          <div className="stat-tooltip">
            <strong>{stat.name}</strong>
            <p className="stat-description-full">{stat.description}</p>
            <p>{stat.tooltip}</p>
            <p className="stat-details">{stat.details}</p>
            {stat.inverseScoring && <p className="inverse-note">Lower value = Higher score</p>}
          </div>
        )}
      </div>
    )
  }

  // ========================================
  // RENDER
  // ========================================

  const age = calculateAge()
  const birthdayProgress = calculateBirthdayProgress()
  const questCounts = getQuestCounts()

  return (
    <div className="home-page">
      {/* ========================================
       * HERO/TOP SECTION
       * ======================================== */}
      <section className="hero-section character-hero">
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
       * CHARACTER INFO (Class/Location/Quest)
       * ======================================== */}
      <section className="info-section">
        <div className="info-card">
          <Icon name="crown" size={32} />
          <div>
            <span className="info-label">Class</span>
            <span className="info-value">{CHARACTER_INFO.class}</span>
          </div>
        </div>
        <div className="info-card">
          <Icon name="map" size={32} />
          <div>
            <span className="info-label">Location</span>
            <span className="info-value">{CHARACTER_INFO.location}</span>
          </div>
        </div>
        <div className="info-card">
          <Icon name="quests" size={32} />
          <div>
            <span className="info-label">Current Quest</span>
            <span className="info-value">{CHARACTER_INFO.currentQuest}</span>
          </div>
        </div>
      </section>

      {/* ========================================
       * CORE ATTRIBUTES
       * ======================================== */}
      <section className="section attributes-section">
        <h2 className="section-title">
          <Icon name="stats" size={32} />
          Core Attributes
        </h2>

        {isLoading ? (
          <div className="loading-placeholder">
            <div className="loading-spinner"></div>
            <span>Loading stats...</span>
          </div>
        ) : stats ? (
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
      <section className="section skills-section">
        <div className="skills-column">
          <h3 className="skills-title">
            <Icon name="book" size={24} />
            Languages
          </h3>
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
          <h3 className="skills-title">
            <Icon name="code" size={24} />
            Frameworks
          </h3>
          <ul className="skills-list">
            {FRAMEWORKS.map((fw) => (
              <li key={fw.name} className="skill-item">
                <span className="skill-name">{fw.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="skills-column">
          <h3 className="skills-title">
            <Icon name="tools" size={24} />
            Tools
          </h3>
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
       * CURRENT PROJECTS (Latest 2)
       * ======================================== */}
      <section className="section current-projects">
        <div className="section-header">
          <Icon name="castle" size={36} />
          <h2>Current Projects</h2>
        </div>

        {isLoading ? (
          <div className="loading-placeholder">
            <div className="loading-spinner"></div>
            <span>Loading projects...</span>
          </div>
        ) : projects.length > 0 ? (
          <div className="projects-grid">
            {projects.slice(0, 2).map((project) => (
              <Link key={project.id} to={`/page/${project.id}`} className="project-card">
                <div className="project-icon">
                  <Icon name="castle" size={48} />
                </div>
                <h3>{project.title}</h3>
                <div className="project-hover-description">
                  <p>{truncateText(project.content, 200)}</p>
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div className="project-tags">
                    {project.tags.slice(0, 4).map((tag) => (
                      <Tag key={tag.id} name={tag.name} color={tag.color} size="small" />
                    ))}
                  </div>
                )}
                <div className="project-stats">
                  <span className="project-date">
                    <Icon name="time" size={14} />
                    Updated {formatDate(project.updated_at)}
                  </span>
                  {project.external_link && (
                    <span className="project-link-indicator">
                      <Icon name="link" size={14} />
                      Live
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-section">
            <Icon name="castle" size={48} />
            <p>No projects available yet. Check back soon!</p>
          </div>
        )}

        {projects.length > 2 && (
          <div className="section-footer">
            <Link to="/projects" className="view-all-link">
              <span>Show More Projects</span>
              <Icon name="chevron-right" size={20} />
            </Link>
          </div>
        )}
      </section>

      {/* ========================================
       * QUEST LOG
       * ======================================== */}
      <section className="section quests-section">
        <div className="section-header">
          <Icon name="quests" size={36} />
          <h2>Quest Log</h2>
          <Link to="/quests" className="show-all-link-header">
            Show All Quests
            <Icon name="chevron-right" size={16} />
          </Link>
        </div>

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

        {/* Main Quests with Subquests */}
        {getMainQuests().length > 0 && (
          <div className="quest-category">
            <h3 className="quest-category-title">
              <Icon name="crown" size={24} />
              Main Quests
            </h3>
            <div className="quests-list-detailed">
              {getMainQuests().map((quest) => {
                const completed = quest.sub_quests?.filter((sq) => sq.is_completed).length || 0
                const total = quest.sub_quests?.length || 0
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

                return (
                  <div key={quest.id} className="quest-card-detailed">
                    <div className="quest-header-public">
                      <div className="quest-icon-public">
                        <Icon name="crown" size={32} />
                      </div>
                      <div className="quest-info-public">
                        <h4>{quest.title}</h4>
                        {quest.description && (
                          <p className="quest-description">
                            {truncateText(quest.description, 100)}
                          </p>
                        )}
                        <div className="quest-progress-public">
                          <div className="progress-bar-small">
                            <div
                              className="progress-fill-small"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span>
                            {percentage}% Complete ({completed}/{total})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Subquests */}
                    {quest.sub_quests && quest.sub_quests.length > 0 && (
                      <div className="subquests-list">
                        <h5 className="subquests-title">Objectives:</h5>
                        <ul className="subquests-items">
                          {quest.sub_quests.slice(0, 5).map((subquest) => (
                            <li
                              key={subquest.id}
                              className={`subquest-item ${subquest.is_completed ? 'completed' : ''}`}
                            >
                              <Icon
                                name={subquest.is_completed ? 'checkmark' : 'circle'}
                                size={16}
                              />
                              <span>{subquest.title}</span>
                            </li>
                          ))}
                          {quest.sub_quests.length > 5 && (
                            <li className="subquest-more">
                              +{quest.sub_quests.length - 5} more objectives
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
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
            <div className="quest-cards side-quests-grid">
              {getSideQuests().map((quest) => (
                <Link key={quest.id} to="/quests" className="quest-card side">
                  <h4>{quest.title}</h4>
                  {quest.description && <p>{truncateText(quest.description, 60)}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ========================================
       * INVENTORY
       * ======================================== */}
      <section className="section inventory-section">
        <InventoryDisplay limit={12} showHeader={true} />
      </section>

      {/* ========================================
       * ACHIEVEMENTS
       * ======================================== */}
      <section className="section achievements-section">
        <AchievementsDisplay limit={6} showHeader={true} />
      </section>

      {/* ========================================
       * CONTACT SECTION
       * ======================================== */}
      <section className="cta-section">
        <div className="cta-content">
          <Icon name="mail" size={48} />
          <h2>Ready to Start Your Quest?</h2>
          <p>
            Let&apos;s collaborate on your next project or discuss opportunities. I&apos;m always
            excited to embark on new adventures!
          </p>
          <button onClick={handleContactClick} className="cta-button">
            <Icon name="mail" size={24} />
            <span>Contact Me</span>
          </button>
        </div>
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

export default Home
