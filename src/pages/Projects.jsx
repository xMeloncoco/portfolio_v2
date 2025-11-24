/**
 * ========================================
 * PROJECTS MANAGEMENT PAGE (Admin)
 * ========================================
 * List view for managing all projects
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllProjects, deleteProject, getAllProjectStatuses } from '../services/projectsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import Tag from '../components/Tag'
import ConfirmModal from '../components/ConfirmModal'
import './Projects.css'

function Projects() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const navigate = useNavigate()

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const options = {}
      if (filterStatus !== 'all') {
        options.status = filterStatus
      }

      const { data, error: fetchError } = await getAllProjects(options)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching projects', fetchError)
      } else {
        setProjects(data)
        logger.info(`Loaded ${data.length} projects`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching projects', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [filterStatus])

  const handleCreateProject = () => {
    navigate('/admin/projects/new')
  }

  const handleEditProject = (projectId) => {
    navigate(`/admin/projects/${projectId}/edit`)
  }

  const handleOpenDeleteModal = (project) => {
    setProjectToDelete(project)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setProjectToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return

    try {
      setIsDeleting(true)
      logger.info(`Deleting project: ${projectToDelete.id}`)

      const { success, error: deleteError } = await deleteProject(projectToDelete.id)

      if (deleteError) {
        setError(deleteError)
        logger.error('Error deleting project', deleteError)
      } else if (success) {
        logger.info('Project deleted successfully')
        fetchProjects()
        handleCloseDeleteModal()
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error deleting project', err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="projects-page">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p className="page-description">Manage your portfolio projects</p>
        </div>
        <button className="create-button" onClick={handleCreateProject}>
          <Icon name="plus" size={24} />
          <span>New Project</span>
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <Icon name="cross" size={24} />
          <span>{error}</span>
        </div>
      )}

      <div className="projects-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <Icon name="castle" size={64} />
          <h2>No projects yet</h2>
          <p>Create your first project to get started</p>
          <button className="create-button-large" onClick={handleCreateProject}>
            <Icon name="plus" size={28} />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3>{project.title}</h3>
                <div className="project-actions">
                  <button
                    className="action-button edit"
                    onClick={() => handleEditProject(project.id)}
                    title="Edit project"
                  >
                    <Icon name="edit-pencil" size={20} />
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => handleOpenDeleteModal(project)}
                    title="Delete project"
                  >
                    <Icon name="trash" size={20} />
                  </button>
                </div>
              </div>

              <div className="project-meta">
                <span className={`status-badge status-${project.status}`}>
                  {project.status_display}
                </span>
                <span className={`visibility-badge visibility-${project.visibility}`}>
                  {project.visibility}
                </span>
              </div>

              {project.description && (
                <p className="project-description">
                  {project.description.substring(0, 150)}
                  {project.description.length > 150 ? '...' : ''}
                </p>
              )}

              {project.tags && project.tags.length > 0 && (
                <div className="project-tags">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Tag key={tag.id} name={tag.name} color={tag.color} size="small" />
                  ))}
                  {project.tags.length > 3 && (
                    <span className="more-tags">+{project.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.title}"? This will unlink all quests from this project.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteModal}
        isProcessing={isDeleting}
        variant="danger"
      />
    </div>
  )
}

export default Projects
