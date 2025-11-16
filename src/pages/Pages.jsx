/**
 * ========================================
 * PAGES MANAGEMENT PAGE (Admin)
 * ========================================
 * This page will show a list of all pages (blogs, devlogs, notes, projects)
 * and allow creating, editing, and deleting them
 */

import Icon from '../components/Icon'
import './PlaceholderPage.css'

function Pages() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name="parchment" size={56} />
        <h1>Pages</h1>
        <p className="placeholder-subtitle">Manage your blogs, devlogs, notes, and projects</p>
      </div>

      <div className="placeholder-content">
        <div className="info-box">
          <Icon name="hourglass" size={40} />
          <h2>Implementation begins Phase 2</h2>
          <p>
            The Pages manager will support different page types:
          </p>
          <ul className="feature-list">
            <li><Icon name="writing" size={24} /> <strong>Blogs:</strong> Blog posts and articles</li>
            <li><Icon name="logbook" size={24} /> <strong>Devlogs:</strong> Development logs with to-do lists</li>
            <li><Icon name="parchment" size={24} /> <strong>Notes:</strong> Quick notes and ideas</li>
            <li><Icon name="castle" size={24} /> <strong>Projects:</strong> Full project pages with status tracking</li>
          </ul>
          <p>
            Each page will support tags, visibility settings, and HTML/Markdown content.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Pages
