/**
 * ========================================
 * PUBLIC PROJECT DETAIL VIEW
 * ========================================
 * Displays full content of a public project
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProjectBySlug } from '../../services/projectsService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import Tag from '../../components/Tag'
import './PageDetail.css'

// ========================================
// CONSTANTS
// ========================================

const PROJECT_STATUS_LABELS = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived'
}

// ========================================
// PROJECT DETAIL COMPONENT
// ========================================

function ProjectDetail() {
  // ========================================
  // ROUTING
  // ========================================

  const { slug } = useParams()
  const navigate = useNavigate()

  // ========================================
  // STATE
  // ========================================

  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch project data on mount
   */
  useEffect(() => {
    fetchProject()
  }, [slug])

  /**
   * Load project data by slug
   */
  const fetchProject = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await getProjectBySlug(slug)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching project', fetchError)
      } else if (data) {
        // Check if project is public
        if (data.visibility !== 'public') {
          setError('This project is not publicly available')
          return
        }
        setProject(data)
        logger.info(`Loaded project: ${data.title}`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching project', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
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
          <p>Loading project...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="page-detail">
        <div className="error-state">
          <Icon name="cross" size={64} />
          <h2>Project Not Found</h2>
          <p>{error}</p>
          <Link to="/projects" className="back-link-button">
            <Icon name="chevron-left" size={18} />
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  // No project found
  if (!project) {
    return (
      <div className="page-detail">
        <div className="error-state">
          <Icon name="castle" size={64} />
          <h2>Project Not Found</h2>
          <p>The project you're looking for doesn't exist or has been removed.</p>
          <Link to="/projects" className="back-link-button">
            <Icon name="chevron-left" size={18} />
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status

  return (
    <div className="page-detail">
      {/* Header */}
      <div className="page-header">
        <Link to="/projects" className="back-link">
          <Icon name="chevron-left" size={18} />
          Back to Projects
        </Link>

        <div className="page-title-section">
          <Icon name="castle" size={48} />
          <div>
            <h1>{project.title}</h1>
            <div className="page-meta">
              <span className="page-type-badge">Project</span>
              <span className="project-status-label">{statusLabel}</span>
              {project.start_date && (
                <span className="page-date">
                  <Icon name="time" size={16} />
                  {formatDate(project.start_date)}
                  {project.end_date && ` - ${formatDate(project.end_date)}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="page-tags-section">
          <Icon name="tags" size={20} />
          <div className="page-tags">
            {project.tags.map((tag) => (
              <Tag key={tag.id} name={tag.name} color={tag.color} size="normal" />
            ))}
          </div>
        </div>
      )}

      {/* External Link */}
      {project.external_link && (
        <div className="project-external-link">
          <a
            href={project.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-button"
          >
            <Icon name="link" size={20} />
            View Live Project
            <Icon name="external-link" size={16} />
          </a>
        </div>
      )}

      {/* Content */}
      <div className="page-content">
        {project.description ? (
          <div className="content-text">
            {project.description.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <div className="empty-content">
            <Icon name="parchment" size={48} />
            <p>No description available for this project.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="page-footer">
        <Link to="/projects" className="back-link-button">
          <Icon name="chevron-left" size={18} />
          Back to Projects
        </Link>
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default ProjectDetail
