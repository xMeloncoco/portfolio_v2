/**
 * ========================================
 * PAGE VIEW (Detail)
 * ========================================
 * View complete page details and content
 *
 * FEATURES:
 * - Display page title and type
 * - Render content (with markdown support)
 * - Show visibility status
 * - Display tags
 * - Show linked quests
 * - Created/updated timestamps
 * - Project-specific info (status, dates)
 * - Edit and delete actions
 * - Back to list navigation
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPageById, deletePage } from '../services/pagesService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import Tag from '../components/Tag'
import ConfirmModal from '../components/ConfirmModal'
import './PageView.css'

// ========================================
// CONSTANTS
// ========================================

/**
 * Page type display configuration
 */
const PAGE_TYPES = {
  blog: { label: 'Blog', icon: 'writing', color: '#3498db' },
  devlog: { label: 'Devlog', icon: 'logbook', color: '#9b59b6' },
  notes: { label: 'Notes', icon: 'parchment', color: '#f39c12' },
  project: { label: 'Project', icon: 'castle', color: '#2ecc71' }
}

/**
 * Project status labels
 */
const PROJECT_STATUS_LABELS = {
  planning: 'Planning',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived'
}

// ========================================
// PAGE VIEW COMPONENT
// ========================================

function PageView() {
  // ========================================
  // ROUTING
  // ========================================

  const { id } = useParams()
  const navigate = useNavigate()

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  const [page, setPage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch page data on mount
   */
  useEffect(() => {
    fetchPageData()
  }, [id])

  /**
   * Load page data from database
   */
  const fetchPageData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info(`Fetching page details for ID: ${id}`)

      const { data, error: fetchError } = await getPageById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching page', fetchError)
      } else if (data) {
        setPage(data)
        logger.info('Page data loaded successfully')
      } else {
        setError('Page not found')
        logger.warn(`Page not found: ${id}`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching page', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Navigate back to pages list
   */
  const handleBackToList = () => {
    navigate('/admin/pages')
  }

  /**
   * Navigate to edit page
   */
  const handleEditPage = () => {
    navigate(`/admin/pages/${id}/edit`)
  }

  /**
   * Open delete confirmation modal
   */
  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  /**
   * Confirm page deletion
   */
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      logger.info(`Deleting page: ${id}`)

      const { success, error: deleteError } = await deletePage(id)

      if (deleteError) {
        setError(deleteError)
        logger.error('Error deleting page', deleteError)
      } else if (success) {
        logger.info('Page deleted successfully')
        navigate('/admin/pages')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error deleting page', err)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  /**
   * Format datetime for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted datetime
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Render markdown content as HTML
   * Note: For now, this is a simple implementation
   * Could be enhanced with a proper markdown parser
   * @param {string} content - Raw content
   * @returns {string} - HTML string
   */
  const renderContent = (content) => {
    if (!content) return '<p class="no-content">No content available.</p>'

    // Simple markdown-like rendering
    // Convert line breaks to paragraphs
    let html = content
      // Escape HTML to prevent XSS
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

    // Wrap in paragraph tags
    html = '<p>' + html + '</p>'

    return html
  }

  // ========================================
  // RENDER
  // ========================================

  // Loading state
  if (isLoading) {
    return (
      <div className="page-view-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading page details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="page-view-container">
        <div className="error-state">
          <Icon name="cross" size={48} />
          <h2>Error Loading Page</h2>
          <p>{error}</p>
          <button className="back-button" onClick={handleBackToList}>
            <Icon name="back-arrow" size={24} />
            <span>Back to Pages</span>
          </button>
        </div>
      </div>
    )
  }

  // No page found
  if (!page) {
    return (
      <div className="page-view-container">
        <div className="error-state">
          <Icon name="parchment" size={48} />
          <h2>Page Not Found</h2>
          <p>The page you&apos;re looking for doesn&apos;t exist.</p>
          <button className="back-button" onClick={handleBackToList}>
            <Icon name="back-arrow" size={24} />
            <span>Back to Pages</span>
          </button>
        </div>
      </div>
    )
  }

  const typeConfig = PAGE_TYPES[page.page_type] || PAGE_TYPES.notes

  return (
    <div className="page-view-container">
      {/* Header */}
      <div className="page-view-header">
        <button className="back-button-small" onClick={handleBackToList} title="Back to pages list">
          <Icon name="back-arrow" size={24} />
        </button>

        <div className="page-type-badge-large" style={{ backgroundColor: typeConfig.color }}>
          <Icon name={typeConfig.icon} size={32} />
          <span>{typeConfig.label}</span>
        </div>

        <h1 className="page-title">{page.title}</h1>

        <div className="page-actions">
          <button className="action-button edit" onClick={handleEditPage} title="Edit page">
            <Icon name="edit-pencil" size={24} />
            <span>Edit</span>
          </button>
          <button className="action-button delete" onClick={handleDeleteClick} title="Delete page">
            <Icon name="trash-can" size={24} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Meta Information */}
      <div className="page-meta-section">
        <div className="meta-item">
          <Icon name={page.visibility === 'public' ? 'web' : 'lock'} size={20} />
          <span className={`visibility-badge ${page.visibility}`}>{page.visibility}</span>
        </div>

        <div className="meta-item">
          <Icon name="time" size={20} />
          <span>Created: {formatDateTime(page.created_at)}</span>
        </div>

        <div className="meta-item">
          <Icon name="edit-pencil" size={20} />
          <span>Updated: {formatDateTime(page.updated_at)}</span>
        </div>
      </div>

      {/* Tags */}
      {page.tags && page.tags.length > 0 && (
        <div className="page-tags-section">
          <h3>
            <Icon name="gem" size={24} />
            Tags
          </h3>
          <div className="tags-list">
            {page.tags.map((tag) => (
              <Tag key={tag.id} name={tag.name} color={tag.color} size="normal" />
            ))}
          </div>
        </div>
      )}

      {/* Project Details */}
      {page.page_type === 'project' && (
        <div className="project-details-section">
          <h3>
            <Icon name="castle" size={24} />
            Project Details
          </h3>
          <div className="project-info-grid">
            <div className="project-info-item">
              <span className="info-label">Status</span>
              <span className="info-value status">
                {PROJECT_STATUS_LABELS[page.project_status] || page.project_status || 'N/A'}
              </span>
            </div>
            <div className="project-info-item">
              <span className="info-label">Start Date</span>
              <span className="info-value">{formatDate(page.project_start_date)}</span>
            </div>
            <div className="project-info-item">
              <span className="info-label">End Date</span>
              <span className="info-value">{formatDate(page.project_end_date)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Linked Quests */}
      {page.quests && page.quests.length > 0 && (
        <div className="linked-quests-section">
          <h3>
            <Icon name="quests" size={24} />
            Linked Quests
          </h3>
          <div className="quests-list">
            {page.quests.map((quest) => (
              <div key={quest.id} className="quest-item">
                <Icon name="quests" size={20} />
                <span className="quest-title">{quest.title}</span>
                <span className="quest-status">{quest.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="page-content-section">
        <h3>
          <Icon name="writing" size={24} />
          Content
        </h3>
        <div
          className="content-body"
          dangerouslySetInnerHTML={{ __html: renderContent(page.content) }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Page"
        message={`Are you sure you want to delete "${page.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default PageView
