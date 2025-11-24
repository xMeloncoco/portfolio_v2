/**
 * ========================================
 * DEVLOGS MANAGEMENT PAGE (Admin)
 * ========================================
 * List view for managing all devlogs
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllDevlogs, deleteDevlog } from '../services/devlogsService'
import { getAllProjects } from '../services/projectsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import Tag from '../components/Tag'
import ConfirmModal from '../components/ConfirmModal'
import './Devlogs.css'

function Devlogs() {
  const [devlogs, setDevlogs] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterProject, setFilterProject] = useState('all')
  const [filterVisibility, setFilterVisibility] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [devlogToDelete, setDevlogToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const navigate = useNavigate()

  const fetchProjects = async () => {
    try {
      const { data, error: fetchError } = await getAllProjects()
      if (fetchError) {
        logger.error('Error fetching projects for filter', fetchError)
      } else {
        setProjects(data || [])
      }
    } catch (err) {
      logger.error('Unexpected error fetching projects', err)
    }
  }

  const fetchDevlogs = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const options = {}
      if (filterProject !== 'all') {
        options.projectId = filterProject
      }
      if (filterVisibility !== 'all') {
        options.visibility = filterVisibility
      }

      const { data, error: fetchError } = await getAllDevlogs(options)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching devlogs', fetchError)
      } else {
        setDevlogs(data)
        logger.info(`Loaded ${data.length} devlogs`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching devlogs', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchDevlogs()
  }, [filterProject, filterVisibility])

  const handleCreateDevlog = () => {
    navigate('/admin/devlogs/new')
  }

  const handleEditDevlog = (devlogId) => {
    navigate(`/admin/devlogs/${devlogId}/edit`)
  }

  const handleOpenDeleteModal = (devlog) => {
    setDevlogToDelete(devlog)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setDevlogToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!devlogToDelete) return

    try {
      setIsDeleting(true)
      logger.info(`Deleting devlog: ${devlogToDelete.id}`)

      const { success, error: deleteError } = await deleteDevlog(devlogToDelete.id)

      if (deleteError) {
        setError(deleteError)
        logger.error('Error deleting devlog', deleteError)
      } else if (success) {
        logger.info('Devlog deleted successfully')
        fetchDevlogs()
        handleCloseDeleteModal()
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error deleting devlog', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="devlogs-page">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading devlogs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="devlogs-page">
      <div className="devlogs-header">
        <div>
          <h1>Devlogs</h1>
          <p className="page-description">Development session logs and progress updates</p>
        </div>
        <button className="create-button" onClick={handleCreateDevlog}>
          <Icon name="plus" size={24} />
          <span>New Devlog</span>
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <Icon name="cross" size={24} />
          <span>{error}</span>
        </div>
      )}

      <div className="devlogs-filters">
        <div className="filter-group">
          <label htmlFor="project-filter">Project:</label>
          <select
            id="project-filter"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Projects</option>
            <option value="none">No Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="visibility-filter">Visibility:</label>
          <select
            id="visibility-filter"
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {devlogs.length === 0 ? (
        <div className="empty-state">
          <Icon name="logbook" size={64} />
          <h2>No devlogs yet</h2>
          <p>Create your first devlog to track your development progress</p>
          <button className="create-button-large" onClick={handleCreateDevlog}>
            <Icon name="plus" size={28} />
            <span>Create Devlog</span>
          </button>
        </div>
      ) : (
        <div className="devlogs-grid">
          {devlogs.map((devlog) => (
            <div key={devlog.id} className="devlog-card">
              <div className="devlog-card-header">
                <h3>{devlog.title}</h3>
                <div className="devlog-actions">
                  <button
                    className="action-button edit"
                    onClick={() => handleEditDevlog(devlog.id)}
                    title="Edit devlog"
                  >
                    <Icon name="edit-pencil" size={20} />
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => handleOpenDeleteModal(devlog)}
                    title="Delete devlog"
                  >
                    <Icon name="trash" size={20} />
                  </button>
                </div>
              </div>

              <div className="devlog-meta">
                <span className="session-date">
                  <Icon name="calendar" size={16} />
                  {formatDate(devlog.session_date)}
                </span>
                <span className={`visibility-badge visibility-${devlog.visibility}`}>
                  {devlog.visibility}
                </span>
              </div>

              {devlog.project && (
                <div className="devlog-project">
                  <Icon name="castle" size={16} />
                  <span>{devlog.project.title}</span>
                </div>
              )}

              {devlog.content && (
                <p className="devlog-content">
                  {devlog.content.substring(0, 150)}
                  {devlog.content.length > 150 ? '...' : ''}
                </p>
              )}

              <div className="devlog-footer">
                {devlog.tags && devlog.tags.length > 0 && (
                  <div className="devlog-tags">
                    {devlog.tags.slice(0, 3).map((tag) => (
                      <Tag key={tag.id} name={tag.name} color={tag.color} size="small" />
                    ))}
                    {devlog.tags.length > 3 && (
                      <span className="more-tags">+{devlog.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {devlog.quests && devlog.quests.length > 0 && (
                  <div className="devlog-quests">
                    <Icon name="quests" size={16} />
                    <span className="quest-count">{devlog.quests.length} quest{devlog.quests.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Devlog"
        message={`Are you sure you want to delete "${devlogToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteModal}
        isProcessing={isDeleting}
        variant="danger"
      />
    </div>
  )
}

export default Devlogs
