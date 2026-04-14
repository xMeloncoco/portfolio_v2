/**
 * ========================================
 * ADMIN DASHBOARD PAGE
 * ========================================
 * Main landing page after admin login
 * This will show an overview of all sections
 */

import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { getConstructionMode, setConstructionMode } from '../services/characterSettingsService'
import { logger } from '../utils/logger'
import './PlaceholderPage.css'
import './AdminDashboard.css'

function AdminDashboard() {
  const [constructionMode, setConstructionModeState] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMode = async () => {
      const enabled = await getConstructionMode()
      setConstructionModeState(enabled)
      setLoading(false)
    }
    fetchMode()
  }, [])

  const handleToggle = async () => {
    setToggling(true)
    const newValue = !constructionMode
    const { error } = await setConstructionMode(newValue)
    if (error) {
      logger.error('Failed to toggle construction mode', error)
    } else {
      setConstructionModeState(newValue)
      logger.info(`Construction mode ${newValue ? 'enabled' : 'disabled'}`)
    }
    setToggling(false)
  }

  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name="home" size={56} />
        <h1>Admin Dashboard</h1>
        <p className="placeholder-subtitle">Welcome to the Admin Portal</p>
      </div>

      <div className="placeholder-content">
        {/* Construction Mode Toggle */}
        <div className={`construction-toggle-card ${constructionMode ? 'active' : ''}`}>
          <div className="construction-toggle-info">
            <Icon name="tools" size={32} />
            <div>
              <h3>Construction Mode</h3>
              <p>
                {constructionMode
                  ? 'Site is hidden from public visitors. Only you can browse it.'
                  : 'Site is live and visible to everyone.'}
              </p>
            </div>
          </div>
          <button
            className={`construction-toggle-button ${constructionMode ? 'on' : 'off'}`}
            onClick={handleToggle}
            disabled={loading || toggling}
          >
            <span className="toggle-track">
              <span className="toggle-knob" />
            </span>
            <span className="toggle-label">
              {toggling ? 'Saving...' : constructionMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        <p>Use the navigation menu to access different sections:</p>

        <ul className="feature-list">
          <li><Icon name="adventure" size={24} /> <strong>Character Stats:</strong> Coming in Phase 8</li>
          <li><Icon name="logbook" size={24} /> <strong>Pages:</strong> Implementation begins Phase 2</li>
          <li><Icon name="adventure" size={24} /> <strong>Quests:</strong> Implementation begins Phase 3</li>
          <li><Icon name="treasure-chest" size={24} /> <strong>Inventory:</strong> Implementation begins Phase 4</li>
          <li><Icon name="skills" size={24} /> <strong>Skills:</strong> Coming in a later phase</li>
          <li><Icon name="theme" size={24} /> <strong>Theme:</strong> Coming in a later phase</li>
        </ul>

        <div className="status-badge">
          <Icon name="done" size={24} />
          Phase 1 Complete - Login & Navigation Working
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
