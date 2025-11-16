/**
 * ========================================
 * PAGES SERVICE
 * ========================================
 * Service for managing pages in the database
 *
 * FEATURES:
 * - CRUD operations for pages
 * - Tag management for pages
 * - Quest linking for pages
 * - Devlog item management
 * - Filtering and sorting
 *
 * PAGE TYPES:
 * - blog: Blog posts and articles
 * - devlog: Development logs with to-do lists
 * - notes: Quick notes and ideas
 * - project: Full project pages with status tracking
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Fetch all pages with their tags
 * @param {Object} [options] - Filter options
 * @param {string} [options.pageType] - Filter by page type
 * @param {string} [options.visibility] - Filter by visibility
 * @param {boolean} [options.includePrivate=true] - Include private pages
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getAllPages(options = {}) {
  try {
    logger.debug('Fetching all pages...', options)

    let query = supabase
      .from('pages')
      .select(`
        *,
        page_tags (
          tag_id,
          tags (id, name, color)
        ),
        page_quests (
          quest_id,
          quests (id, name)
        )
      `)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (options.pageType) {
      query = query.eq('page_type', options.pageType)
    }

    if (options.visibility) {
      query = query.eq('visibility', options.visibility)
    } else if (options.includePrivate === false) {
      // Only filter to public if explicitly set to false
      query = query.eq('visibility', 'public')
    }
    // Default: show all pages (includePrivate is true by default)

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching pages', error)
      return { data: [], error: error.message }
    }

    // Transform data to flatten tags
    const transformedData = data.map(page => ({
      ...page,
      tags: page.page_tags?.map(pt => pt.tags) || [],
      quests: page.page_quests?.map(pq => pq.quests) || []
    }))

    logger.info(`Fetched ${transformedData.length} pages`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching pages', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch a single page by ID with all related data
 * @param {string} pageId - The page UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getPageById(pageId) {
  try {
    logger.debug(`Fetching page: ${pageId}`)

    const { data, error } = await supabase
      .from('pages')
      .select(`
        *,
        page_tags (
          tag_id,
          tags (id, name, color)
        ),
        page_quests (
          quest_id,
          quests (id, name)
        ),
        devlog_items (
          id, title, status, sort_order
        )
      `)
      .eq('id', pageId)
      .single()

    if (error) {
      logger.error('Error fetching page', error)
      return { data: null, error: error.message }
    }

    // Transform data
    const transformedData = {
      ...data,
      tags: data.page_tags?.map(pt => pt.tags) || [],
      quests: data.page_quests?.map(pq => pq.quests) || [],
      devlog_items: data.devlog_items?.sort((a, b) => a.sort_order - b.sort_order) || []
    }

    logger.info(`Fetched page: ${pageId}`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching page', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Create a new page
 * @param {Object} pageData - The page data
 * @param {string} pageData.title - Page title (required)
 * @param {string} [pageData.page_type='notes'] - Page type
 * @param {string} [pageData.content=''] - Page content
 * @param {string} [pageData.visibility='private'] - Visibility
 * @param {string} [pageData.project_status] - For project pages
 * @param {string} [pageData.project_start_date] - For project pages
 * @param {string} [pageData.project_end_date] - For project pages
 * @param {Array} [pageData.tagIds=[]] - Array of tag UUIDs
 * @param {Array} [pageData.questIds=[]] - Array of quest UUIDs
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createPage(pageData) {
  try {
    logger.info('Creating new page:', pageData.title)

    // Validate required fields
    if (!pageData.title || pageData.title.trim() === '') {
      return { data: null, error: 'Page title is required' }
    }

    // Extract tags and quests for separate insertion
    const { tagIds = [], questIds = [], ...pageFields } = pageData

    // Clean page fields
    const cleanPageData = {
      title: pageFields.title.trim(),
      page_type: pageFields.page_type || 'notes',
      content: pageFields.content || '',
      visibility: pageFields.visibility || 'private',
      project_status: pageFields.project_status || null,
      project_start_date: pageFields.project_start_date || null,
      project_end_date: pageFields.project_end_date || null
    }

    // Insert the page
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .insert([cleanPageData])
      .select()
      .single()

    if (pageError) {
      logger.error('Error creating page', pageError)
      return { data: null, error: pageError.message }
    }

    logger.debug(`Page created with ID: ${page.id}`)

    // Add tags if provided
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        page_id: page.id,
        tag_id: tagId
      }))

      const { error: tagError } = await supabase
        .from('page_tags')
        .insert(tagRelations)

      if (tagError) {
        logger.warn('Error adding tags to page', tagError)
      }
    }

    // Add quest links if provided
    if (questIds.length > 0) {
      const questRelations = questIds.map(questId => ({
        page_id: page.id,
        quest_id: questId
      }))

      const { error: questError } = await supabase
        .from('page_quests')
        .insert(questRelations)

      if (questError) {
        logger.warn('Error linking quests to page', questError)
      }
    }

    // Fetch the complete page with relations
    const result = await getPageById(page.id)
    logger.info(`Page created successfully: ${page.id}`)
    return result
  } catch (err) {
    logger.error('Unexpected error creating page', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update an existing page
 * @param {string} pageId - The page UUID
 * @param {Object} pageData - The updated page data
 * @param {Array} [pageData.tagIds] - Array of tag UUIDs (replaces existing)
 * @param {Array} [pageData.questIds] - Array of quest UUIDs (replaces existing)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updatePage(pageId, pageData) {
  try {
    logger.info(`Updating page: ${pageId}`)

    // Extract tags and quests for separate handling
    const { tagIds, questIds, ...pageFields } = pageData

    // Update the page itself
    if (Object.keys(pageFields).length > 0) {
      const { error: pageError } = await supabase
        .from('pages')
        .update(pageFields)
        .eq('id', pageId)

      if (pageError) {
        logger.error('Error updating page', pageError)
        return { data: null, error: pageError.message }
      }
    }

    // Update tags if provided (replace all existing tags)
    if (tagIds !== undefined) {
      // Delete existing tags
      await supabase.from('page_tags').delete().eq('page_id', pageId)

      // Insert new tags
      if (tagIds.length > 0) {
        const tagRelations = tagIds.map(tagId => ({
          page_id: pageId,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('page_tags')
          .insert(tagRelations)

        if (tagError) {
          logger.warn('Error updating page tags', tagError)
        }
      }
    }

    // Update quest links if provided (replace all existing links)
    if (questIds !== undefined) {
      // Delete existing quest links
      await supabase.from('page_quests').delete().eq('page_id', pageId)

      // Insert new quest links
      if (questIds.length > 0) {
        const questRelations = questIds.map(questId => ({
          page_id: pageId,
          quest_id: questId
        }))

        const { error: questError } = await supabase
          .from('page_quests')
          .insert(questRelations)

        if (questError) {
          logger.warn('Error updating page quest links', questError)
        }
      }
    }

    // Fetch and return the updated page
    const result = await getPageById(pageId)
    logger.info(`Page updated successfully: ${pageId}`)
    return result
  } catch (err) {
    logger.error('Unexpected error updating page', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete a page by ID
 * Note: This will cascade delete related tags, quest links, and devlog items
 * @param {string} pageId - The page UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deletePage(pageId) {
  try {
    logger.info(`Deleting page: ${pageId}`)

    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)

    if (error) {
      logger.error('Error deleting page', error)
      return { success: false, error: error.message }
    }

    logger.info(`Page deleted successfully: ${pageId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting page', err)
    return { success: false, error: err.message }
  }
}

// ========================================
// DEVLOG ITEM OPERATIONS
// ========================================

/**
 * Add a devlog item to a page
 * @param {string} pageId - The page UUID
 * @param {string} title - The item title
 * @param {string} [status='todo'] - The item status
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function addDevlogItem(pageId, title, status = 'todo') {
  try {
    logger.debug(`Adding devlog item to page: ${pageId}`)

    // Get the next sort order
    const { data: existingItems } = await supabase
      .from('devlog_items')
      .select('sort_order')
      .eq('page_id', pageId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existingItems && existingItems.length > 0
      ? existingItems[0].sort_order + 1
      : 0

    const { data, error } = await supabase
      .from('devlog_items')
      .insert([{ page_id: pageId, title, status, sort_order: nextOrder }])
      .select()
      .single()

    if (error) {
      logger.error('Error adding devlog item', error)
      return { data: null, error: error.message }
    }

    logger.info(`Devlog item added: ${data.id}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error adding devlog item', err)
    return { data: null, error: err.message }
  }
}

/**
 * Update a devlog item
 * @param {string} itemId - The item UUID
 * @param {Object} itemData - The updated item data
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateDevlogItem(itemId, itemData) {
  try {
    logger.debug(`Updating devlog item: ${itemId}`)

    const { data, error } = await supabase
      .from('devlog_items')
      .update(itemData)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating devlog item', error)
      return { data: null, error: error.message }
    }

    logger.info(`Devlog item updated: ${itemId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error updating devlog item', err)
    return { data: null, error: err.message }
  }
}

/**
 * Delete a devlog item
 * @param {string} itemId - The item UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteDevlogItem(itemId) {
  try {
    logger.debug(`Deleting devlog item: ${itemId}`)

    const { error } = await supabase
      .from('devlog_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      logger.error('Error deleting devlog item', error)
      return { success: false, error: error.message }
    }

    logger.info(`Devlog item deleted: ${itemId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting devlog item', err)
    return { success: false, error: err.message }
  }
}
