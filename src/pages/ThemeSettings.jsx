/**
 * ========================================
 * THEME SETTINGS PAGE (Admin)
 * ========================================
 * This page will allow switching between different themes
 */

import Icon from '../components/Icon'
import './PlaceholderPage.css'

function ThemeSettings() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name="theme" size={56} />
        <h1>Theme Settings</h1>
        <p className="placeholder-subtitle">Customize your portfolio appearance</p>
      </div>

      <div className="placeholder-content">
        <div className="info-box">
          <Icon name="hourglass" size={40} />
          <h2>Coming in a later phase</h2>
          <p>
            The Theme Settings will allow you to:
          </p>
          <ul className="feature-list">
            <li><Icon name="theme" size={24} /> Switch between different color themes</li>
            <li><Icon name="potted-plant" size={24} /> Preview themes before applying</li>
            <li><Icon name="leaf" size={24} /> Customize theme variables</li>
          </ul>
          <p>
            Currently available themes:
          </p>
          <ul className="feature-list">
            <li>Mystic Blue & Gold (Active)</li>
            <li>Dark Leather</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ThemeSettings
