/**
 * ========================================
 * CHARACTER STATS PAGE (Admin)
 * ========================================
 * This page will allow editing the character stats
 * shown on the frontend
 */

import Icon from '../components/Icon'
import './PlaceholderPage.css'

function CharacterStats() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name="default-user" size={48} />
        <h1>Character Stats</h1>
        <p className="placeholder-subtitle">Edit your portfolio character information</p>
      </div>

      <div className="placeholder-content">
        <div className="info-box">
          <Icon name="hourglass" size={32} />
          <h2>Coming in Phase 8</h2>
          <p>
            The Character Stats editor will allow you to customize:
          </p>
          <ul className="feature-list">
            <li>Profile picture</li>
            <li>Name and subtitle</li>
            <li>Description</li>
            <li>Core attributes (based on real data)</li>
            <li>Level and progress bar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CharacterStats
