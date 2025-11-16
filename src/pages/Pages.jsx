/**
 * ========================================
 * PAGES MANAGEMENT PAGE (Admin)
 * ========================================
 * List view for managing all pages (blogs, devlogs, notes, projects)
 *
 * FEATURES:
 * - List all pages with sorting by last updated
 * - Filter by page type
 * - Create new pages
 * - Edit existing pages
 * - Delete pages with confirmation
 * - Click page name to view details
 * - Shows tags and visibility status
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllPages, deletePage } from '../services/pagesService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import Tag from '../components/Tag'
import ConfirmModal from '../components/ConfirmModal'
import './Pages.css'

// ========================================
// PAGE TYPE CONFIGURATION
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

// ========================================
// PAGES COMPONENT
// ========================================

function Pages() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Pages data
  const [pages, setPages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtering
  const [filterType, setFilterType] = useState('all')

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pageToDelete, setPageToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Navigation
  const navigate = useNavigate()

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch all pages from the database
   */
  const fetchPages = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info('Fetching pages...')

      const options = {}
      if (filterType !== 'all') {
        options.pageType = filterType
      }

      const { data, error: fetchError } = await getAllPages(options)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching pages', fetchError)
      } else {
        setPages(data)
        logger.info(`Loaded ${data.length} pages`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching pages', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch pages on mount and when filter changes
  useEffect(() => {
    fetchPages()
  }, [filterType])

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Navigate to create new page
   */
  const handleCreatePage = () => {
    navigate('/admin/pages/new')
  }

  /**
   * Navigate to edit page
   * @param {string} pageId - Page UUID
   */
  const handleEditPage = (pageId) => {
    navigate(`/admin/pages/${pageId}/edit`)
  }

  /**
   * Navigate to view page details
   * @param {string} pageId - Page UUID
   */
  const handleViewPage = (pageId) => {
    navigate(`/admin/pages/${pageId}`)
  }

  /**
   * Open delete confirmation modal
   * @param {Object} page - Page object
   */
  const handleDeleteClick = (page) => {
    setPageToDelete(page)
    setShowDeleteModal(true)
  }

  /**
   * Confirm page deletion
   */
  const handleConfirmDelete = async () => {
    if (!pageToDelete) return

    try {
      setIsDeleting(true)
      logger.info(`Deleting page: ${pageToDelete.id}`)

      const { success, error: deleteError } = await deletePage(pageToDelete.id)

      if (deleteError) {
        setError(deleteError)
        logger.error('Error deleting page', deleteError)
      } else if (success) {
        logger.info(`Page deleted successfully: ${pageToDelete.id}`)
        // Refresh the list
        await fetchPages()
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error deleting page', err)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setPageToDelete(null)
    }
  }

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setPageToDelete(null)
  }

  /**
   * Handle filter change
   * @param {string} type - Page type to filter by
   */
  const handleFilterChange = (type) => {
    setFilterType(type)
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
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  /**
   * Format time ago for last updated
   * @param {string} dateString - ISO date string
   * @returns {string} - Time ago string
   */
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="pages-container">
      {/* Page Header */}
      <div className="pages-header">
        <div className="pages-title-section">
          <Icon name="parchment" size={48} />
          <div>
            <h1>Pages</h1>
            <p className="pages-subtitle">Manage your blogs, devlogs, notes, and projects</p>
          </div>
        </div>

        <button
          className="create-button"
          onClick={handleCreatePage}
          title="Create new page"
        >
          <Icon name="plus" size={24} />
          <span>New Page</span>
        </button>
      </div>

      {/* Filters */}
      <div className="pages-filters">
        <div className="filter-group">
          <span className="filter-label">Filter by type:</span>
          <div className="filter-buttons">
            <button
              className={`filter-button ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            {Object.entries(PAGE_TYPES).map(([type, config]) => (
              <button
                key={type}
                className={`filter-button ${filterType === type ? 'active' : ''}`}
                onClick={() => handleFilterChange(type)}
              >
                <Icon name={config.icon} size={18} />
                {config.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pages-count">
          {!isLoading && (
            <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <Icon name="cross" size={24} />
          <span>{error}</span>
          <button onClick={fetchPages} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading pages...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && pages.length === 0 && (
        <div className="empty-state">
          <Icon name="parchment" size={64} />
          <h2>No pages yet</h2>
          <p>
            {filterType === 'all'
              ? 'Create your first page to get started!'
              : `No ${PAGE_TYPES[filterType]?.label || filterType} pages found.`}
          </p>
          <button className="create-button" onClick={handleCreatePage}>
            <Icon name="plus" size={24} />
            <span>Create Page</span>
          </button>
        </div>
      )}

      {/* Pages List */}
      {!isLoading && !error && pages.length > 0 && (
        <div className="pages-list">
          {pages.map((page) => (
            <div key={page.id} className="page-item">
              {/* Page Type Badge */}
              <div
                className="page-type-badge"
                style={{ backgroundColor: PAGE_TYPES[page.page_type]?.color || '#666' }}
              >
                <Icon name={PAGE_TYPES[page.page_type]?.icon || 'parchment'} size={20} />
                <span>{PAGE_TYPES[page.page_type]?.label || page.page_type}</span>
              </div>

              {/* Page Info */}
              <div className="page-info">
                <h3
                  className="page-title"
                  onClick={() => handleViewPage(page.id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && handleViewPage(page.id)}
                >
                  {page.title}
                </h3>

                <div className="page-meta">
                  <span className="page-date" title={`Created: ${formatDate(page.created_at)}`}>
                    <Icon name="time" size={16} />
                    {formatTimeAgo(page.updated_at)}
                  </span>

                  <span className={`page-visibility ${page.visibility}`}>
                    <Icon name={page.visibility === 'public' ? 'web' : 'lock'} size={16} />
                    {page.visibility}
                  </span>
                </div>

                {/* Tags */}
                {page.tags && page.tags.length > 0 && (
                  <div className="page-tags">
                    {page.tags.slice(0, 5).map((tag) => (
                      <Tag
                        key={tag.id}
                        name={tag.name}
                        color={tag.color}
                        size="small"
                      />
                    ))}
                    {page.tags.length > 5 && (
                      <span className="more-tags">+{page.tags.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="page-actions">
                <button
                  className="action-button edit"
                  onClick={() => handleEditPage(page.id)}
                  title="Edit page"
                >
                  <Icon name="edit-pencil" size={20} />
                </button>
                <button
                  className="action-button delete"
                  onClick={() => handleDeleteClick(page)}
                  title="Delete page"
                >
                  <Icon name="trash-can" size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Page"
        message={`Are you sure you want to delete "${pageToDelete?.title}"? This action cannot be undone.`}
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

export default Pages
