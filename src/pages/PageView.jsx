/**
 * ========================================
 * PAGE VIEW (Detail)
 * ========================================
 * View page details and content
 * This is a placeholder - full implementation coming next
 */

import { useParams, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import './PlaceholderPage.css'

function PageView() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name="parchment" size={56} />
        <h1>Page Details</h1>
        <p className="placeholder-subtitle">View page content and information</p>
      </div>

      <div className="placeholder-content">
        <div className="info-box">
          <Icon name="hourglass" size={40} />
          <h2>Page View Implementation In Progress</h2>
          <p>
            The page view will display:
          </p>
          <ul className="feature-list">
            <li>Page title and type</li>
            <li>Full content (rendered HTML/Markdown)</li>
            <li>Tags and metadata</li>
            <li>Linked quests</li>
            <li>Created and updated dates</li>
            <li>For devlogs: to-do list items</li>
            <li>For projects: status and timeline</li>
          </ul>
          <p>
            Viewing page ID: {id}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)', justifyContent: 'center' }}>
          <button
            className="create-button"
            onClick={() => navigate('/admin/pages')}
          >
            <Icon name="back-arrow" size={24} />
            <span>Back to List</span>
          </button>

          <button
            className="create-button"
            onClick={() => navigate(`/admin/pages/${id}/edit`)}
          >
            <Icon name="edit-pencil" size={24} />
            <span>Edit Page</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PageView
