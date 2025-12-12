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
 * - Linked quests and projects
 * - Back navigation
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPageById, getAllPages } from '../../services/pagesService'
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
  notes: { label: 'Notes', icon: 'parchment', color: '#f39c12' }
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
  const [devlogs, setDevlogs] = useState([])

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

  /**
   * Fetch devlogs attached to this project or linked quests
   */
  const fetchDevlogs = async () => {
    try {
      logger.debug('Fetching devlogs for project...')

      // Fetch devlogs that are connected to this project or its linked quests
      const { data, error: fetchError } = await getAllPages({
        pageType: 'devlog',
        visibility: 'public'
      })

      if (fetchError) {
        logger.error('Error fetching devlogs', fetchError)
        return
      }

      // Filter devlogs that are connected to this project or its quests
      const questIds = page.quests?.map(q => q.id) || []
      const relatedDevlogs = data.filter(devlog => {
        // Check if devlog is connected to this project
        const connectedToProject = devlog.projects?.some(p => p.id === page.id)
        // Check if devlog is connected to any of the linked quests
        const connectedToQuest = devlog.quests?.some(q => questIds.includes(q.id))
        return connectedToProject || connectedToQuest
      })

      setDevlogs(relatedDevlogs)
      logger.info(`Fetched ${relatedDevlogs.length} related devlogs`)
    } catch (err) {
      logger.error('Error fetching devlogs', err)
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

        {/* Content */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: renderContent(page.content) }}
        />

        {/* Linked Quests (Public Only) */}
        {page.quests && page.quests.length > 0 && (
          <div className="linked-quests-box">
            <h3>
              <Icon name="quests" size={24} />
              Linked Quests
            </h3>
            <div className="quests-links">
              {page.quests
                .filter((quest) => quest.visibility === 'public')
                .map((quest) => (
                  <Link key={quest.id} to={`/quests/${quest.id}`} className="quest-link">
                    <Icon name="quests" size={18} />
                    <span>{quest.title}</span>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Devlogs */}
        {devlogs.length > 0 && (
          <div className="devlogs-box">
            <h3>
              <Icon name="logbook" size={24} />
              Development Logs
            </h3>
            <div className="devlogs-list">
              {devlogs.map((devlog) => (
                <Link key={devlog.id} to={`/page/${devlog.id}`} className="devlog-link">
                  <div className="devlog-icon">
                    <Icon name="logbook" size={20} />
                  </div>
                  <div className="devlog-info">
                    <h4>{devlog.title}</h4>
                    <span className="devlog-date">{formatDate(devlog.updated_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </article>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default PageDetail
