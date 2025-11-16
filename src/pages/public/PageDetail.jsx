/**
 * ========================================
 * PUBLIC PAGE DETAIL VIEW
 * ========================================
 * Displays full content of a public page
 *
 * FEATURES:
 * - Full page content rendering
 * - Markdown support
 * - Tags display
 * - Linked quests
 * - Project details (if project type)
 * - Back navigation
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPageById } from '../../services/pagesService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import Tag from '../../components/Tag'
import './PageDetail.css'

// ========================================
// CONSTANTS
// ========================================

const PAGE_TYPES = {
  blog: { label: 'Blog', icon: 'writing', color: '#3498db' },
  devlog: { label: 'Devlog', icon: 'logbook', color: '#9b59b6' },
  notes: { label: 'Notes', icon: 'parchment', color: '#f39c12' },
  project: { label: 'Project', icon: 'castle', color: '#2ecc71' }
}

const PROJECT_STATUS_LABELS = {
  planning: 'Planning',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived'
}

// ========================================
// PAGE DETAIL COMPONENT
// ========================================

function PageDetail() {
  // ========================================
  // ROUTING
  // ========================================

  const { id } = useParams()
  const navigate = useNavigate()

  // ========================================
  // STATE
  // ========================================

  const [page, setPage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch page data on mount
   */
  useEffect(() => {
    fetchPage()
  }, [id])

  /**
   * Load page data
   */
  const fetchPage = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await getPageById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching page', fetchError)
      } else if (data) {
        // Check if page is public
        if (data.visibility !== 'public') {
          setError('This page is not publicly available.')
          logger.warn(`Attempted to access private page: ${id}`)
        } else {
          setPage(data)
          logger.info('Page loaded successfully')
        }
      } else {
        setError('Page not found')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching page', err)
    } finally {
      setIsLoading(false)
    }
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
      month: 'long',
      year: 'numeric'
    })
  }

  /**
   * Render markdown-like content as HTML
   * @param {string} content - Raw content
   * @returns {string} - HTML string
   */
  const renderContent = (content) => {
    if (!content) return '<p class="no-content">No content available.</p>'

    let html = content
      // Escape HTML
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
      // Lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

    // Wrap lists
    html = html.replace(/(<li>.+<\/li>)/gs, '<ul>$1</ul>')

    // Wrap in paragraphs
    html = '<p>' + html + '</p>'

    return html
  }

  // ========================================
  // RENDER
  // ========================================

  // Loading state
  if (isLoading) {
    return (
      <div className="page-detail">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading content...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !page) {
    return (
      <div className="page-detail">
        <div className="error-state">
          <Icon name="cross" size={48} />
          <h2>Unable to Load Page</h2>
          <p>{error || 'Page not found'}</p>
          <button className="back-button" onClick={() => navigate(-1)}>
            <Icon name="back-arrow" size={24} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    )
  }

  const typeConfig = PAGE_TYPES[page.page_type] || PAGE_TYPES.notes

  return (
    <div className="page-detail">
      {/* Navigation */}
      <div className="page-detail-nav">
        <button className="back-link" onClick={() => navigate(-1)}>
          <Icon name="back-arrow" size={20} />
          <span>Back</span>
        </button>
      </div>

      {/* Article Header */}
      <article className="page-article">
        <header className="article-header">
          <div
            className="article-type"
            style={{ backgroundColor: typeConfig.color }}
          >
            <Icon name={typeConfig.icon} size={20} />
            <span>{typeConfig.label}</span>
          </div>

          <h1>{page.title}</h1>

          <div className="article-meta">
            <span className="article-date">
              <Icon name="time" size={18} />
              {formatDate(page.updated_at)}
            </span>
          </div>

          {/* Tags */}
          {page.tags && page.tags.length > 0 && (
            <div className="article-tags">
              {page.tags.map((tag) => (
                <Tag key={tag.id} name={tag.name} color={tag.color} size="normal" />
              ))}
            </div>
          )}
        </header>

        {/* Project Info */}
        {page.page_type === 'project' && (
          <div className="project-info-box">
            <h3>
              <Icon name="castle" size={24} />
              Project Details
            </h3>
            <div className="project-details-grid">
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  {PROJECT_STATUS_LABELS[page.project_status] || 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Started</span>
                <span className="detail-value">{formatDate(page.project_start_date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Completed</span>
                <span className="detail-value">{formatDate(page.project_end_date)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: renderContent(page.content) }}
        />

        {/* Linked Quests */}
        {page.quests && page.quests.length > 0 && (
          <div className="linked-quests-box">
            <h3>
              <Icon name="quests" size={24} />
              Related Quests
            </h3>
            <div className="quests-links">
              {page.quests.map((quest) => (
                <Link key={quest.id} to="/quests" className="quest-link">
                  <Icon name="quests" size={18} />
                  <span>{quest.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related Content CTA */}
      <div className="related-cta">
        <h3>Continue Reading</h3>
        <div className="cta-links">
          <Link to="/blog" className="cta-link">
            <Icon name="writing" size={24} />
            <span>More Blog Posts</span>
          </Link>
          <Link to="/projects" className="cta-link">
            <Icon name="castle" size={24} />
            <span>View Projects</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default PageDetail
