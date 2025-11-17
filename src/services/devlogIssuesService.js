/**
 * ========================================
 * DEVLOG ISSUES SERVICE
 * ========================================
 * Service for managing the relationship between devlogs and issues
 *
 * FEATURES:
 * - Track which issues were worked on in each devlog
 * - Record status changes made in devlog sessions
 * - Store work notes for each issue in each devlog
 * - Query issue history across devlogs
 * - Organize issues by devlog sections (completed, in progress, etc.)
 *
 * DEVLOG ISSUE SECTIONS:
 * - Completed in this devlog (status changed to 'done' or 'cancelled')
 * - In progress (status changed to 'in_progress' or worked on)
 * - Newly added (issues created and linked to this devlog)
 * - Still outstanding (existing issues not touched in this devlog)
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { sortIssuesByStatus, isIssueComplete } from '../types/database'

// ========================================
// LINK/UNLINK OPERATIONS
// ========================================

/**
 * Link an issue to a devlog with optional status change and notes
 * @param {string} devlogId - The devlog page UUID
 * @param {string} issueId - The issue UUID
 * @param {Object} [workData] - Work tracking data
 * @param {string} [workData.status_change] - Status change made in this session
 * @param {string} [workData.work_notes] - Notes about work done
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function linkIssueToDevlog(devlogId, issueId, workData = {}) {
  try {
    logger.info(`Linking issue ${issueId} to devlog ${devlogId}`)

    const insertData = {
      devlog_id: devlogId,
      issue_id: issueId
    }

    if (workData.status_change) {
      insertData.status_change = workData.status_change
    }

    if (workData.work_notes && workData.work_notes.trim() !== '') {
      insertData.work_notes = workData.work_notes.trim()
    }

    const { data, error } = await supabase
      .from('devlog_issues')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        logger.warn('Issue already linked to this devlog')
        return { data: null, error: 'Issue is already linked to this devlog' }
      }
      logger.error('Error linking issue to devlog', error)
      return { data: null, error: error.message }
    }

    logger.info(`Issue linked successfully: ${data.id}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error linking issue to devlog', err)
    return { data: null, error: err.message }
  }
}

/**
 * Update the devlog-issue relationship (notes, status change)
 * @param {string} devlogIssueId - The devlog_issues junction table UUID
 * @param {Object} updateData - Data to update
 * @param {string} [updateData.status_change] - Updated status change
 * @param {string} [updateData.work_notes] - Updated work notes
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateDevlogIssue(devlogIssueId, updateData) {
  try {
    logger.info(`Updating devlog-issue: ${devlogIssueId}`)

    const { data, error } = await supabase
      .from('devlog_issues')
      .update(updateData)
      .eq('id', devlogIssueId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating devlog-issue', error)
      return { data: null, error: error.message }
    }

    logger.info(`Devlog-issue updated successfully: ${devlogIssueId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error updating devlog-issue', err)
    return { data: null, error: err.message }
  }
}

/**
 * Unlink an issue from a devlog
 * @param {string} devlogId - The devlog page UUID
 * @param {string} issueId - The issue UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function unlinkIssueFromDevlog(devlogId, issueId) {
  try {
    logger.info(`Unlinking issue ${issueId} from devlog ${devlogId}`)

    const { error } = await supabase
      .from('devlog_issues')
      .delete()
      .eq('devlog_id', devlogId)
      .eq('issue_id', issueId)

    if (error) {
      logger.error('Error unlinking issue from devlog', error)
      return { success: false, error: error.message }
    }

    logger.info('Issue unlinked successfully')
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error unlinking issue from devlog', err)
    return { success: false, error: err.message }
  }
}

/**
 * Bulk link multiple issues to a devlog
 * @param {string} devlogId - The devlog page UUID
 * @param {Array<{issue_id: string, status_change?: string, work_notes?: string}>} issues
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function bulkLinkIssuesToDevlog(devlogId, issues) {
  try {
    logger.info(`Bulk linking ${issues.length} issues to devlog ${devlogId}`)

    const insertData = issues.map(issue => ({
      devlog_id: devlogId,
      issue_id: issue.issue_id,
      status_change: issue.status_change || null,
      work_notes: issue.work_notes?.trim() || null
    }))

    const { data, error } = await supabase
      .from('devlog_issues')
      .insert(insertData)
      .select()

    if (error) {
      logger.error('Error bulk linking issues to devlog', error)
      return { data: [], error: error.message }
    }

    logger.info(`Successfully linked ${data.length} issues to devlog`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error bulk linking issues', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Get all issues worked on in a specific devlog
 * @param {string} devlogId - The devlog page UUID
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getDevlogIssues(devlogId) {
  try {
    logger.debug(`Fetching issues for devlog: ${devlogId}`)

    const { data, error } = await supabase
      .from('devlog_issues')
      .select(`
        *,
        issues:issue_id (
          id, attached_to_type, attached_to_id, issue_type, severity,
          title, description, status, created_at, updated_at
        )
      `)
      .eq('devlog_id', devlogId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching devlog issues', error)
      return { data: [], error: error.message }
    }

    // Transform data to include both devlog-issue info and issue details
    const transformedData = data.map(di => ({
      ...di,
      issue: di.issues
    })).filter(di => di.issue !== null)

    logger.info(`Fetched ${transformedData.length} issues for devlog: ${devlogId}`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching devlog issues', err)
    return { data: [], error: err.message }
  }
}

/**
 * Get devlog issues organized by sections for display
 * @param {string} devlogId - The devlog page UUID
 * @param {string} attachedToType - 'project' or 'quest' that the devlog is connected to
 * @param {string} attachedToId - UUID of the project or quest
 * @returns {Promise<{data: Object, error: string|null}>}
 */
export async function getDevlogIssuesSectioned(devlogId, attachedToType, attachedToId) {
  try {
    logger.debug(`Fetching sectioned issues for devlog: ${devlogId}`)

    // Get issues worked on in this devlog
    const { data: devlogIssueLinks, error: linkError } = await getDevlogIssues(devlogId)

    if (linkError) {
      return { data: {}, error: linkError }
    }

    // Get all issues for the attached project/quest
    const { data: allIssues, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .eq('attached_to_type', attachedToType)
      .eq('attached_to_id', attachedToId)

    if (issuesError) {
      logger.error('Error fetching all issues for sectioning', issuesError)
      return { data: {}, error: issuesError.message }
    }

    // Create lookup map for devlog work
    const devlogWorkMap = new Map()
    devlogIssueLinks.forEach(link => {
      devlogWorkMap.set(link.issue_id, link)
    })

    // Categorize issues
    const sections = {
      completed_in_devlog: [],
      in_progress: [],
      newly_added: [],
      still_outstanding: []
    }

    // Get devlog creation time for "newly added" comparison
    const { data: devlog } = await supabase
      .from('pages')
      .select('created_at')
      .eq('id', devlogId)
      .single()

    const devlogCreatedAt = devlog ? new Date(devlog.created_at) : new Date()

    allIssues.forEach(issue => {
      const devlogWork = devlogWorkMap.get(issue.id)

      if (devlogWork) {
        // Issue was worked on in this devlog
        const enrichedIssue = {
          ...issue,
          devlog_work: {
            id: devlogWork.id,
            status_change: devlogWork.status_change,
            work_notes: devlogWork.work_notes,
            created_at: devlogWork.created_at
          }
        }

        // Check if completed in this devlog
        if (devlogWork.status_change === 'done' || devlogWork.status_change === 'cancelled') {
          sections.completed_in_devlog.push(enrichedIssue)
        }
        // Check if in progress
        else if (devlogWork.status_change === 'in_progress' || devlogWork.work_notes) {
          sections.in_progress.push(enrichedIssue)
        }
        // Check if newly added (created after devlog started)
        else if (new Date(issue.created_at) >= devlogCreatedAt) {
          sections.newly_added.push(enrichedIssue)
        }
        // Otherwise just worked on
        else {
          sections.in_progress.push(enrichedIssue)
        }
      } else if (!isIssueComplete(issue.status)) {
        // Issue not touched in this devlog and still outstanding
        sections.still_outstanding.push(issue)
      }
    })

    // Sort each section by status order
    Object.keys(sections).forEach(key => {
      sections[key] = sortIssuesByStatus(sections[key])
    })

    logger.info(`Sectioned issues for devlog: ${devlogId}`)
    return { data: sections, error: null }
  } catch (err) {
    logger.error('Unexpected error getting sectioned devlog issues', err)
    return { data: {}, error: err.message }
  }
}

/**
 * Get all devlogs that touched a specific issue
 * @param {string} issueId - The issue UUID
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getIssueDevlogHistory(issueId) {
  try {
    logger.debug(`Fetching devlog history for issue: ${issueId}`)

    const { data, error } = await supabase
      .from('devlog_issues')
      .select(`
        *,
        pages:devlog_id (
          id, title, slug, created_at, updated_at
        )
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching issue devlog history', error)
      return { data: [], error: error.message }
    }

    // Transform to include devlog details
    const history = data.map(entry => ({
      id: entry.id,
      status_change: entry.status_change,
      work_notes: entry.work_notes,
      logged_at: entry.created_at,
      devlog: entry.pages
    })).filter(entry => entry.devlog !== null)

    logger.info(`Fetched ${history.length} devlog entries for issue: ${issueId}`)
    return { data: history, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching issue devlog history', err)
    return { data: [], error: err.message }
  }
}

/**
 * Get issue progression timeline
 * Shows how an issue's status changed across devlogs
 * @param {string} issueId - The issue UUID
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getIssueProgressionTimeline(issueId) {
  try {
    logger.debug(`Fetching progression timeline for issue: ${issueId}`)

    // Get the issue first
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single()

    if (issueError) {
      logger.error('Error fetching issue for timeline', issueError)
      return { data: [], error: issueError.message }
    }

    // Get all devlog entries
    const { data: devlogHistory, error: historyError } = await getIssueDevlogHistory(issueId)

    if (historyError) {
      return { data: [], error: historyError }
    }

    // Build timeline
    const timeline = [
      {
        timestamp: issue.created_at,
        event_type: 'created',
        status: 'open',
        title: 'Issue Created',
        description: `Issue "${issue.title}" was created`
      }
    ]

    // Add devlog entries
    devlogHistory.forEach(entry => {
      if (entry.status_change) {
        timeline.push({
          timestamp: entry.logged_at,
          event_type: 'status_change',
          status: entry.status_change,
          title: `Status changed to ${entry.status_change}`,
          description: entry.work_notes || `Updated in devlog: ${entry.devlog?.title || 'Unknown'}`,
          devlog: entry.devlog
        })
      } else if (entry.work_notes) {
        timeline.push({
          timestamp: entry.logged_at,
          event_type: 'work_logged',
          status: null,
          title: 'Work Logged',
          description: entry.work_notes,
          devlog: entry.devlog
        })
      }
    })

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    logger.info(`Built timeline with ${timeline.length} entries for issue: ${issueId}`)
    return { data: timeline, error: null }
  } catch (err) {
    logger.error('Unexpected error building issue timeline', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// STATISTICS & SUMMARIES
// ========================================

/**
 * Get summary statistics for a devlog's issue work
 * @param {string} devlogId - The devlog page UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getDevlogIssueSummary(devlogId) {
  try {
    logger.debug(`Fetching issue summary for devlog: ${devlogId}`)

    const { data: devlogIssues, error } = await getDevlogIssues(devlogId)

    if (error) {
      return { data: null, error }
    }

    const summary = {
      total_issues_worked: devlogIssues.length,
      completed: devlogIssues.filter(di =>
        di.status_change === 'done' || di.status_change === 'cancelled'
      ).length,
      in_progress: devlogIssues.filter(di =>
        di.status_change === 'in_progress'
      ).length,
      blocked: devlogIssues.filter(di =>
        di.status_change === 'blocked'
      ).length,
      with_notes: devlogIssues.filter(di =>
        di.work_notes && di.work_notes.trim() !== ''
      ).length,
      bugs_addressed: devlogIssues.filter(di =>
        di.issue?.issue_type === 'bug'
      ).length,
      improvements_addressed: devlogIssues.filter(di =>
        di.issue?.issue_type === 'improvement'
      ).length
    }

    logger.info(`Generated summary for devlog: ${devlogId}`)
    return { data: summary, error: null }
  } catch (err) {
    logger.error('Unexpected error generating devlog summary', err)
    return { data: null, error: err.message }
  }
}
