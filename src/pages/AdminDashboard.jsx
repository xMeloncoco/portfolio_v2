/**
 * ========================================
 * ADMIN DASHBOARD PAGE
 * ========================================
 * Main landing page after admin login
 * This will show an overview of all sections
 */

import Icon from '../components/Icon'
import './PlaceholderPage.css'

function AdminDashboard() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name="home" size={48} />
        <h1>Admin Dashboard</h1>
        <p className="placeholder-subtitle">Welcome to the Admin Portal</p>
      </div>

      <div className="placeholder-content">
        <p>This is your admin dashboard home page.</p>
        <p>Use the navigation menu to access different sections:</p>

        <ul className="feature-list">
          <li><Icon name="adventure" size={20} /> <strong>Character Stats:</strong> Coming in Phase 8</li>
          <li><Icon name="logbook" size={20} /> <strong>Pages:</strong> Implementation begins Phase 2</li>
          <li><Icon name="adventure" size={20} /> <strong>Quests:</strong> Implementation begins Phase 3</li>
          <li><Icon name="treasure-chest" size={20} /> <strong>Inventory:</strong> Implementation begins Phase 4</li>
          <li><Icon name="skills" size={20} /> <strong>Skills:</strong> Coming in a later phase</li>
          <li><Icon name="theme" size={20} /> <strong>Theme:</strong> Coming in a later phase</li>
        </ul>

        <div className="status-badge">
          <Icon name="done" size={20} />
          Phase 1 Complete - Login & Navigation Working
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
