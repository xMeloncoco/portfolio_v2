/**
 * ========================================
 * PAGE CONNECTIONS SERVICE
 * ========================================
 * Service for managing polymorphic page connections
 *
 * FEATURES:
 * - Connect pages to projects or quests
 * - Query pages connected to specific projects/quests
 * - Support multiple connections per page
 * - Cascade display logic support
 *
 * CONNECTION RULES:
 * - Devlogs should connect to EITHER a quest OR a project (exclusive)
 * - Other page types (blog, notes) can connect to multiple entities
 * - A page can be connected to both projects and quests if needed
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// CONNECTION OPERATIONS
// ========================================

/**
 * Connect a page to a project or quest
 * @param {string} pageId - The page UUID
 * @param {string} connectedToType - 'project' or 'quest'
 * @param {string} connectedToId - UUID of project or quest
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function connectPage(pageId, connectedToType, connectedToId) {
  try {
    logger.info(`Connecting page ${pageId} to ${connectedToType}: ${connectedToId}`)

    // Validate connection type
    if (!['project', 'quest'].includes(connectedToType)) {
      return { data: null, error: 'Invalid connection type. Must be "project" or "quest"' }
    }

    const { data, error } = await supabase
      .from('page_connections')
      .insert([{
        page_id: pageId,
        connected_to_type: connectedToType,
        connected_to_id: connectedToId
      }])
      .select()
      .single()

    if (error) {
      // Check for duplicate connection
      if (error.code === '23505') {
        logger.warn('Page connection already exists')
        return { data: null, error: 'This connection already exists' }
      }
      logger.error('Error connecting page', error)
      return { data: null, error: error.message }
    }

    logger.info(`Page connected successfully: ${data.id}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error connecting page', err)
    return { data: null, error: err.message }
  }
}

/**
 * Disconnect a page from a project or quest
 * @param {string} pageId - The page UUID
 * @param {string} connectedToType - 'project' or 'quest'
 * @param {string} connectedToId - UUID of project or quest
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function disconnectPage(pageId, connectedToType, connectedToId) {
  try {
    logger.info(`Disconnecting page ${pageId} from ${connectedToType}: ${connectedToId}`)

    const { error } = await supabase
      .from('page_connections')
      .delete()
      .eq('page_id', pageId)
      .eq('connected_to_type', connectedToType)
      .eq('connected_to_id', connectedToId)

    if (error) {
      logger.error('Error disconnecting page', error)
      return { success: false, error: error.message }
    }

    logger.info('Page disconnected successfully')
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error disconnecting page', err)
    return { success: false, error: err.message }
  }
}

/**
 * Remove all connections for a page
 * @param {string} pageId - The page UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function disconnectAllFromPage(pageId) {
  try {
    logger.info(`Removing all connections for page: ${pageId}`)

    const { error } = await supabase
      .from('page_connections')
      .delete()
      .eq('page_id', pageId)

    if (error) {
      logger.error('Error removing page connections', error)
      return { success: false, error: error.message }
    }

    logger.info('All page connections removed successfully')
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error removing page connections', err)
    return { success: false, error: err.message }
  }
}

/**
 * Update connections for a page (replace all existing)
 * @param {string} pageId - The page UUID
 * @param {Array<{type: string, id: string}>} connections - Array of connection objects
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function updatePageConnections(pageId, connections) {
  try {
    logger.info(`Updating connections for page: ${pageId}`)

    // Delete existing connections
    const { error: deleteError } = await supabase
      .from('page_connections')
      .delete()
      .eq('page_id', pageId)

    if (deleteError) {
      logger.error('Error deleting existing connections', deleteError)
      return { data: [], error: deleteError.message }
    }

    // Insert new connections
    if (connections.length > 0) {
      const connectionRecords = connections.map(conn => ({
        page_id: pageId,
        connected_to_type: conn.type,
        connected_to_id: conn.id
      }))

      const { data, error: insertError } = await supabase
        .from('page_connections')
        .insert(connectionRecords)
        .select()

      if (insertError) {
        logger.error('Error inserting new connections', insertError)
        return { data: [], error: insertError.message }
      }

      logger.info(`Updated ${data.length} connections for page: ${pageId}`)
      return { data, error: null }
    }

    logger.info(`Removed all connections for page: ${pageId}`)
    return { data: [], error: null }
  } catch (err) {
    logger.error('Unexpected error updating page connections', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Get all connections for a page
 * @param {string} pageId - The page UUID
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getPageConnections(pageId) {
  try {
    logger.debug(`Fetching connections for page: ${pageId}`)

    const { data, error } = await supabase
      .from('page_connections')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching page connections', error)
      return { data: [], error: error.message }
    }

    logger.info(`Fetched ${data.length} connections for page: ${pageId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching page connections', err)
    return { data: [], error: err.message }
  }
}

/**
 * Get all pages connected to a project
 * @param {string} projectId - The project UUID
 * @param {Object} [options] - Filter options
 * @param {string} [options.pageType] - Filter by page type (blog, devlog, notes, project)
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getPagesConnectedToProject(projectId, options = {}) {
  try {
    logger.debug(`Fetching pages connected to project: ${projectId}`)

    let query = supabase
      .from('page_connections')
      .select(`
        *,
        pages:page_id (
          id, title, page_type, slug, visibility, created_at, updated_at
        )
      `)
      .eq('connected_to_type', 'project')
      .eq('connected_to_id', projectId)

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching pages connected to project', error)
      return { data: [], error: error.message }
    }

    // Extract pages and filter by type if needed
    let pages = data.map(conn => ({
      ...conn.pages,
      connection_id: conn.id,
      connection_created_at: conn.created_at
    })).filter(page => page !== null)

    if (options.pageType) {
      pages = pages.filter(page => page.page_type === options.pageType)
    }

    logger.info(`Fetched ${pages.length} pages connected to project: ${projectId}`)
    return { data: pages, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching pages for project', err)
    return { data: [], error: err.message }
  }
}

/**
 * Get all pages connected to a quest
 * @param {string} questId - The quest UUID
 * @param {Object} [options] - Filter options
 * @param {string} [options.pageType] - Filter by page type
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getPagesConnectedToQuest(questId, options = {}) {
  try {
    logger.debug(`Fetching pages connected to quest: ${questId}`)

    let query = supabase
      .from('page_connections')
      .select(`
        *,
        pages:page_id (
          id, title, page_type, slug, visibility, created_at, updated_at
        )
      `)
      .eq('connected_to_type', 'quest')
      .eq('connected_to_id', questId)

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching pages connected to quest', error)
      return { data: [], error: error.message }
    }

    // Extract pages and filter by type if needed
    let pages = data.map(conn => ({
      ...conn.pages,
      connection_id: conn.id,
      connection_created_at: conn.created_at
    })).filter(page => page !== null)

    if (options.pageType) {
      pages = pages.filter(page => page.page_type === options.pageType)
    }

    logger.info(`Fetched ${pages.length} pages connected to quest: ${questId}`)
    return { data: pages, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching pages for quest', err)
    return { data: [], error: err.message }
  }
}

/**
 * Get all devlogs for a project (including cascaded from quests)
 * @param {string} projectId - The project UUID
 * @param {Object} [options] - Filter options
 * @param {boolean} [options.includeCascaded=true] - Include devlogs from project's quests
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getProjectDevlogs(projectId, options = {}) {
  try {
    logger.debug(`Fetching devlogs for project: ${projectId}`, options)

    const includeCascaded = options.includeCascaded !== false

    // Get devlogs directly connected to project
    const { data: directDevlogs, error: directError } = await getPagesConnectedToProject(
      projectId,
      { pageType: 'devlog' }
    )

    if (directError) {
      return { data: [], error: directError }
    }

    let allDevlogs = [...directDevlogs]

    // Get devlogs from project's quests (cascaded)
    if (includeCascaded) {
      // First get all quest IDs for this project
      const { data: quests, error: questError } = await supabase
        .from('quests')
        .select('id')
        .eq('project_id', projectId)

      if (questError) {
        logger.warn('Error fetching project quests for devlog cascade', questError)
      } else if (quests && quests.length > 0) {
        // Get devlogs for each quest
        for (const quest of quests) {
          const { data: questDevlogs } = await getPagesConnectedToQuest(
            quest.id,
            { pageType: 'devlog' }
          )
          if (questDevlogs) {
            // Mark cascaded devlogs with their source
            const markedDevlogs = questDevlogs.map(d => ({
              ...d,
              cascaded_from_quest: quest.id
            }))
            allDevlogs = [...allDevlogs, ...markedDevlogs]
          }
        }
      }
    }

    // Sort by created date (newest first)
    allDevlogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    logger.info(`Fetched ${allDevlogs.length} devlogs for project: ${projectId}`)
    return { data: allDevlogs, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching project devlogs', err)
    return { data: [], error: err.message }
  }
}

/**
 * Get all pages for a project (including cascaded from quests)
 * @param {string} projectId - The project UUID
 * @param {Object} [options] - Filter options
 * @param {boolean} [options.includeCascaded=true] - Include pages from project's quests
 * @param {string} [options.pageType] - Filter by page type
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getProjectAllPages(projectId, options = {}) {
  try {
    logger.debug(`Fetching all pages for project: ${projectId}`, options)

    const includeCascaded = options.includeCascaded !== false

    // Get pages directly connected to project
    const { data: directPages, error: directError } = await getPagesConnectedToProject(
      projectId,
      { pageType: options.pageType }
    )

    if (directError) {
      return { data: [], error: directError }
    }

    let allPages = [...directPages]

    // Get pages from project's quests (cascaded)
    if (includeCascaded) {
      const { data: quests, error: questError } = await supabase
        .from('quests')
        .select('id')
        .eq('project_id', projectId)

      if (questError) {
        logger.warn('Error fetching project quests for page cascade', questError)
      } else if (quests && quests.length > 0) {
        for (const quest of quests) {
          const { data: questPages } = await getPagesConnectedToQuest(
            quest.id,
            { pageType: options.pageType }
          )
          if (questPages) {
            const markedPages = questPages.map(p => ({
              ...p,
              cascaded_from_quest: quest.id
            }))
            allPages = [...allPages, ...markedPages]
          }
        }
      }
    }

    // Remove duplicates (same page connected multiple ways)
    const uniquePages = []
    const seenIds = new Set()
    for (const page of allPages) {
      if (!seenIds.has(page.id)) {
        seenIds.add(page.id)
        uniquePages.push(page)
      }
    }

    // Sort by created date (newest first)
    uniquePages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    logger.info(`Fetched ${uniquePages.length} unique pages for project: ${projectId}`)
    return { data: uniquePages, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching project pages', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Check if a devlog is exclusively connected (to only one project or quest)
 * @param {string} devlogId - The devlog page UUID
 * @returns {Promise<{isExclusive: boolean, connections: Array, error: string|null}>}
 */
export async function checkDevlogExclusivity(devlogId) {
  try {
    const { data: connections, error } = await getPageConnections(devlogId)

    if (error) {
      return { isExclusive: false, connections: [], error }
    }

    const isExclusive = connections.length <= 1

    return {
      isExclusive,
      connections,
      error: null
    }
  } catch (err) {
    logger.error('Unexpected error checking devlog exclusivity', err)
    return { isExclusive: false, connections: [], error: err.message }
  }
}
