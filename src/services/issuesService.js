/**
 * ========================================
 * ISSUES SERVICE
 * ========================================
 * Service for managing bugs and improvements in the database
 *
 * FEATURES:
 * - CRUD operations for issues
 * - Polymorphic attachment to projects or quests
 * - Status tracking and sorting
 * - Severity management for bugs
 *
 * ISSUE TYPES:
 * - bug: Bugs with severity levels (critical, major, minor)
 * - improvement: Enhancement requests (no severity)
 *
 * NOTE: Features are NOT issues - they should be Future Quests
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_ORDER,
  ISSUE_SEVERITY_CONFIG,
  ISSUE_TYPE_LABELS,
  sortIssuesByStatus,
  groupIssuesByCompletion
} from '../types/database'

// Re-export useful functions from types
export {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_ORDER,
  ISSUE_SEVERITY_CONFIG,
  ISSUE_TYPE_LABELS,
  sortIssuesByStatus,
  groupIssuesByCompletion
}

// ========================================
// STATUS & TYPE HELPERS
// ========================================

/**
 * Get all available issue statuses
 * @returns {Array<{value: string, label: string, order: number}>}
 */
export function getAllIssueStatuses() {
  return Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
    order: ISSUE_STATUS_ORDER[value]
  })).sort((a, b) => a.order - b.order)
}

/**
 * Get all available issue types
 * @returns {Array<{value: string, label: string}>}
 */
export function getAllIssueTypes() {
  return Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }))
}

/**
 * Get all available severity levels
 * @returns {Array<{value: string, label: string, color: string}>}
 */
export function getAllSeverityLevels() {
  return Object.entries(ISSUE_SEVERITY_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
    color: config.color
  }))
}

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Fetch all issues with optional filtering
 * @param {Object} [options] - Filter options
 * @param {string} [options.attachedToType] - Filter by 'project' or 'quest'
 * @param {string} [options.attachedToId] - Filter by specific project/quest ID
 * @param {string} [options.issueType] - Filter by 'bug' or 'improvement'
 * @param {string} [options.status] - Filter by specific status
 * @param {boolean} [options.activeOnly=false] - Only return non-complete issues
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getAllIssues(options = {}) {
  try {
    logger.debug('Fetching all issues...', options)

    let query = supabase
      .from('issues')
      .select('*')
      .order('updated_at', { ascending: false })

    // Apply filters
    if (options.attachedToType) {
      query = query.eq('attached_to_type', options.attachedToType)
    }

    if (options.attachedToId) {
      query = query.eq('attached_to_id', options.attachedToId)
    }

    if (options.issueType) {
      query = query.eq('issue_type', options.issueType)
    }

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.activeOnly) {
      query = query.not('status', 'in', '("done","cancelled")')
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching issues', error)
      return { data: [], error: error.message }
    }

    // Sort by status order
    const sortedData = sortIssuesByStatus(data)

    logger.info(`Fetched ${sortedData.length} issues`)
    return { data: sortedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching issues', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch issues for a specific project (including cascaded from quests)
 * @param {string} projectId - The project UUID
 * @param {Object} [options] - Filter options
 * @param {boolean} [options.includeCascaded=true] - Include issues from project's quests
 * @param {boolean} [options.activeOnly=false] - Only return non-complete issues
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getProjectIssues(projectId, options = {}) {
  try {
    logger.debug(`Fetching issues for project: ${projectId}`, options)

    const includeCascaded = options.includeCascaded !== false

    // Get issues directly attached to project
    const { data: directIssues, error: directError } = await supabase
      .from('issues')
      .select('*')
      .eq('attached_to_type', 'project')
      .eq('attached_to_id', projectId)

    if (directError) {
      logger.error('Error fetching direct project issues', directError)
      return { data: [], error: directError.message }
    }

    let allIssues = [...directIssues]

    // Get issues from project's quests (cascaded)
    if (includeCascaded) {
      // First get all quest IDs for this project
      const { data: quests, error: questError } = await supabase
        .from('quests')
        .select('id')
        .eq('project_id', projectId)

      if (questError) {
        logger.warn('Error fetching project quests for issue cascade', questError)
      } else if (quests && quests.length > 0) {
        const questIds = quests.map(q => q.id)

        const { data: questIssues, error: questIssueError } = await supabase
          .from('issues')
          .select('*')
          .eq('attached_to_type', 'quest')
          .in('attached_to_id', questIds)

        if (questIssueError) {
          logger.warn('Error fetching cascaded quest issues', questIssueError)
        } else {
          allIssues = [...allIssues, ...questIssues]
        }
      }
    }

    // Filter active only if requested
    if (options.activeOnly) {
      allIssues = allIssues.filter(issue =>
        issue.status !== 'done' && issue.status !== 'cancelled'
      )
    }

    // Sort by status order
    const sortedData = sortIssuesByStatus(allIssues)

    logger.info(`Fetched ${sortedData.length} issues for project: ${projectId}`)
    return { data: sortedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching project issues', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch issues for a specific quest
 * @param {string} questId - The quest UUID
 * @param {Object} [options] - Filter options
 * @param {boolean} [options.activeOnly=false] - Only return non-complete issues
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getQuestIssues(questId, options = {}) {
  return getAllIssues({
    attachedToType: 'quest',
    attachedToId: questId,
    activeOnly: options.activeOnly
  })
}

/**
 * Fetch a single issue by ID
 * @param {string} issueId - The issue UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getIssueById(issueId) {
  try {
    logger.debug(`Fetching issue: ${issueId}`)

    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single()

    if (error) {
      logger.error('Error fetching issue', error)
      return { data: null, error: error.message }
    }

    logger.info(`Fetched issue: ${issueId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching issue', err)
    return { data: null, error: err.message }
  }
}

/**
 * Fetch issue history (all devlogs that touched this issue)
 * @param {string} issueId - The issue UUID
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getIssueHistory(issueId) {
  try {
    logger.debug(`Fetching history for issue: ${issueId}`)

    const { data, error } = await supabase
      .from('devlog_issues')
      .select(`
        *,
        pages:devlog_id (
          id, title, slug, created_at
        )
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching issue history', error)
      return { data: [], error: error.message }
    }

    logger.info(`Fetched ${data.length} history entries for issue: ${issueId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching issue history', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Create a new issue
 * @param {Object} issueData - The issue data
 * @param {string} issueData.attached_to_type - 'project' or 'quest'
 * @param {string} issueData.attached_to_id - UUID of project or quest
 * @param {string} issueData.issue_type - 'bug' or 'improvement'
 * @param {string} issueData.title - Issue title (required)
 * @param {string} [issueData.description] - Issue description
 * @param {string} [issueData.severity] - Required for bugs: 'critical', 'major', 'minor'
 * @param {string} [issueData.status='open'] - Initial status
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createIssue(issueData) {
  try {
    logger.info('Creating new issue:', issueData.title)

    // Validate required fields
    if (!issueData.title || issueData.title.trim() === '') {
      return { data: null, error: 'Issue title is required' }
    }

    if (!issueData.attached_to_type || !issueData.attached_to_id) {
      return { data: null, error: 'Issue must be attached to a project or quest' }
    }

    if (!issueData.issue_type) {
      return { data: null, error: 'Issue type is required' }
    }

    // Validate bug requires severity
    if (issueData.issue_type === 'bug' && !issueData.severity) {
      return { data: null, error: 'Bugs require a severity level' }
    }

    // Validate improvement should not have severity
    if (issueData.issue_type === 'improvement' && issueData.severity) {
      logger.warn('Improvements should not have severity, removing it')
      delete issueData.severity
    }

    // Clean issue data
    const cleanIssueData = {
      attached_to_type: issueData.attached_to_type,
      attached_to_id: issueData.attached_to_id,
      issue_type: issueData.issue_type,
      title: issueData.title.trim(),
      status: issueData.status || 'open'
    }

    if (issueData.description && issueData.description.trim() !== '') {
      cleanIssueData.description = issueData.description.trim()
    }

    if (issueData.severity) {
      cleanIssueData.severity = issueData.severity
    }

    // Insert the issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert([cleanIssueData])
      .select()
      .single()

    if (issueError) {
      logger.error('Error creating issue', issueError)
      return { data: null, error: issueError.message }
    }

    logger.info(`Issue created successfully: ${issue.id}`)
    return { data: issue, error: null }
  } catch (err) {
    logger.error('Unexpected error creating issue', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update an existing issue
 * @param {string} issueId - The issue UUID
 * @param {Object} issueData - The updated issue data
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateIssue(issueId, issueData) {
  try {
    logger.info(`Updating issue: ${issueId}`)

    // Validate severity if changing issue type
    if (issueData.issue_type === 'improvement' && issueData.severity) {
      logger.warn('Removing severity from improvement')
      issueData.severity = null
    }

    const { data, error } = await supabase
      .from('issues')
      .update(issueData)
      .eq('id', issueId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating issue', error)
      return { data: null, error: error.message }
    }

    logger.info(`Issue updated successfully: ${issueId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error updating issue', err)
    return { data: null, error: err.message }
  }
}

/**
 * Update issue status
 * @param {string} issueId - The issue UUID
 * @param {string} newStatus - The new status
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateIssueStatus(issueId, newStatus) {
  return updateIssue(issueId, { status: newStatus })
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete an issue by ID
 * Note: This will cascade delete related devlog_issues entries
 * @param {string} issueId - The issue UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteIssue(issueId) {
  try {
    logger.info(`Deleting issue: ${issueId}`)

    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId)

    if (error) {
      logger.error('Error deleting issue', error)
      return { success: false, error: error.message }
    }

    logger.info(`Issue deleted successfully: ${issueId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting issue', err)
    return { success: false, error: err.message }
  }
}

// ========================================
// STATISTICS
// ========================================

/**
 * Get issue statistics for a project or quest
 * @param {string} attachedToType - 'project' or 'quest'
 * @param {string} attachedToId - UUID of project or quest
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getIssueStatistics(attachedToType, attachedToId) {
  try {
    logger.debug(`Fetching issue statistics for ${attachedToType}: ${attachedToId}`)

    const { data: issues, error } = await supabase
      .from('issues')
      .select('id, status, issue_type, severity')
      .eq('attached_to_type', attachedToType)
      .eq('attached_to_id', attachedToId)

    if (error) {
      logger.error('Error fetching issue statistics', error)
      return { data: null, error: error.message }
    }

    const stats = {
      total: issues.length,
      by_status: {
        open: issues.filter(i => i.status === 'open').length,
        in_progress: issues.filter(i => i.status === 'in_progress').length,
        blocked: issues.filter(i => i.status === 'blocked').length,
        done: issues.filter(i => i.status === 'done').length,
        postponed: issues.filter(i => i.status === 'postponed').length,
        cancelled: issues.filter(i => i.status === 'cancelled').length
      },
      by_type: {
        bug: issues.filter(i => i.issue_type === 'bug').length,
        improvement: issues.filter(i => i.issue_type === 'improvement').length
      },
      bugs_by_severity: {
        critical: issues.filter(i => i.issue_type === 'bug' && i.severity === 'critical').length,
        major: issues.filter(i => i.issue_type === 'bug' && i.severity === 'major').length,
        minor: issues.filter(i => i.issue_type === 'bug' && i.severity === 'minor').length
      },
      active_count: issues.filter(i => !['done', 'cancelled'].includes(i.status)).length,
      completion_rate: issues.length > 0
        ? Math.round((issues.filter(i => i.status === 'done').length / issues.length) * 100)
        : 0
    }

    logger.info(`Fetched issue statistics for ${attachedToType}: ${attachedToId}`)
    return { data: stats, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching issue statistics', err)
    return { data: null, error: err.message }
  }
}
