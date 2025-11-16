/**
 * ========================================
 * INVENTORY & ACHIEVEMENTS PAGE (Admin)
 * ========================================
 * This page will manage inventory items and achievements
 * Both are stored in the same database but displayed differently
 */

import Icon from '../components/Icon'
import './PlaceholderPage.css'

function Inventory() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name="treasure-chest" size={48} />
        <h1>Inventory & Achievements</h1>
        <p className="placeholder-subtitle">Manage completed projects and earned achievements</p>
      </div>

      <div className="placeholder-content">
        <div className="info-box">
          <Icon name="hourglass" size={32} />
          <h2>Implementation begins Phase 4</h2>
          <p>
            The Inventory & Achievements manager will allow you to:
          </p>
          <ul className="feature-list">
            <li><Icon name="backpack" size={20} /> <strong>Inventory Items:</strong> Completed projects and tools</li>
            <li><Icon name="trophy" size={20} /> <strong>Achievements:</strong> Certifications and milestones</li>
            <li><Icon name="goal" size={20} /> Drag-and-drop ordering for display</li>
            <li><Icon name="inspect-code" size={20} /> Custom icons and popup content</li>
            <li><Icon name="link" size={20} /> Tags and visibility settings</li>
          </ul>
          <p>
            Display up to 10 items per section on the frontend, with a "Show All" option.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Inventory
