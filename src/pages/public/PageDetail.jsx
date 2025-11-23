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
import { getPageById, getAllPages } from '../../services/pagesService'
import { getAllIssues } from '../../services/issuesService'
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
  project: { label: 'Project', icon: 'castle', color: '#d4af37' }
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
  const [devlogs, setDevlogs] = useState([])
  const [issues, setIssues] = useState([])
  const [linkedQuestIssues, setLinkedQuestIssues] = useState([])
  const [showLinkedQuestIssues, setShowLinkedQuestIssues] = useState(false)

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
   * Fetch additional data when page is loaded
   */
  useEffect(() => {
    if (page && page.page_type === 'project') {
      fetchDevlogs()
      fetchIssues()
    }
  }, [page])

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

  /**
   * Fetch issues for this project and linked quests
   */
  const fetchIssues = async () => {
    try {
      logger.debug('Fetching issues for project...')

      // Fetch issues attached to this project
      const { data: projectIssues, error: projectError } = await getAllIssues({
        attachedToType: 'project',
        attachedToId: id
      })

      if (projectError) {
        logger.error('Error fetching project issues', projectError)
      } else {
        setIssues(projectIssues || [])
      }

      // Fetch issues from linked quests
      const questIds = page.quests?.map(q => q.id) || []
      if (questIds.length > 0) {
        const allLinkedIssues = []
        for (const questId of questIds) {
          const { data: questIssues, error: questError } = await getAllIssues({
            attachedToType: 'quest',
            attachedToId: questId
          })
          if (!questError && questIssues) {
            allLinkedIssues.push(...questIssues)
          }
        }
        setLinkedQuestIssues(allLinkedIssues)
      }

      logger.info(`Fetched ${projectIssues?.length || 0} project issues and ${linkedQuestIssues.length} quest issues`)
    } catch (err) {
      logger.error('Error fetching issues', err)
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

        {/* Issues */}
        {(issues.length > 0 || linkedQuestIssues.length > 0) && (
          <div className="issues-box">
            <div className="issues-header">
              <h3>
                <Icon name="bug" size={24} />
                Issues
              </h3>
              {linkedQuestIssues.length > 0 && (
                <button
                  className="toggle-button"
                  onClick={() => setShowLinkedQuestIssues(!showLinkedQuestIssues)}
                >
                  <Icon name={showLinkedQuestIssues ? 'check-box' : 'box'} size={18} />
                  <span>Show quest issues ({linkedQuestIssues.length})</span>
                </button>
              )}
            </div>

            {/* Project Issues */}
            {issues.length > 0 && (
              <div className="issues-section">
                <h4 className="issues-section-title">Project Issues ({issues.length})</h4>
                <div className="issues-list">
                  {issues.map((issue) => (
                    <div key={issue.id} className={`issue-item ${issue.issue_type}`}>
                      <div className="issue-header-row">
                        <Icon name={issue.issue_type === 'bug' ? 'bug' : 'star'} size={16} />
                        <span className="issue-title">{issue.title}</span>
                        <span className={`issue-status status-${issue.status}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                      {issue.description && (
                        <p className="issue-description">{issue.description}</p>
                      )}
                      {issue.issue_type === 'bug' && issue.severity && (
                        <span className={`severity-badge severity-${issue.severity}`}>
                          {issue.severity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Quest Issues (Toggle) */}
            {showLinkedQuestIssues && linkedQuestIssues.length > 0 && (
              <div className="issues-section">
                <h4 className="issues-section-title">Quest Issues ({linkedQuestIssues.length})</h4>
                <div className="issues-list">
                  {linkedQuestIssues.map((issue) => (
                    <div key={issue.id} className={`issue-item ${issue.issue_type}`}>
                      <div className="issue-header-row">
                        <Icon name={issue.issue_type === 'bug' ? 'bug' : 'star'} size={16} />
                        <span className="issue-title">{issue.title}</span>
                        <span className={`issue-status status-${issue.status}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                      {issue.description && (
                        <p className="issue-description">{issue.description}</p>
                      )}
                      {issue.issue_type === 'bug' && issue.severity && (
                        <span className={`severity-badge severity-${issue.severity}`}>
                          {issue.severity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
