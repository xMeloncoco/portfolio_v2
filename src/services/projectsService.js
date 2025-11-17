/**
 * ========================================
 * PROJECTS SERVICE
 * ========================================
 * Service for managing projects in the database
 *
 * FEATURES:
 * - CRUD operations for projects
 * - Tag management for projects
 * - Hierarchical project structure (parent/child)
 * - Cascade queries for related content
 *
 * PROJECTS vs QUESTS:
 * - Projects are top-level containers (like campaigns)
 * - Quests are tasks within or outside of projects
 * - Projects can have child projects (hierarchy)
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { PROJECT_STATUS_LABELS } from '../types/database'

// ========================================
// STATUS MAPPING
// ========================================

/**
 * Get the display name for a project status
 * @param {string} status - The internal status
 * @returns {string} - The display name
 */
export function getProjectStatusDisplayName(status) {
  return PROJECT_STATUS_LABELS[status] || status
}

/**
 * Get all available project statuses
 * @returns {Array<{value: string, label: string}>}
 */
export function getAllProjectStatuses() {
  return Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label
  }))
}

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Fetch all projects with their tags
 * @param {Object} [options] - Filter options
 * @param {string} [options.status] - Filter by project status
 * @param {string} [options.visibility] - Filter by visibility
 * @param {boolean} [options.includePrivate=true] - Include private projects
 * @param {string} [options.parentId] - Filter by parent project (null for root projects)
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getAllProjects(options = {}) {
  try {
    logger.debug('Fetching all projects...', options)

    let query = supabase
      .from('projects')
      .select(`
        *,
        project_tags (
          tag_id,
          tags (id, name, color)
        )
      `)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.visibility) {
      query = query.eq('visibility', options.visibility)
    } else if (!options.includePrivate) {
      query = query.eq('visibility', 'public')
    }

    if (options.parentId !== undefined) {
      if (options.parentId === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', options.parentId)
      }
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching projects', error)
      return { data: [], error: error.message }
    }

    // Transform data to flatten tags
    const transformedData = data.map(project => ({
      ...project,
      tags: project.project_tags?.map(pt => pt.tags) || [],
      status_display: getProjectStatusDisplayName(project.status)
    }))

    logger.info(`Fetched ${transformedData.length} projects`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching projects', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch a single project by ID with all related data
 * @param {string} projectId - The project UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getProjectById(projectId) {
  try {
    logger.debug(`Fetching project: ${projectId}`)

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_tags (
          tag_id,
          tags (id, name, color)
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) {
      logger.error('Error fetching project', error)
      return { data: null, error: error.message }
    }

    // Transform data
    const transformedData = {
      ...data,
      tags: data.project_tags?.map(pt => pt.tags) || [],
      status_display: getProjectStatusDisplayName(data.status)
    }

    logger.info(`Fetched project: ${projectId}`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching project', err)
    return { data: null, error: err.message }
  }
}

/**
 * Fetch a project by its slug
 * @param {string} slug - The project slug
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getProjectBySlug(slug) {
  try {
    logger.debug(`Fetching project by slug: ${slug}`)

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_tags (
          tag_id,
          tags (id, name, color)
        )
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      logger.error('Error fetching project by slug', error)
      return { data: null, error: error.message }
    }

    const transformedData = {
      ...data,
      tags: data.project_tags?.map(pt => pt.tags) || [],
      status_display: getProjectStatusDisplayName(data.status)
    }

    logger.info(`Fetched project by slug: ${slug}`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching project by slug', err)
    return { data: null, error: err.message }
  }
}

/**
 * Fetch child projects of a parent project
 * @param {string} parentId - The parent project UUID
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getChildProjects(parentId) {
  return getAllProjects({ parentId })
}

/**
 * Fetch all quests belonging to a project
 * @param {string} projectId - The project UUID
 * @param {Object} [options] - Filter options
 * @param {boolean} [options.includeSubquests=false] - Include subquests (child quests)
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getProjectQuests(projectId, options = {}) {
  try {
    logger.debug(`Fetching quests for project: ${projectId}`)

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
        )
      `)
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })

    // Filter to only top-level quests by default
    if (!options.includeSubquests) {
      query = query.is('parent_quest_id', null)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching project quests', error)
      return { data: [], error: error.message }
    }

    // Transform data
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
        }
      }
    })

    logger.info(`Fetched ${transformedData.length} quests for project: ${projectId}`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching project quests', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - The project title
 * @returns {string} - URL-friendly slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) // Limit length
}

/**
 * Create a new project
 * @param {Object} projectData - The project data
 * @param {string} projectData.title - Project title (required)
 * @param {string} [projectData.description] - Project description
 * @param {string} [projectData.slug] - Custom slug (auto-generated if not provided)
 * @param {string} [projectData.status='active'] - Project status
 * @param {string} [projectData.visibility='private'] - Visibility
 * @param {string} [projectData.parent_id] - Parent project UUID
 * @param {Array} [tagIds=[]] - Array of tag UUIDs
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createProject(projectData, tagIds = []) {
  try {
    logger.info('Creating new project:', projectData.title)

    // Validate required fields
    if (!projectData.title || projectData.title.trim() === '') {
      return { data: null, error: 'Project title is required' }
    }

    // Generate slug if not provided
    let slug = projectData.slug || generateSlug(projectData.title)

    // Ensure slug is unique by checking and appending number if needed
    let slugAttempt = 0
    let uniqueSlug = slug
    while (true) {
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', uniqueSlug)
        .single()

      if (!existing) {
        break
      }

      slugAttempt++
      uniqueSlug = `${slug}-${slugAttempt}`
    }

    // Clean project data
    const cleanProjectData = {
      title: projectData.title.trim(),
      slug: uniqueSlug,
      status: projectData.status || 'active',
      visibility: projectData.visibility || 'private'
    }

    if (projectData.description && projectData.description.trim() !== '') {
      cleanProjectData.description = projectData.description.trim()
    }

    if (projectData.parent_id) {
      cleanProjectData.parent_id = projectData.parent_id
    }

    // Insert the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([cleanProjectData])
      .select()
      .single()

    if (projectError) {
      logger.error('Error creating project', projectError)
      return { data: null, error: projectError.message }
    }

    logger.debug(`Project created with ID: ${project.id}`)

    // Add tags if provided
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        project_id: project.id,
        tag_id: tagId
      }))

      const { error: tagError } = await supabase
        .from('project_tags')
        .insert(tagRelations)

      if (tagError) {
        logger.warn('Error adding tags to project', tagError)
      }
    }

    // Fetch the complete project with relations
    const result = await getProjectById(project.id)
    logger.info(`Project created successfully: ${project.id}`)
    return result
  } catch (err) {
    logger.error('Unexpected error creating project', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update an existing project
 * @param {string} projectId - The project UUID
 * @param {Object} projectData - The updated project data
 * @param {Array} [tagIds] - Array of tag UUIDs (replaces existing)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateProject(projectId, projectData, tagIds) {
  try {
    logger.info(`Updating project: ${projectId}`)

    // Update the project itself
    if (Object.keys(projectData).length > 0) {
      const { error: projectError } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', projectId)

      if (projectError) {
        logger.error('Error updating project', projectError)
        return { data: null, error: projectError.message }
      }
    }

    // Update tags if provided (replace all existing tags)
    if (tagIds !== undefined) {
      // Delete existing tags
      await supabase.from('project_tags').delete().eq('project_id', projectId)

      // Insert new tags
      if (tagIds.length > 0) {
        const tagRelations = tagIds.map(tagId => ({
          project_id: projectId,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('project_tags')
          .insert(tagRelations)

        if (tagError) {
          logger.warn('Error updating project tags', tagError)
        }
      }
    }

    // Fetch and return the updated project
    const result = await getProjectById(projectId)
    logger.info(`Project updated successfully: ${projectId}`)
    return result
  } catch (err) {
    logger.error('Unexpected error updating project', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete a project by ID
 * Note: This will cascade delete related tags
 * Quests will have their project_id set to NULL (not deleted)
 * @param {string} projectId - The project UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteProject(projectId) {
  try {
    logger.info(`Deleting project: ${projectId}`)

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      logger.error('Error deleting project', error)
      return { success: false, error: error.message }
    }

    logger.info(`Project deleted successfully: ${projectId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting project', err)
    return { success: false, error: err.message }
  }
}

// ========================================
// STATISTICS
// ========================================

/**
 * Get statistics for a project
 * @param {string} projectId - The project UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getProjectStatistics(projectId) {
  try {
    logger.debug(`Fetching statistics for project: ${projectId}`)

    // Get quest counts
    const { data: quests, error: questError } = await supabase
      .from('quests')
      .select('id, status')
      .eq('project_id', projectId)
      .is('parent_quest_id', null) // Only top-level quests

    if (questError) {
      logger.error('Error fetching quest stats', questError)
      return { data: null, error: questError.message }
    }

    // Get issue counts
    const { data: issues, error: issueError } = await supabase
      .from('issues')
      .select('id, status, issue_type')
      .eq('attached_to_type', 'project')
      .eq('attached_to_id', projectId)

    if (issueError) {
      logger.error('Error fetching issue stats', issueError)
      return { data: null, error: issueError.message }
    }

    // Get child project count
    const { count: childCount, error: childError } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', projectId)

    if (childError) {
      logger.error('Error fetching child project count', childError)
    }

    const stats = {
      quests: {
        total: quests.length,
        completed: quests.filter(q => q.status === 'finished').length,
        in_progress: quests.filter(q => q.status === 'in_progress').length,
        on_hold: quests.filter(q => q.status === 'on_hold').length
      },
      issues: {
        total: issues.length,
        open: issues.filter(i => i.status === 'open').length,
        in_progress: issues.filter(i => i.status === 'in_progress').length,
        done: issues.filter(i => i.status === 'done').length,
        bugs: issues.filter(i => i.issue_type === 'bug').length,
        improvements: issues.filter(i => i.issue_type === 'improvement').length
      },
      child_projects: childCount || 0
    }

    logger.info(`Fetched statistics for project: ${projectId}`)
    return { data: stats, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching project statistics', err)
    return { data: null, error: err.message }
  }
}
