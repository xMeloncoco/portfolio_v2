/**
 * ========================================
 * PAGE FORM (Create/Edit)
 * ========================================
 * Form for creating or editing pages
 * This is a placeholder - full implementation coming next
 */

import { useParams, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import './PlaceholderPage.css'

function PageForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name={isEditing ? 'edit-pencil' : 'plus'} size={56} />
        <h1>{isEditing ? 'Edit Page' : 'Create New Page'}</h1>
        <p className="placeholder-subtitle">
          {isEditing ? 'Modify your page content and settings' : 'Add a new page to your portfolio'}
        </p>
      </div>

      <div className="placeholder-content">
        <div className="info-box">
          <Icon name="hourglass" size={40} />
          <h2>Form Implementation In Progress</h2>
          <p>
            The page form will include:
          </p>
          <ul className="feature-list">
            <li>Title input field</li>
            <li>Page type selector (Blog, Devlog, Notes, Project)</li>
            <li>Visibility toggle (Public/Private)</li>
            <li>Content editor (HTML/Markdown)</li>
            <li>Tag selector</li>
            <li>Quest linking</li>
            <li>Project-specific fields (status, dates)</li>
          </ul>
          <p>
            {isEditing ? `Editing page ID: ${id}` : 'Creating new page'}
          </p>
        </div>

        <button
          className="create-button"
          onClick={() => navigate('/admin/pages')}
          style={{ marginTop: 'var(--spacing-lg)' }}
        >
          <Icon name="back-arrow" size={24} />
          <span>Back to Pages List</span>
        </button>
      </div>
    </div>
  )
}

export default PageForm
