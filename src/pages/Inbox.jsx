/**
 * ========================================
 * INBOX PAGE (Admin)
 * ========================================
 * Inbox view for managing contact form messages
 *
 * FEATURES:
 * - List all messages with status indicators
 * - Filter by status (unread/read/replied) and category
 * - View message details in modal
 * - Mark as read/replied
 * - Delete messages with confirmation
 * - Display category badges with RPG theme
 * - Shows unread count
 */

import { useState, useEffect } from 'react'
import {
  getAllMessages,
  deleteMessage,
  updateMessageStatus,
  getUnreadCount,
  MESSAGE_STATUS_LABELS,
  MESSAGE_CATEGORY_LABELS
} from '../services/contactService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import ConfirmModal from '../components/ConfirmModal'
import './Inbox.css'

// ========================================
// CATEGORY CONFIGURATION
// ========================================

const CATEGORY_CONFIG = {
  new_quest: { icon: 'sword', color: '#3498db' },
  invite_to_party: { icon: 'users', color: '#9b59b6' },
  seeking_knowledge: { icon: 'inspect-code', color: '#f39c12' },
  report_bug: { icon: 'bug', color: '#e74c3c' },
  guild_recruitment: { icon: 'users', color: '#1abc9c' },
  general: { icon: 'mail', color: '#95a5a6' }
}

const STATUS_CONFIG = {
  unread: { label: 'Unread', color: '#3498db', icon: 'mail' },
  read: { label: 'Read', color: '#95a5a6', icon: 'done' },
  replied: { label: 'Replied', color: '#2ecc71', icon: 'done-all' }
}

// ========================================
// INBOX COMPONENT
// ========================================

function Inbox() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Messages data
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Filtering
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  // Message detail modal
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch all messages from the database
   */
  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info('Fetching messages...')

      const options = {}
      if (filterStatus !== 'all') {
        options.status = filterStatus
      }
      if (filterCategory !== 'all') {
        options.category = filterCategory
      }

      const { data, error: fetchError } = await getAllMessages(options)

      if (fetchError) {
        throw new Error(fetchError)
      }

      setMessages(data)
      logger.info(`Fetched ${data.length} messages`)
    } catch (err) {
      logger.error('Failed to fetch messages', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = async () => {
    const { data } = await getUnreadCount()
    setUnreadCount(data)
  }

  /**
   * Initial data load
   */
  useEffect(() => {
    fetchMessages()
    fetchUnreadCount()
  }, [filterStatus, filterCategory])

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Open message detail modal
   */
  const handleViewMessage = async (message) => {
    setSelectedMessage(message)
    setShowMessageModal(true)

    // Mark as read if it's unread
    if (message.status === 'unread') {
      await handleUpdateStatus(message.id, 'read')
    }
  }

  /**
   * Update message status
   */
  const handleUpdateStatus = async (messageId, newStatus) => {
    try {
      const { error } = await updateMessageStatus(messageId, newStatus)

      if (error) {
        throw new Error(error)
      }

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, status: newStatus } : msg
        )
      )

      // Update selected message if it's open
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage(prev => ({ ...prev, status: newStatus }))
      }

      // Refresh unread count
      fetchUnreadCount()

      logger.info(`Message status updated to ${newStatus}`)
    } catch (err) {
      logger.error('Failed to update message status', err)
      alert(`Error: ${err.message}`)
    }
  }

  /**
   * Confirm delete action
   */
  const handleDeleteClick = (message) => {
    setMessageToDelete(message)
    setShowDeleteModal(true)
  }

  /**
   * Delete message
   */
  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return

    try {
      setIsDeleting(true)

      logger.info(`Deleting message: ${messageToDelete.id}`)

      const { success, error: deleteError } = await deleteMessage(messageToDelete.id)

      if (!success || deleteError) {
        throw new Error(deleteError || 'Failed to delete message')
      }

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageToDelete.id))

      // Close modals
      setShowDeleteModal(false)
      setShowMessageModal(false)
      setMessageToDelete(null)

      // Refresh unread count
      fetchUnreadCount()

      logger.info('Message deleted successfully')
    } catch (err) {
      logger.error('Failed to delete message', err)
      alert(`Error: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // ========================================
  // FILTERED MESSAGES
  // ========================================

  const filteredMessages = messages

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="inbox-page">
      {/* ========================================
       * PAGE HEADER
       * ======================================== */}
      <div className="inbox-header">
        <div className="inbox-header-title">
          <Icon name="mail" size={32} />
          <h1>Inbox</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
      </div>

      {/* ========================================
       * FILTERS
       * ======================================== */}
      <div className="inbox-filters">
        <div className="filter-group">
          <label htmlFor="filter-status">
            <Icon name="filter" size={18} />
            Status
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-category">
            <Icon name="inspect-code" size={18} />
            Category
          </label>
          <select
            id="filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {Object.entries(MESSAGE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="refresh-button"
          onClick={() => { fetchMessages(); fetchUnreadCount(); }}
          disabled={isLoading}
        >
          <Icon name="loop" size={18} />
          Refresh
        </button>
      </div>

      {/* ========================================
       * LOADING STATE
       * ======================================== */}
      {isLoading && (
        <div className="inbox-loading">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      )}

      {/* ========================================
       * ERROR STATE
       * ======================================== */}
      {error && !isLoading && (
        <div className="inbox-error">
          <Icon name="bug" size={32} />
          <p>Error: {error}</p>
          <button onClick={fetchMessages}>Try Again</button>
        </div>
      )}

      {/* ========================================
       * MESSAGES LIST
       * ======================================== */}
      {!isLoading && !error && (
        <div className="inbox-content">
          {filteredMessages.length === 0 ? (
            <div className="inbox-empty">
              <Icon name="mail" size={48} />
              <h3>No messages found</h3>
              <p>Your inbox is empty or no messages match the current filters.</p>
            </div>
          ) : (
            <div className="messages-list">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`message-item ${message.status === 'unread' ? 'unread' : ''}`}
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="message-icon">
                    <Icon
                      name={CATEGORY_CONFIG[message.category]?.icon || 'mail'}
                      size={24}
                    />
                  </div>

                  <div className="message-content">
                    <div className="message-header">
                      <h3 className="message-subject">{message.subject}</h3>
                      <span className="message-date">{formatDate(message.created_at)}</span>
                    </div>

                    <div className="message-meta">
                      <span className="message-sender">
                        <Icon name="user" size={14} />
                        {message.name}
                      </span>
                      <span className="message-email">
                        <Icon name="mail" size={14} />
                        {message.email}
                      </span>
                    </div>

                    <div className="message-badges">
                      <span
                        className="status-badge"
                        style={{ borderColor: STATUS_CONFIG[message.status]?.color }}
                      >
                        {STATUS_CONFIG[message.status]?.label}
                      </span>
                      <span
                        className="category-badge"
                        style={{ borderColor: CATEGORY_CONFIG[message.category]?.color }}
                      >
                        {MESSAGE_CATEGORY_LABELS[message.category]}
                      </span>
                    </div>
                  </div>

                  <div className="message-actions">
                    <button
                      className="action-button action-button--delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(message)
                      }}
                      title="Delete message"
                    >
                      <Icon name="trash-can" size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================
       * MESSAGE DETAIL MODAL
       * ======================================== */}
      {showMessageModal && selectedMessage && (
        <div className="message-modal-backdrop" onClick={() => setShowMessageModal(false)}>
          <div className="message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="message-modal-header">
              <div>
                <h2>{selectedMessage.subject}</h2>
                <div className="message-modal-meta">
                  <span>
                    <Icon name="user" size={16} />
                    {selectedMessage.name}
                  </span>
                  <span>
                    <Icon name="mail" size={16} />
                    {selectedMessage.email}
                  </span>
                  <span>
                    <Icon name="calendar" size={16} />
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                className="modal-close-button"
                onClick={() => setShowMessageModal(false)}
              >
                <Icon name="cross" size={24} />
              </button>
            </div>

            <div className="message-modal-badges">
              <span
                className="status-badge"
                style={{ borderColor: STATUS_CONFIG[selectedMessage.status]?.color }}
              >
                {STATUS_CONFIG[selectedMessage.status]?.label}
              </span>
              <span
                className="category-badge"
                style={{ borderColor: CATEGORY_CONFIG[selectedMessage.category]?.color }}
              >
                {MESSAGE_CATEGORY_LABELS[selectedMessage.category]}
              </span>
            </div>

            <div className="message-modal-body">
              <h3>Message:</h3>
              <p>{selectedMessage.message}</p>
            </div>

            <div className="message-modal-footer">
              <button
                className="button button--danger"
                onClick={() => handleDeleteClick(selectedMessage)}
              >
                <Icon name="trash-can" size={18} />
                Delete
              </button>

              {selectedMessage.status === 'unread' && (
                <button
                  className="button button--secondary"
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                >
                  <Icon name="done" size={18} />
                  Mark as Read
                </button>
              )}

              {selectedMessage.status !== 'replied' && (
                <button
                  className="button button--primary"
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                >
                  <Icon name="done-all" size={18} />
                  Mark as Replied
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================
       * DELETE CONFIRMATION MODAL
       * ======================================== */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Message"
        message={`Are you sure you want to delete this message from ${messageToDelete?.name}?`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false)
          setMessageToDelete(null)
        }}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default Inbox
