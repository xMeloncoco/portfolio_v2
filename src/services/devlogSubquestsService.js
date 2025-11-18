/**
 * ========================================
 * DEVLOG SUBQUESTS SERVICE
 * ========================================
 * Service for managing the relationship between devlogs and subquests
 *
 * FEATURES:
 * - Track which subquests were worked on in each devlog
 * - Record completion status for subquests in devlog sessions
 * - Store work notes for each subquest in each devlog
 * - Query subquest history across devlogs
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// LINK/UNLINK OPERATIONS
// ========================================

/**
 * Link a subquest to a devlog with optional completion status and notes
 * @param {string} devlogId - The devlog page UUID
 * @param {string} subquestId - The subquest UUID
 * @param {Object} [workData] - Work tracking data
 * @param {boolean} [workData.was_completed] - Whether subquest was completed in this session
 * @param {string} [workData.work_notes] - Notes about work done
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function linkSubquestToDevlog(devlogId, subquestId, workData = {}) {
  try {
    logger.info(`Linking subquest ${subquestId} to devlog ${devlogId}`)

    const insertData = {
      devlog_id: devlogId,
      subquest_id: subquestId,
      was_completed: workData.was_completed || false
    }

    if (workData.work_notes && workData.work_notes.trim() !== '') {
      insertData.work_notes = workData.work_notes.trim()
    }

    const { data, error } = await supabase
      .from('devlog_subquests')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        logger.warn('Subquest already linked to this devlog')
        return { data: null, error: 'Subquest is already linked to this devlog' }
      }
      logger.error('Error linking subquest to devlog', error)
      return { data: null, error: error.message }
    }

    logger.info(`Subquest linked successfully: ${data.id}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error linking subquest to devlog', err)
    return { data: null, error: err.message }
  }
}

/**
 * Bulk link multiple subquests to a devlog
 * @param {string} devlogId - The devlog page UUID
 * @param {Array<Object>} subquests - Array of subquest work data
 * @param {string} subquests[].id - Subquest UUID
 * @param {boolean} [subquests[].was_completed] - Completion status
 * @param {string} [subquests[].work_notes] - Work notes
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function bulkLinkSubquestsToDevlog(devlogId, subquests) {
  try {
    logger.info(`Bulk linking ${subquests.length} subquests to devlog ${devlogId}`)

    const insertData = subquests.map((subquest) => {
      const data = {
        devlog_id: devlogId,
        subquest_id: subquest.id,
        was_completed: subquest.was_completed || false
      }

      if (subquest.work_notes && subquest.work_notes.trim() !== '') {
        data.work_notes = subquest.work_notes.trim()
      }

      return data
    })

    const { data, error } = await supabase
      .from('devlog_subquests')
      .insert(insertData)
      .select()

    if (error) {
      logger.error('Error bulk linking subquests to devlog', error)
      return { data: null, error: error.message }
    }

    logger.info(`${data.length} subquests linked successfully`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error bulk linking subquests to devlog', err)
    return { data: null, error: err.message }
  }
}

/**
 * Unlink a subquest from a devlog
 * @param {string} devlogId - The devlog page UUID
 * @param {string} subquestId - The subquest UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function unlinkSubquestFromDevlog(devlogId, subquestId) {
  try {
    logger.info(`Unlinking subquest ${subquestId} from devlog ${devlogId}`)

    const { data, error } = await supabase
      .from('devlog_subquests')
      .delete()
      .eq('devlog_id', devlogId)
      .eq('subquest_id', subquestId)
      .select()
      .single()

    if (error) {
      logger.error('Error unlinking subquest from devlog', error)
      return { data: null, error: error.message }
    }

    logger.info('Subquest unlinked successfully')
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error unlinking subquest from devlog', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// QUERY OPERATIONS
// ========================================

/**
 * Get all subquests worked on in a specific devlog
 * @param {string} devlogId - The devlog page UUID
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function getDevlogSubquests(devlogId) {
  try {
    logger.debug(`Fetching subquests for devlog ${devlogId}`)

    const { data, error } = await supabase
      .from('devlog_subquests')
      .select(`
        *,
        sub_quests (
          id,
          title,
          is_completed,
          sort_order,
          quest_id,
          quests (
            id,
            title
          )
        )
      `)
      .eq('devlog_id', devlogId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching devlog subquests', error)
      return { data: null, error: error.message }
    }

    logger.info(`Found ${data?.length || 0} subquests for devlog`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching devlog subquests', err)
    return { data: null, error: err.message }
  }
}

/**
 * Get all devlogs where a specific subquest was worked on
 * @param {string} subquestId - The subquest UUID
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function getSubquestDevlogHistory(subquestId) {
  try {
    logger.debug(`Fetching devlog history for subquest ${subquestId}`)

    const { data, error } = await supabase
      .from('devlog_subquests')
      .select(`
        *,
        pages (
          id,
          title,
          created_at
        )
      `)
      .eq('subquest_id', subquestId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching subquest devlog history', error)
      return { data: null, error: error.message }
    }

    logger.info(`Found ${data?.length || 0} devlog entries for subquest`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching subquest devlog history', err)
    return { data: null, error: err.message }
  }
}

/**
 * Get subquests organized by completion status for a devlog
 * @param {string} devlogId - The devlog page UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getDevlogSubquestsSectioned(devlogId) {
  try {
    logger.debug(`Fetching sectioned subquests for devlog ${devlogId}`)

    const { data: devlogSubquests, error } = await getDevlogSubquests(devlogId)

    if (error) {
      return { data: null, error }
    }

    // Organize into sections
    const sections = {
      completed_in_devlog: [],
      in_progress: [],
      newly_added: []
    }

    devlogSubquests?.forEach((ds) => {
      const subquest = ds.sub_quests

      if (ds.was_completed) {
        sections.completed_in_devlog.push({
          ...subquest,
          work_notes: ds.work_notes,
          devlog_created_at: ds.created_at
        })
      } else if (subquest.is_completed) {
        // Already completed (before this devlog)
        sections.completed_in_devlog.push({
          ...subquest,
          work_notes: ds.work_notes,
          devlog_created_at: ds.created_at
        })
      } else {
        // Still in progress
        sections.in_progress.push({
          ...subquest,
          work_notes: ds.work_notes,
          devlog_created_at: ds.created_at
        })
      }
    })

    logger.info('Subquests organized by section')
    return { data: sections, error: null }
  } catch (err) {
    logger.error('Unexpected error organizing subquests by section', err)
    return { data: null, error: err.message }
  }
}
