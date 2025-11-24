/**
 * ========================================
 * DEVLOGS SERVICE
 * ========================================
 * Service for managing devlogs in the database
 *
 * FEATURES:
 * - CRUD operations for devlogs
 * - Tag management
 * - Quest/Project linking
 * - Issue and subquest tracking
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Fetch all devlogs with related data
 * @param {Object} [options] - Filter options
 * @param {string} [options.projectId] - Filter by project
 * @param {string} [options.visibility] - Filter by visibility
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getAllDevlogs(options = {}) {
  try {
    logger.debug('Fetching all devlogs...', options)

    let query = supabase
      .from('devlogs')
      .select(`
        *,
        projects (id, title, slug),
        devlog_tags (
          tag_id,
          tags (id, name, color)
        ),
        devlog_quests (
          quest_id,
          quests (id, title, status)
        )
      `)
      .order('session_date', { ascending: false })

    // Apply filters
    if (options.projectId) {
      query = query.eq('project_id', options.projectId)
    }

    if (options.visibility) {
      query = query.eq('visibility', options.visibility)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching devlogs', error)
      return { data: [], error: error.message }
    }

    // Transform data
    const transformedData = data.map(devlog => ({
      ...devlog,
      project: devlog.projects,
      tags: devlog.devlog_tags?.map(dt => dt.tags) || [],
      quests: devlog.devlog_quests?.map(dq => dq.quests) || []
    }))

    logger.info(`Fetched ${transformedData.length} devlogs`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching devlogs', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch a single devlog by ID
 * @param {string} devlogId - The devlog UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getDevlogById(devlogId) {
  try {
    logger.debug(`Fetching devlog: ${devlogId}`)

    const { data, error } = await supabase
      .from('devlogs')
      .select(`
        *,
        projects (id, title, slug),
        devlog_tags (
          tag_id,
          tags (id, name, color)
        ),
        devlog_quests (
          quest_id,
          quests (id, title, status, quest_type)
        ),
        devlog_issues (
          id,
          issue_id,
          status_change,
          work_notes,
          issues (id, title, issue_type, severity, status)
        )
      `)
      .eq('id', devlogId)
      .single()

    if (error) {
      logger.error('Error fetching devlog', error)
      return { data: null, error: error.message }
    }

    // Transform data
    const transformedData = {
      ...data,
      project: data.projects,
      tags: data.devlog_tags?.map(dt => dt.tags) || [],
      quests: data.devlog_quests?.map(dq => dq.quests) || [],
      issues: data.devlog_issues?.map(di => ({
        ...di.issues,
        devlog_status_change: di.status_change,
        devlog_work_notes: di.work_notes
      })) || []
    }

    logger.info(`Fetched devlog: ${devlogId}`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching devlog', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Create a new devlog
 * @param {Object} devlogData - The devlog data
 * @param {string} devlogData.title - Devlog title (required)
 * @param {string} [devlogData.content] - Devlog content
 * @param {string} [devlogData.project_id] - Project UUID
 * @param {string} [devlogData.session_date] - Session date
 * @param {string} [devlogData.visibility='private'] - Visibility
 * @param {Array} [tagIds=[]] - Array of tag UUIDs
 * @param {Array} [questIds=[]] - Array of quest UUIDs to link
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createDevlog(devlogData, tagIds = [], questIds = []) {
  try {
    logger.info('Creating new devlog:', devlogData.title)

    // Validate required fields
    if (!devlogData.title || devlogData.title.trim() === '') {
      return { data: null, error: 'Devlog title is required' }
    }

    // Clean devlog data
    const cleanDevlogData = {
      title: devlogData.title.trim(),
      content: devlogData.content || '',
      visibility: devlogData.visibility || 'private',
      session_date: devlogData.session_date || new Date().toISOString().split('T')[0]
    }

    // Include project_id if provided
    if ('project_id' in devlogData) {
      cleanDevlogData.project_id = devlogData.project_id || null
    }

    // Insert the devlog
    const { data: devlog, error: devlogError } = await supabase
      .from('devlogs')
      .insert([cleanDevlogData])
      .select()
      .single()

    if (devlogError) {
      logger.error('Error creating devlog', devlogError)
      return { data: null, error: devlogError.message }
    }

    logger.debug(`Devlog created with ID: ${devlog.id}`)

    // Add tags
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        devlog_id: devlog.id,
        tag_id: tagId
      }))

      const { error: tagError } = await supabase
        .from('devlog_tags')
        .insert(tagRelations)

      if (tagError) {
        logger.warn('Error adding tags to devlog', tagError)
      }
    }

    // Add quest links
    if (questIds.length > 0) {
      const questRelations = questIds.map(questId => ({
        devlog_id: devlog.id,
        quest_id: questId
      }))

      const { error: questError } = await supabase
        .from('devlog_quests')
        .insert(questRelations)

      if (questError) {
        logger.warn('Error linking quests to devlog', questError)
      }
    }

    // Fetch the complete devlog with relations
    const result = await getDevlogById(devlog.id)
    logger.info(`Devlog created successfully: ${devlog.id}`)
    return result
  } catch (err) {
    logger.error('Unexpected error creating devlog', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update an existing devlog
 * @param {string} devlogId - The devlog UUID
 * @param {Object} devlogData - The updated devlog data
 * @param {Array} [tagIds] - Array of tag UUIDs (replaces existing)
 * @param {Array} [questIds] - Array of quest UUIDs (replaces existing)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateDevlog(devlogId, devlogData, tagIds, questIds) {
  try {
    logger.info(`Updating devlog: ${devlogId}`)

    // Update the devlog itself
    if (Object.keys(devlogData).length > 0) {
      const { error: devlogError } = await supabase
        .from('devlogs')
        .update(devlogData)
        .eq('id', devlogId)

      if (devlogError) {
        logger.error('Error updating devlog', devlogError)
        return { data: null, error: devlogError.message }
      }
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      await supabase.from('devlog_tags').delete().eq('devlog_id', devlogId)

      if (tagIds.length > 0) {
        const tagRelations = tagIds.map(tagId => ({
          devlog_id: devlogId,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('devlog_tags')
          .insert(tagRelations)

        if (tagError) {
          logger.warn('Error updating devlog tags', tagError)
        }
      }
    }

    // Update quest links if provided
    if (questIds !== undefined) {
      await supabase.from('devlog_quests').delete().eq('devlog_id', devlogId)

      if (questIds.length > 0) {
        const questRelations = questIds.map(questId => ({
          devlog_id: devlogId,
          quest_id: questId
        }))

        const { error: questError } = await supabase
          .from('devlog_quests')
          .insert(questRelations)

        if (questError) {
          logger.warn('Error updating devlog quests', questError)
        }
      }
    }

    // Fetch and return the updated devlog
    const result = await getDevlogById(devlogId)
    logger.info(`Devlog updated successfully: ${devlogId}`)
    return result
  } catch (err) {
    logger.error('Unexpected error updating devlog', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete a devlog by ID
 * @param {string} devlogId - The devlog UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteDevlog(devlogId) {
  try {
    logger.info(`Deleting devlog: ${devlogId}`)

    const { error } = await supabase
      .from('devlogs')
      .delete()
      .eq('id', devlogId)

    if (error) {
      logger.error('Error deleting devlog', error)
      return { success: false, error: error.message }
    }

    logger.info(`Devlog deleted successfully: ${devlogId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting devlog', err)
    return { success: false, error: err.message }
  }
}
