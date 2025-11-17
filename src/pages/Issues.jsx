/**
 * ========================================
 * ISSUES MANAGEMENT PAGE (Admin)
 * ========================================
 * List view for managing bugs and improvements
 *
 * FEATURES:
 * - List all issues with sorting by status
 * - Filter by type (bug/improvement) and status
 * - Create new issues
 * - Edit existing issues
 * - Delete issues with confirmation
 * - Shows severity badges for bugs
 * - Displays attached quest/project info
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAllIssues,
  deleteIssue,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPE_LABELS,
  ISSUE_SEVERITY_CONFIG
} from '../services/issuesService'
import { getAllQuests } from '../services/questsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import ConfirmModal from '../components/ConfirmModal'
import './Issues.css'

// ========================================
// ISSUE CONFIGURATION
// ========================================

/**
 * Issue type display configuration
 */
const ISSUE_TYPES = {
  bug: { label: 'Bug', icon: 'bug', color: '#e74c3c' },
  improvement: { label: 'Improvement', icon: 'upgrade', color: '#3498db' }
}

/**
 * Issue status display configuration
 */
const ISSUE_STATUSES = {
  in_progress: { label: ISSUE_STATUS_LABELS.in_progress, color: '#f39c12' },
  blocked: { label: ISSUE_STATUS_LABELS.blocked, color: '#e74c3c' },
  postponed: { label: ISSUE_STATUS_LABELS.postponed, color: '#9b59b6' },
  open: { label: ISSUE_STATUS_LABELS.open, color: '#3498db' },
  done: { label: ISSUE_STATUS_LABELS.done, color: '#2ecc71' },
  cancelled: { label: ISSUE_STATUS_LABELS.cancelled, color: '#7f8c8d' }
}

// ========================================
// ISSUES COMPONENT
// ========================================

function Issues() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Issues data
  const [issues, setIssues] = useState([])
  const [quests, setQuests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtering
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Navigation
  const navigate = useNavigate()

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch all issues from the database
   */
  const fetchIssues = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info('Fetching issues...')

      const options = {}
      if (filterType !== 'all') {
        options.issueType = filterType
      }
      if (filterStatus !== 'all') {
        options.status = filterStatus
      }

      const { data, error: fetchError } = await getAllIssues(options)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching issues', fetchError)
      } else {
        setIssues(data)
        logger.info(`Loaded ${data.length} issues`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching issues', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fetch quests for displaying attached info
   */
  const fetchQuests = async () => {
    try {
      const { data } = await getAllQuests()
      setQuests(data || [])
    } catch (err) {
      logger.error('Error fetching quests', err)
    }
  }

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchIssues()
  }, [filterType, filterStatus])

  useEffect(() => {
    fetchQuests()
  }, [])

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Navigate to create new issue
   */
  const handleCreateIssue = () => {
    navigate('/admin/issues/new')
  }

  /**
   * Navigate to edit issue
   * @param {string} issueId - Issue UUID
   */
  const handleEditIssue = (issueId) => {
    navigate(`/admin/issues/${issueId}/edit`)
  }

  /**
   * Open delete confirmation modal
   * @param {Object} issue - Issue object
   */
  const handleDeleteClick = (issue) => {
    setIssueToDelete(issue)
    setShowDeleteModal(true)
  }

  /**
   * Confirm issue deletion
   */
  const handleConfirmDelete = async () => {
    if (!issueToDelete) return

    try {
      setIsDeleting(true)
      logger.info(`Deleting issue: ${issueToDelete.id}`)

      const { success, error: deleteError } = await deleteIssue(issueToDelete.id)

      if (deleteError) {
        setError(deleteError)
        logger.error('Error deleting issue', deleteError)
      } else if (success) {
        logger.info(`Issue deleted successfully: ${issueToDelete.id}`)
        // Refresh the list
        await fetchIssues()
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error deleting issue', err)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setIssueToDelete(null)
    }
  }

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setIssueToDelete(null)
  }

  /**
   * Handle type filter change
   * @param {string} type - Issue type to filter by
   */
  const handleTypeFilterChange = (type) => {
    setFilterType(type)
  }

  /**
   * Handle status filter change
   * @param {string} status - Issue status to filter by
   */
  const handleStatusFilterChange = (status) => {
    setFilterStatus(status)
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

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

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  /**
   * Get attached entity name
   * @param {Object} issue - Issue object
   * @returns {string} - Entity name
   */
  const getAttachedName = (issue) => {
    if (issue.attached_to_type === 'quest') {
      const quest = quests.find(q => q.id === issue.attached_to_id)
      return quest ? quest.title : 'Unknown Quest'
    }
    return 'Project'
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="issues-container">
      {/* Page Header */}
      <div className="issues-header">
        <div className="issues-title-section">
          <Icon name="bug" size={48} />
          <div>
            <h1>Issues</h1>
            <p className="issues-subtitle">Track bugs and improvements</p>
          </div>
        </div>

        <button
          className="create-button"
          onClick={handleCreateIssue}
          title="Create new issue"
        >
          <Icon name="plus" size={24} />
          <span>New Issue</span>
        </button>
      </div>

      {/* Filters */}
      <div className="issues-filters">
        {/* Type Filter */}
        <div className="filter-group">
          <span className="filter-label">Type:</span>
          <div className="filter-buttons">
            <button
              className={`filter-button ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleTypeFilterChange('all')}
            >
              All
            </button>
            {Object.entries(ISSUE_TYPES).map(([type, config]) => (
              <button
                key={type}
                className={`filter-button ${filterType === type ? 'active' : ''}`}
                onClick={() => handleTypeFilterChange(type)}
              >
                <Icon name={config.icon} size={18} />
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          <div className="filter-buttons">
            <button
              className={`filter-button ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('all')}
            >
              All
            </button>
            <button
              className={`filter-button ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('active')}
            >
              Active
            </button>
            <button
              className={`filter-button ${filterStatus === 'done' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('done')}
            >
              Done
            </button>
          </div>
        </div>

        <div className="issues-count">
          {!isLoading && <span>{issues.length} issue{issues.length !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <Icon name="cross" size={24} />
          <span>{error}</span>
          <button onClick={fetchIssues} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading issues...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && issues.length === 0 && (
        <div className="empty-state">
          <Icon name="bug" size={64} />
          <h2>No issues yet</h2>
          <p>
            {filterType === 'all' && filterStatus === 'all'
              ? 'Track your bugs and improvements by creating an issue!'
              : 'No issues match your current filters.'}
          </p>
          <button className="create-button" onClick={handleCreateIssue}>
            <Icon name="plus" size={24} />
            <span>Create Issue</span>
          </button>
        </div>
      )}

      {/* Issues List */}
      {!isLoading && !error && issues.length > 0 && (
        <div className="issues-list">
          {issues.map((issue) => {
            const typeConfig = ISSUE_TYPES[issue.issue_type] || ISSUE_TYPES.bug
            const statusConfig = ISSUE_STATUSES[issue.status] || ISSUE_STATUSES.open
            const severityConfig = issue.severity ? ISSUE_SEVERITY_CONFIG[issue.severity] : null

            return (
              <div key={issue.id} className="issue-item">
                {/* Issue Type Badge */}
                <div
                  className="issue-type-badge"
                  style={{ backgroundColor: typeConfig.color }}
                >
                  <Icon name={typeConfig.icon} size={24} />
                  <span>{typeConfig.label}</span>
                </div>

                {/* Issue Info */}
                <div className="issue-info">
                  <h3 className="issue-title">
                    {issue.title}
                  </h3>

                  <div className="issue-meta">
                    <span
                      className="issue-status-badge"
                      style={{ borderColor: statusConfig.color, color: statusConfig.color }}
                    >
                      {statusConfig.label}
                    </span>

                    {severityConfig && (
                      <span
                        className="issue-severity-badge"
                        style={{ backgroundColor: severityConfig.color }}
                      >
                        {severityConfig.label}
                      </span>
                    )}

                    <span className="issue-attached">
                      <Icon name={issue.attached_to_type === 'quest' ? 'quests' : 'castle'} size={16} />
                      {getAttachedName(issue)}
                    </span>

                    <span className="issue-date">
                      <Icon name="time" size={16} />
                      {formatTimeAgo(issue.updated_at)}
                    </span>
                  </div>

                  {/* Description */}
                  {issue.description && (
                    <p className="issue-description">
                      {issue.description.length > 150
                        ? `${issue.description.substring(0, 150)}...`
                        : issue.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="issue-actions">
                  <button
                    className="action-button edit"
                    onClick={() => handleEditIssue(issue.id)}
                    title="Edit issue"
                  >
                    <Icon name="edit-pencil" size={20} />
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => handleDeleteClick(issue)}
                    title="Delete issue"
                  >
                    <Icon name="trash-can" size={20} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Issue"
        message={`Are you sure you want to delete "${issueToDelete?.title}"? This will also remove all devlog history for this issue. This action cannot be undone.`}
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

export default Issues
