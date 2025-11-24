/**
 * ========================================
 * PUBLIC PROJECTS PAGE
 * ========================================
 * Lists all public project pages
 *
 * FEATURES:
 * - Project cards with status
 * - Tag filtering
 * - Sorted by date
 * - Project status display
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllProjects } from '../../services/projectsService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import Tag from '../../components/Tag'
import './Projects.css'

// ========================================
// STATUS LABELS
// ========================================

const PROJECT_STATUS_LABELS = {
  planning: { label: 'Planning', color: '#95a5a6' },
  active: { label: 'Active', color: '#3498db' },
  on_hold: { label: 'On Hold', color: '#f39c12' },
  completed: { label: 'Completed', color: '#2ecc71' },
  archived: { label: 'Archived', color: '#7f8c8d' }
}

// ========================================
// PROJECTS PAGE COMPONENT
// ========================================

function Projects() {
  // ========================================
  // STATE
  // ========================================

  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch projects on mount
   */
  useEffect(() => {
    fetchProjects()
  }, [])

  /**
   * Load public projects
   */
  const fetchProjects = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await getAllProjects({ visibility: 'public', includePrivate: false })

      if (error) {
        logger.error('Error fetching projects', error)
      } else if (data) {
        setProjects(data)
        logger.info(`Loaded ${data.length} projects`)
      }
    } catch (err) {
      logger.error('Unexpected error fetching projects', err)
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
      month: 'short',
      year: 'numeric'
    })
  }

  /**
   * Truncate text
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Max characters
   * @returns {string} - Truncated text
   */
  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="projects-page">
      {/* Header */}
      <div className="projects-header">
        <div className="projects-title-section">
          <Icon name="castle" size={48} />
          <div>
            <h1>Projects</h1>
            <p>Explore my completed and ongoing projects</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading projects...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && projects.length === 0 && (
        <div className="empty-state">
          <Icon name="castle" size={64} />
          <h2>No projects yet</h2>
          <p>Projects will appear here once they&apos;re published.</p>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && projects.length > 0 && (
        <div className="projects-grid-public">
          {projects.map((project) => {
            const statusConfig = PROJECT_STATUS_LABELS[project.status] ||
                               PROJECT_STATUS_LABELS.planning

            return (
              <Link
                key={project.id}
                to={`/project/${project.slug}`}
                className="project-card-public"
              >
                <div className="project-card-header">
                  <div className="project-icon-large">
                    <Icon name="castle" size={48} />
                  </div>
                  <div
                    className="project-status-badge"
                    style={{ backgroundColor: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </div>
                </div>

                <h3>{project.title}</h3>
                <p>{truncateText(project.description)}</p>

                {project.tags && project.tags.length > 0 && (
                  <div className="project-tags-public">
                    {project.tags.slice(0, 5).map((tag) => (
                      <Tag key={tag.id} name={tag.name} color={tag.color} size="small" />
                    ))}
                  </div>
                )}

                <div className="project-meta-public">
                  {project.start_date && (
                    <span className="project-date-range">
                      <Icon name="time" size={14} />
                      {formatDate(project.start_date)}
                      {project.end_date && ` - ${formatDate(project.end_date)}`}
                    </span>
                  )}
                </div>

                <div className="view-project">
                  <span>View Project</span>
                  <Icon name="chevron-right" size={18} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default Projects
