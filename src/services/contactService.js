/**
 * ========================================
 * CONTACT SERVICE
 * ========================================
 * Service for managing contact form messages and inbox
 *
 * FEATURES:
 * - Submit contact form messages
 * - Fetch messages with filtering
 * - Update message status (unread, read, replied)
 * - Delete messages
 * - Statistics for inbox
 *
 * MESSAGE STATUSES:
 * - unread: New messages not yet viewed
 * - read: Messages that have been viewed
 * - replied: Messages that have been responded to
 *
 * MESSAGE CATEGORIES:
 * - new_quest: Work or project opportunities
 * - invite_to_party: Collaboration requests
 * - seeking_knowledge: Questions about portfolio
 * - report_bug: Feedback or issues
 * - trade_offer: Exchange ideas/resources
 * - request_backup: Need help
 * - guild_recruitment: Team/partnership opportunities
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// CONSTANTS
// ========================================

export const MESSAGE_STATUS_LABELS = {
  unread: 'Unread',
  read: 'Read',
  replied: 'Replied'
}

export const MESSAGE_CATEGORY_LABELS = {
  new_quest: '⚔️ New Quest',
  invite_to_party: '🎉 Invite to Party',
  seeking_knowledge: '📚 Seeking Knowledge',
  report_bug: '🐛 Report a Bug',
  guild_recruitment: '👥 Guild Recruitment',
  general: '💬 Just Saying Hi'
}

export const MESSAGE_CATEGORY_DESCRIPTIONS = {
  new_quest: 'Work or project opportunities',
  invite_to_party: 'Collaboration requests',
  seeking_knowledge: 'Questions about my portfolio or me',
  report_bug: 'Feedback or issues with the site',
  guild_recruitment: 'Team or partnership opportunities',
  general: 'General message or just want to say hi'
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get all available message categories
 * @returns {Array<{value: string, label: string, description: string}>}
 */
export function getAllCategories() {
  return Object.keys(MESSAGE_CATEGORY_LABELS).map(value => ({
    value,
    label: MESSAGE_CATEGORY_LABELS[value],
    description: MESSAGE_CATEGORY_DESCRIPTIONS[value]
  }))
}

/**
 * Get all available message statuses
 * @returns {Array<{value: string, label: string}>}
 */
export function getAllStatuses() {
  return Object.entries(MESSAGE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label
  }))
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return emailRegex.test(email)
}

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Fetch all contact messages with optional filtering
 * @param {Object} [options] - Filter options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.category] - Filter by category
 * @param {number} [options.limit] - Limit number of results
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getAllMessages(options = {}) {
  try {
    logger.debug('Fetching all contact messages...', options)

    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.category) {
      query = query.eq('category', options.category)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching contact messages', error)
      return { data: [], error: error.message }
    }

    logger.info(`Fetched ${data.length} contact messages`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching contact messages', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch a single message by ID
 * @param {string} messageId - The message UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getMessageById(messageId) {
  try {
    logger.debug(`Fetching message: ${messageId}`)

    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (error) {
      logger.error('Error fetching message', error)
      return { data: null, error: error.message }
    }

    logger.info(`Fetched message: ${messageId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching message', err)
    return { data: null, error: err.message }
  }
}

/**
 * Get count of unread messages
 * @returns {Promise<{data: number, error: string|null}>}
 */
export async function getUnreadCount() {
  try {
    logger.debug('Fetching unread message count')

    const { count, error } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unread')

    if (error) {
      logger.error('Error fetching unread count', error)
      return { data: 0, error: error.message }
    }

    logger.info(`Unread messages: ${count}`)
    return { data: count, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching unread count', err)
    return { data: 0, error: err.message }
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Submit a new contact message
 * @param {Object} messageData - The message data
 * @param {string} messageData.email - Sender email (required)
 * @param {string} messageData.name - Sender name (required)
 * @param {string} messageData.category - Message category (required)
 * @param {string} messageData.subject - Message subject (required)
 * @param {string} messageData.message - Message content (required)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function submitMessage(messageData) {
  try {
    logger.info('Submitting new contact message')

    // Validate required fields
    if (!messageData.email || messageData.email.trim() === '') {
      return { data: null, error: 'Email is required' }
    }

    if (!isValidEmail(messageData.email)) {
      return { data: null, error: 'Please enter a valid email address' }
    }

    if (!messageData.name || messageData.name.trim() === '') {
      return { data: null, error: 'Name is required' }
    }

    if (!messageData.category) {
      return { data: null, error: 'Please select a category' }
    }

    if (!messageData.subject || messageData.subject.trim() === '') {
      return { data: null, error: 'Subject is required' }
    }

    if (!messageData.message || messageData.message.trim() === '') {
      return { data: null, error: 'Message is required' }
    }

    // Clean message data
    const cleanMessageData = {
      email: messageData.email.trim().toLowerCase(),
      name: messageData.name.trim(),
      category: messageData.category,
      subject: messageData.subject.trim(),
      message: messageData.message.trim(),
      status: 'unread'
    }

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('contact_messages')
      .insert([cleanMessageData])
      .select()
      .single()

    if (messageError) {
      logger.error('Error submitting message', messageError)
      return { data: null, error: messageError.message }
    }

    logger.info(`Message submitted successfully: ${message.id}`)
    return { data: message, error: null }
  } catch (err) {
    logger.error('Unexpected error submitting message', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update a message's status
 * @param {string} messageId - The message UUID
 * @param {string} newStatus - The new status (unread, read, replied)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateMessageStatus(messageId, newStatus) {
  try {
    logger.info(`Updating message status: ${messageId} to ${newStatus}`)

    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status: newStatus })
      .eq('id', messageId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating message status', error)
      return { data: null, error: error.message }
    }

    logger.info(`Message status updated: ${messageId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error updating message status', err)
    return { data: null, error: err.message }
  }
}

/**
 * Mark a message as read
 * @param {string} messageId - The message UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function markAsRead(messageId) {
  return updateMessageStatus(messageId, 'read')
}

/**
 * Mark a message as replied
 * @param {string} messageId - The message UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function markAsReplied(messageId) {
  return updateMessageStatus(messageId, 'replied')
}

/**
 * Mark multiple messages as read
 * @param {Array<string>} messageIds - Array of message UUIDs
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function markMultipleAsRead(messageIds) {
  try {
    logger.info(`Marking ${messageIds.length} messages as read`)

    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .in('id', messageIds)

    if (error) {
      logger.error('Error marking messages as read', error)
      return { success: false, error: error.message }
    }

    logger.info(`${messageIds.length} messages marked as read`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error marking messages as read', err)
    return { success: false, error: err.message }
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete a message by ID
 * @param {string} messageId - The message UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteMessage(messageId) {
  try {
    logger.info(`Deleting message: ${messageId}`)

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      logger.error('Error deleting message', error)
      return { success: false, error: error.message }
    }

    logger.info(`Message deleted successfully: ${messageId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting message', err)
    return { success: false, error: err.message }
  }
}

// ========================================
// STATISTICS
// ========================================

/**
 * Get inbox statistics
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getInboxStatistics() {
  try {
    logger.debug('Fetching inbox statistics')

    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('id, status, category')

    if (error) {
      logger.error('Error fetching inbox statistics', error)
      return { data: null, error: error.message }
    }

    const stats = {
      total: messages.length,
      by_status: {
        unread: messages.filter(m => m.status === 'unread').length,
        read: messages.filter(m => m.status === 'read').length,
        replied: messages.filter(m => m.status === 'replied').length
      },
      by_category: {}
    }

    // Count by category
    Object.keys(MESSAGE_CATEGORY_LABELS).forEach(category => {
      stats.by_category[category] = messages.filter(m => m.category === category).length
    })

    logger.info('Fetched inbox statistics')
    return { data: stats, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching inbox statistics', err)
    return { data: null, error: err.message }
  }
}
