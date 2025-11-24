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
import { getAllProjects } from '../../services/projectsService'
import { getAllQuests } from '../../services/questsService'
import {
  calculateCharacterStats,
  calculateModifier,
  formatModifier
} from '../../services/characterStatsService'
import { getCharacterSettings } from '../../services/characterSettingsService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import Tag from '../../components/Tag'
import InventoryDisplay from '../../components/InventoryDisplay'
import AchievementsDisplay from '../../components/AchievementsDisplay'
import ContactForm from '../../components/ContactForm'
import './Home.css'

// ========================================
// DEFAULT FALLBACK DATA
// ========================================

// Default character info (used if database fetch fails)
const DEFAULT_CHARACTER_INFO = {
  display_name: 'Miriam Schouten',
  subtitle: 'Software Tester / Vibe Coder',
  class: 'Software Tester / Vibe Coder',
  location: 'Ermelo, Netherlands',
  current_quest: 'Finding my IT spark',
  birthday: '1995-03-14',
  linkedin_url: 'https://linkedin.com/in/yourprofile',
  profile_picture_url: null,
  languages: [],
  frameworks: [],
  tools: [],
  action_buttons: []
}

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
  const [characterSettings, setCharacterSettings] = useState(DEFAULT_CHARACTER_INFO)
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredStat, setHoveredStat] = useState(null)
  const [showContactPopup, setShowContactPopup] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // ========================================
  // DATA FETCHING
  // ========================================

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setIsLoading(true)

      // Fetch stats, projects, quests, and character settings in parallel
      const [statsResult, projectsResult, questsResult, settingsResult] = await Promise.all([
        calculateCharacterStats(),
        getAllProjects({ visibility: 'public', includePrivate: false }),
        getAllQuests({ visibility: 'public' }),
        getCharacterSettings()
      ])

      // Set stats
      if (statsResult.error) {
        logger.error('Error fetching stats', statsResult.error)
      } else {
        setStats(statsResult.data)
      }

      // Set projects (already sorted by updated_at DESC from service)
      if (projectsResult.data) {
        setProjects(projectsResult.data)
      }

      // Set quests
      if (questsResult.data) {
        setQuests(questsResult.data)
      }

      // Set character settings
      if (settingsResult.error) {
        logger.error('Error fetching character settings', settingsResult.error)
        // Keep using default fallback data
      } else if (settingsResult.data) {
        setCharacterSettings(settingsResult.data)
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
    const birthday = new Date(characterSettings.birthday)
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
    const birthday = new Date(characterSettings.birthday)
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
    window.open(characterSettings.linkedin_url, '_blank', 'noopener,noreferrer')
  }

  const handleContactClick = () => {
    setShowContactPopup(true)
    setShowSuccessMessage(false)
  }

  const handleCloseContactPopup = () => {
    setShowContactPopup(false)
  }

  const handleContactSuccess = () => {
    setShowSuccessMessage(true)
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 5000)
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
        <div className="stat-description">{stat.description}</div>

        {/* Hover/Click tooltip with detailed info */}
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
          {characterSettings.profile_picture_url ? (
            <img src={characterSettings.profile_picture_url} alt={characterSettings.display_name} />
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
          <h1 className="character-name">{characterSettings.display_name}</h1>
          <p className="character-title">{characterSettings.subtitle}</p>

          <div className="xp-bar">
            <div className="xp-label">Progress to Level {age + 1}</div>
            <div className="xp-track">
              <div className="xp-fill" style={{ width: `${birthdayProgress}%` }}></div>
            </div>
            <div className="xp-percentage">{birthdayProgress}%</div>
          </div>

          {characterSettings.description && (
            <p className="character-description">
              {characterSettings.description}
            </p>
          )}

          <div className="character-actions">
            <button className="action-button linkedin" onClick={handleLinkedInClick}>
              <Icon name="link" size={20} />
              <span>LinkedIn</span>
            </button>
            <button className="action-button contact" onClick={handleContactClick}>
              <Icon name="mail" size={20} />
              <span>Send Message</span>
            </button>
            {characterSettings.action_buttons && characterSettings.action_buttons.map((button, index) => (
              <button
                key={index}
                className="action-button custom"
                onClick={() => window.open(button.url, '_blank', 'noopener,noreferrer')}
              >
                <Icon name={button.icon || 'star'} size={20} />
                <span>{button.label}</span>
              </button>
            ))}
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
            <span className="info-value">{characterSettings.class}</span>
          </div>
        </div>
        <div className="info-card">
          <Icon name="map" size={32} />
          <div>
            <span className="info-label">Location</span>
            <span className="info-value">{characterSettings.location}</span>
          </div>
        </div>
        <div className="info-card">
          <Icon name="quests" size={32} />
          <div>
            <span className="info-label">Current Quest</span>
            <span className="info-value">{characterSettings.current_quest}</span>
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
            {characterSettings.languages && characterSettings.languages.length > 0 ? (
              characterSettings.languages.map((lang, index) => (
                <li key={index} className="skill-item">
                  <span className="skill-name">{lang}</span>
                </li>
              ))
            ) : (
              <li className="skill-item empty">
                <span className="skill-name">No languages added</span>
              </li>
            )}
          </ul>
        </div>

        <div className="skills-column">
          <h3 className="skills-title">
            <Icon name="code" size={24} />
            Frameworks
          </h3>
          <ul className="skills-list">
            {characterSettings.frameworks && characterSettings.frameworks.length > 0 ? (
              characterSettings.frameworks.map((fw, index) => (
                <li key={index} className="skill-item">
                  <span className="skill-name">{fw}</span>
                </li>
              ))
            ) : (
              <li className="skill-item empty">
                <span className="skill-name">No frameworks added</span>
              </li>
            )}
          </ul>
        </div>

        <div className="skills-column">
          <h3 className="skills-title">
            <Icon name="tools" size={24} />
            Tools
          </h3>
          <ul className="skills-list">
            {characterSettings.tools && characterSettings.tools.length > 0 ? (
              characterSettings.tools.map((tool, index) => (
                <li key={index} className="skill-item">
                  <span className="skill-name">{tool}</span>
                </li>
              ))
            ) : (
              <li className="skill-item empty">
                <span className="skill-name">No tools added</span>
              </li>
            )}
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
          <Link to="/projects" className="show-all-link-header">
            Show All Projects
          </Link>
        </div>

        {isLoading ? (
          <div className="loading-placeholder">
            <div className="loading-spinner"></div>
            <span>Loading projects...</span>
          </div>
        ) : projects.length > 0 ? (
          <div className="projects-grid">
            {projects.slice(0, 2).map((project) => (
              <Link key={project.id} to={`/project/${project.slug}`} className="project-card">
                <div className="project-icon">
                  <Icon name="castle" size={48} />
                </div>
                <h3>{project.title}</h3>
                <div className="project-hover-description">
                  <p>{truncateText(project.description || '', 200)}</p>
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

        {/* Main Quests (without subquests display) */}
        {getMainQuests().length > 0 && (
          <div className="quest-category">
            <h3 className="quest-category-title">
              <Icon name="crown" size={24} />
              Main Quests
            </h3>
            <div className="quest-cards main-quests-grid">
              {getMainQuests().map((quest) => {
                const completed = quest.sub_quests?.filter((sq) => sq.is_completed).length || 0
                const total = quest.sub_quests?.length || 0
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

                return (
                  <Link key={quest.id} to={`/quests/${quest.id}`} className="quest-card main">
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
                        {percentage}% ({completed}/{total})
                      </span>
                    </div>
                  </Link>
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
                <Link key={quest.id} to={`/quests/${quest.id}`} className="quest-card side">
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
       * SUCCESS MESSAGE
       * ======================================== */}
      {showSuccessMessage && (
        <div className="success-toast">
          <Icon name="done" size={24} />
          <p>Message sent successfully! I&apos;ll get back to you soon.</p>
        </div>
      )}

      {/* ========================================
       * CONTACT FORM
       * ======================================== */}
      <ContactForm
        isOpen={showContactPopup}
        onClose={handleCloseContactPopup}
        onSuccess={handleContactSuccess}
      />
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default Home
