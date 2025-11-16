/**
 * ========================================
 * QUESTS SERVICE
 * ========================================
 * Service for managing quests in the database
 *
 * FEATURES:
 * - CRUD operations for quests
 * - Sub-quest management
 * - Tag management for quests
 * - Progress calculation
 * - Status mapping to fun names
 *
 * QUEST TYPES:
 * - main: Major projects and goals
 * - side: Smaller tasks and features
 * - future: Planned future work
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// STATUS MAPPING
// ========================================

/**
 * Maps internal status to fun RPG-style display names
 */
export const STATUS_DISPLAY_NAMES = {
  not_started: 'Awaiting Orders',
  in_progress: 'On The Move',
  debugging: 'Stuck in Battle',
  on_hold: 'Waiting for Mana',
  completed: 'Quest Complete!',
  abandoned: 'Quest Abandoned'
}

/**
 * Get the display name for a status
 * @param {string} status - The internal status
 * @returns {string} - The display name
 */
export function getStatusDisplayName(status) {
  return STATUS_DISPLAY_NAMES[status] || status
}

/**
 * Get all available statuses
 * @returns {Array} - Array of { value, label } objects
 */
export function getAllStatuses() {
  return Object.entries(STATUS_DISPLAY_NAMES).map(([value, label]) => ({
    value,
    label
  }))
}

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Fetch all quests with their tags and progress
 * @param {Object} [options] - Filter options
 * @param {string} [options.questType] - Filter by quest type
 * @param {string} [options.visibility] - Filter by visibility
 * @param {boolean} [options.includePrivate=true] - Include private quests
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getAllQuests(options = {}) {
  try {
    logger.debug('Fetching all quests...', options)

    let query = supabase
      .from('quests')
      .select(`
        *,
        quest_tags (
          tag_id,
          tags (id, name, color)
        ),
        sub_quests (
          id, title, is_completed, sort_order
        ),
        project_page:pages (id, title)
      `)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (options.questType) {
      query = query.eq('quest_type', options.questType)
    }

    if (options.visibility) {
      query = query.eq('visibility', options.visibility)
    } else if (!options.includePrivate) {
      query = query.eq('visibility', 'public')
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching quests', error)
      return { data: [], error: error.message }
    }

    // Transform data to flatten tags and calculate progress
    const transformedData = data.map(quest => {
      const subQuests = quest.sub_quests?.sort((a, b) => a.sort_order - b.sort_order) || []
      const completedCount = subQuests.filter(sq => sq.is_completed).length
      const totalCount = subQuests.length

      return {
        ...quest,
        tags: quest.quest_tags?.map(qt => qt.tags) || [],
        sub_quests: subQuests,
        progress: {
          completed: completedCount,
          total: totalCount,
          percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        },
        status_display: getStatusDisplayName(quest.status)
      }
    })

    logger.info(`Fetched ${transformedData.length} quests`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching quests', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch a single quest by ID with all related data
 * @param {string} questId - The quest UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getQuestById(questId) {
  try {
    logger.debug(`Fetching quest: ${questId}`)

    const { data, error } = await supabase
      .from('quests')
      .select(`
        *,
        quest_tags (
          tag_id,
          tags (id, name, color)
        ),
        sub_quests (
          id, title, is_completed, sort_order
        ),
        project_page:pages (id, title),
        page_quests (
          page_id,
          pages (id, title, page_type, updated_at)
        )
      `)
      .eq('id', questId)
      .single()

    if (error) {
      logger.error('Error fetching quest', error)
      return { data: null, error: error.message }
    }

    // Transform data
    const subQuests = data.sub_quests?.sort((a, b) => a.sort_order - b.sort_order) || []
    const completedCount = subQuests.filter(sq => sq.is_completed).length
    const totalCount = subQuests.length

    const transformedData = {
      ...data,
      tags: data.quest_tags?.map(qt => qt.tags) || [],
      sub_quests: subQuests,
      linked_pages: data.page_quests?.map(pq => pq.pages) || [],
      progress: {
        completed: completedCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      },
      status_display: getStatusDisplayName(data.status)
    }

    logger.info(`Fetched quest: ${questId}`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching quest', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Create a new quest
 * @param {Object} questData - The quest data
 * @param {string} questData.title - Quest title (required)
 * @param {string} [questData.quest_type='side'] - Quest type
 * @param {string} [questData.status='not_started'] - Status
 * @param {string} [questData.description] - Quest description
 * @param {Array} [tagIds=[]] - Array of tag UUIDs
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createQuest(questData, tagIds = []) {
  try {
    logger.info('Creating new quest:', questData.title)

    // Validate required fields
    if (!questData.title || questData.title.trim() === '') {
      return { data: null, error: 'Quest title is required' }
    }

    // Clean quest fields
    const cleanQuestData = {
      title: questData.title.trim(),
      quest_type: questData.quest_type || 'side',
      status: questData.status || 'not_started',
      description: questData.description || ''
    }

    // Insert the quest
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .insert([cleanQuestData])
      .select()
      .single()

    if (questError) {
      logger.error('Error creating quest', questError)
      return { data: null, error: questError.message }
    }

    logger.debug(`Quest created with ID: ${quest.id}`)

    // Add tags if provided
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        quest_id: quest.id,
        tag_id: tagId
      }))

      const { error: tagError } = await supabase
        .from('quest_tags')
        .insert(tagRelations)

      if (tagError) {
        logger.warn('Error adding tags to quest', tagError)
      }
    }

    // Fetch the complete quest with relations
    const result = await getQuestById(quest.id)
    logger.info(`Quest created successfully: ${quest.id}`)
    return result
  } catch (err) {
    logger.error('Unexpected error creating quest', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update an existing quest
 * @param {string} questId - The quest UUID
 * @param {Object} questData - The updated quest data
 * @param {Array} [tagIds] - Array of tag UUIDs (replaces existing)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateQuest(questId, questData, tagIds) {
  try {
    logger.info(`Updating quest: ${questId}`)

    // Update the quest itself
    if (Object.keys(questData).length > 0) {
      const { error: questError } = await supabase
        .from('quests')
        .update(questData)
        .eq('id', questId)

      if (questError) {
        logger.error('Error updating quest', questError)
        return { data: null, error: questError.message }
      }
    }

    // Update tags if provided (replace all existing tags)
    if (tagIds !== undefined) {
      // Delete existing tags
      await supabase.from('quest_tags').delete().eq('quest_id', questId)

      // Insert new tags
      if (tagIds.length > 0) {
        const tagRelations = tagIds.map(tagId => ({
          quest_id: questId,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('quest_tags')
          .insert(tagRelations)

        if (tagError) {
          logger.warn('Error updating quest tags', tagError)
        }
      }
    }

    // Fetch and return the updated quest
    const result = await getQuestById(questId)
    logger.info(`Quest updated successfully: ${questId}`)
    return result
  } catch (err) {
    logger.error('Unexpected error updating quest', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete a quest by ID
 * Note: This will cascade delete related tags and sub-quests
 * @param {string} questId - The quest UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteQuest(questId) {
  try {
    logger.info(`Deleting quest: ${questId}`)

    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', questId)

    if (error) {
      logger.error('Error deleting quest', error)
      return { success: false, error: error.message }
    }

    logger.info(`Quest deleted successfully: ${questId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting quest', err)
    return { success: false, error: err.message }
  }
}

// ========================================
// SUB-QUEST OPERATIONS
// ========================================

/**
 * Add a sub-quest to a quest
 * @param {string} questId - The quest UUID
 * @param {string} title - The sub-quest title
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function addSubQuest(questId, title) {
  try {
    logger.debug(`Adding sub-quest to quest: ${questId}`)

    // Get the next sort order
    const { data: existingSubQuests } = await supabase
      .from('sub_quests')
      .select('sort_order')
      .eq('quest_id', questId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existingSubQuests && existingSubQuests.length > 0
      ? existingSubQuests[0].sort_order + 1
      : 0

    const { data, error } = await supabase
      .from('sub_quests')
      .insert([{ quest_id: questId, title, sort_order: nextOrder }])
      .select()
      .single()

    if (error) {
      logger.error('Error adding sub-quest', error)
      return { data: null, error: error.message }
    }

    logger.info(`Sub-quest added: ${data.id}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error adding sub-quest', err)
    return { data: null, error: err.message }
  }
}

/**
 * Update a sub-quest
 * @param {string} subQuestId - The sub-quest UUID
 * @param {Object} subQuestData - The updated data
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateSubQuest(subQuestId, subQuestData) {
  try {
    logger.debug(`Updating sub-quest: ${subQuestId}`)

    const { data, error } = await supabase
      .from('sub_quests')
      .update(subQuestData)
      .eq('id', subQuestId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating sub-quest', error)
      return { data: null, error: error.message }
    }

    logger.info(`Sub-quest updated: ${subQuestId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error updating sub-quest', err)
    return { data: null, error: err.message }
  }
}

/**
 * Toggle sub-quest completion status
 * @param {string} subQuestId - The sub-quest UUID
 * @param {boolean} isCompleted - The new completion status
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function toggleSubQuestCompletion(subQuestId, isCompleted) {
  return updateSubQuest(subQuestId, { is_completed: isCompleted })
}

/**
 * Delete a sub-quest
 * @param {string} subQuestId - The sub-quest UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteSubQuest(subQuestId) {
  try {
    logger.debug(`Deleting sub-quest: ${subQuestId}`)

    const { error } = await supabase
      .from('sub_quests')
      .delete()
      .eq('id', subQuestId)

    if (error) {
      logger.error('Error deleting sub-quest', error)
      return { success: false, error: error.message }
    }

    logger.info(`Sub-quest deleted: ${subQuestId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting sub-quest', err)
    return { success: false, error: err.message }
  }
}
