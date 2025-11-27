/**
 * ========================================
 * PAGES SERVICE
 * ========================================
 * Service for managing pages in the database
 *
 * FEATURES:
 * - CRUD operations for pages
 * - Tag management for pages
 * - Quest and project linking (polymorphic connections)
 * - Filtering and sorting
 *
 * PAGE TYPES:
 * - blog: Blog posts and articles
 * - notes: Quick notes and ideas
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

    // Fetch page_connections separately for all pages
    const pageIds = data.map(p => p.id)
    const { data: allConnections } = await supabase
      .from('page_connections')
      .select('*')
      .in('page_id', pageIds)

    // Group connections by page_id
    const connectionsByPage = {}
    allConnections?.forEach(conn => {
      if (!connectionsByPage[conn.page_id]) {
        connectionsByPage[conn.page_id] = []
      }
      connectionsByPage[conn.page_id].push(conn)
    })

    // Fetch related quests and projects for all connections
    const transformedData = await Promise.all(data.map(async (page) => {
      const connections = connectionsByPage[page.id] || []
      const quests = []
      const projects = []

      // Fetch actual quest/project data for each connection
      for (const conn of connections) {
        if (conn.connected_to_type === 'quest') {
          const { data: quest } = await supabase
            .from('quests')
            .select('id, title')
            .eq('id', conn.connected_to_id)
            .single()
          if (quest) quests.push(quest)
        } else if (conn.connected_to_type === 'project') {
          const { data: project } = await supabase
            .from('projects')
            .select('id, title')
            .eq('id', conn.connected_to_id)
            .single()
          if (project) projects.push(project)
        }
      }

      return {
        ...page,
        tags: page.page_tags?.map(pt => pt.tags) || [],
        quests,
        projects
      }
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
        )
      `)
      .eq('id', pageId)
      .single()

    if (error) {
      logger.error('Error fetching page', error)
      return { data: null, error: error.message }
    }

    // Fetch page_connections separately
    const { data: connections } = await supabase
      .from('page_connections')
      .select('*')
      .eq('page_id', pageId)

    // Fetch related quests and projects
    const quests = []
    const projects = []

    for (const conn of (connections || [])) {
      if (conn.connected_to_type === 'quest') {
        const { data: quest } = await supabase
          .from('quests')
          .select('id, title')
          .eq('id', conn.connected_to_id)
          .single()
        if (quest) quests.push(quest)
      } else if (conn.connected_to_type === 'project') {
        const { data: project } = await supabase
          .from('projects')
          .select('id, title')
          .eq('id', conn.connected_to_id)
          .single()
        if (project) projects.push(project)
      }
    }

    // Transform data
    const transformedData = {
      ...data,
      tags: data.page_tags?.map(pt => pt.tags) || [],
      quests,
      projects
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
 * @param {Array} [pageData.tagIds=[]] - Array of tag UUIDs
 * @param {Array} [pageData.questIds=[]] - Array of quest UUIDs
 * @param {Array} [pageData.projectIds=[]] - Array of project UUIDs
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createPage(pageData) {
  try {
    logger.info('Creating new page:', pageData.title)

    // Validate required fields
    if (!pageData.title || pageData.title.trim() === '') {
      return { data: null, error: 'Page title is required' }
    }

    // Extract tags, quests, and projects for separate insertion
    const { tagIds = [], questIds = [], projectIds = [], ...pageFields } = pageData

    // Clean page fields
    const cleanPageData = {
      title: pageFields.title.trim(),
      page_type: pageFields.page_type || 'notes',
      content: pageFields.content || '',
      visibility: pageFields.visibility || 'private'
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

    // Add connections (quests and projects) using polymorphic table
    const connections = []

    if (questIds.length > 0) {
      connections.push(...questIds.map(questId => ({
        page_id: page.id,
        connected_to_type: 'quest',
        connected_to_id: questId
      })))
    }

    if (projectIds.length > 0) {
      connections.push(...projectIds.map(projectId => ({
        page_id: page.id,
        connected_to_type: 'project',
        connected_to_id: projectId
      })))
    }

    if (connections.length > 0) {
      const { error: connError } = await supabase
        .from('page_connections')
        .insert(connections)

      if (connError) {
        logger.warn('Error creating page connections', connError)
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
 * @param {Array} [pageData.projectIds] - Array of project UUIDs (replaces existing)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updatePage(pageId, pageData) {
  try {
    logger.info(`Updating page: ${pageId}`)

    // Extract tags, quests, and projects for separate handling
    const { tagIds, questIds, projectIds, ...pageFields } = pageData

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

    // Update connections if provided (replace all existing connections)
    if (questIds !== undefined || projectIds !== undefined) {
      // Delete existing connections
      await supabase.from('page_connections').delete().eq('page_id', pageId)

      // Build new connections array
      const connections = []

      if (questIds && questIds.length > 0) {
        connections.push(...questIds.map(questId => ({
          page_id: pageId,
          connected_to_type: 'quest',
          connected_to_id: questId
        })))
      }

      if (projectIds && projectIds.length > 0) {
        connections.push(...projectIds.map(projectId => ({
          page_id: pageId,
          connected_to_type: 'project',
          connected_to_id: projectId
        })))
      }

      // Insert new connections
      if (connections.length > 0) {
        const { error: connError } = await supabase
          .from('page_connections')
          .insert(connections)

        if (connError) {
          logger.warn('Error updating page connections', connError)
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
