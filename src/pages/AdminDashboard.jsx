/**
 * ========================================
 * ADMIN DASHBOARD PAGE
 * ========================================
 * Main landing page after admin login
 * This will show an overview of all sections
 */

import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { getCharacterSettings, setConstructionMode, setConstructionWhitelist } from '../services/characterSettingsService'
import { logger } from '../utils/logger'
import './PlaceholderPage.css'
import './AdminDashboard.css'

function AdminDashboard() {
  const [constructionMode, setConstructionModeState] = useState(false)
  const [whitelist, setWhitelistState] = useState([])
  const [newPath, setNewPath] = useState('')
  const [toggling, setToggling] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await getCharacterSettings()
      setConstructionModeState(data?.construction_mode === true)
      setWhitelistState(data?.construction_whitelist || [])
      setLoading(false)
    }
    fetchSettings()
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

  const handleAddPath = async () => {
    const path = newPath.trim()
    if (!path) return
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    if (whitelist.includes(normalizedPath)) {
      setNewPath('')
      return
    }
    const updated = [...whitelist, normalizedPath]
    const { error } = await setConstructionWhitelist(updated)
    if (!error) {
      setWhitelistState(updated)
      setNewPath('')
    } else {
      logger.error('Failed to add whitelisted path', error)
    }
  }

  const handleRemovePath = async (pathToRemove) => {
    const updated = whitelist.filter(p => p !== pathToRemove)
    const { error } = await setConstructionWhitelist(updated)
    if (!error) {
      setWhitelistState(updated)
    } else {
      logger.error('Failed to remove whitelisted path', error)
    }
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

        {/* Whitelisted Pages */}
        {constructionMode && (
          <div className="construction-whitelist">
            <h4>Whitelisted Pages</h4>
            <p className="whitelist-description">
              These pages stay accessible to visitors even during construction mode.
            </p>
            <div className="whitelist-add">
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPath()}
                placeholder="/application1"
                className="whitelist-input"
              />
              <button className="whitelist-add-button" onClick={handleAddPath} disabled={!newPath.trim()}>
                <Icon name="plus" size={18} />
                Add
              </button>
            </div>
            {whitelist.length > 0 && (
              <ul className="whitelist-list">
                {whitelist.map((path) => (
                  <li key={path} className="whitelist-item">
                    <span className="whitelist-path">{path}</span>
                    <button
                      className="whitelist-remove-button"
                      onClick={() => handleRemovePath(path)}
                      title={`Remove ${path}`}
                    >
                      <Icon name="cross" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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
