/**
 * ========================================
 * TAGS SERVICE
 * ========================================
 * Service for managing tags in the database
 *
 * FEATURES:
 * - Fetch all tags
 * - Create new tags
 * - Delete tags
 * - Search tags by name
 *
 * Tags are reusable across pages, quests, and future features.
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Fetch all tags from the database
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getAllTags() {
  try {
    logger.debug('Fetching all tags...')

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching tags', error)
      return { data: [], error: error.message }
    }

    logger.info(`Fetched ${data.length} tags`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching tags', err)
    return { data: [], error: err.message }
  }
}

/**
 * Search tags by name (partial match)
 * @param {string} searchTerm - The search term
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function searchTags(searchTerm) {
  try {
    logger.debug(`Searching tags for: ${searchTerm}`)

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error searching tags', error)
      return { data: [], error: error.message }
    }

    logger.info(`Found ${data.length} tags matching "${searchTerm}"`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error searching tags', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Create a new tag
 * @param {string} name - The tag name
 * @param {string} [color='#d4af37'] - The tag color (hex)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createTag(name, color = '#d4af37') {
  try {
    logger.info(`Creating new tag: ${name}`)

    // Validate input
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return { data: null, error: 'Tag name is required' }
    }

    const { data, error } = await supabase
      .from('tags')
      .insert([{ name: name.trim(), color }])
      .select()
      .single()

    if (error) {
      // Handle duplicate tag error
      if (error.code === '23505') {
        logger.warn(`Tag "${name}" already exists`)
        return { data: null, error: 'Tag already exists' }
      }
      logger.error('Error creating tag', error)
      return { data: null, error: error.message }
    }

    logger.info(`Tag created successfully: ${data.id}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error creating tag', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete a tag by ID
 * @param {string} tagId - The tag UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteTag(tagId) {
  try {
    logger.info(`Deleting tag: ${tagId}`)

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) {
      logger.error('Error deleting tag', error)
      return { success: false, error: error.message }
    }

    logger.info(`Tag deleted successfully: ${tagId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting tag', err)
    return { success: false, error: err.message }
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update a tag's color
 * @param {string} tagId - The tag UUID
 * @param {string} color - The new color (hex)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateTagColor(tagId, color) {
  try {
    logger.info(`Updating tag color: ${tagId}`)

    const { data, error } = await supabase
      .from('tags')
      .update({ color })
      .eq('id', tagId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating tag color', error)
      return { data: null, error: error.message }
    }

    logger.info(`Tag color updated successfully: ${tagId}`)
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error updating tag color', err)
    return { data: null, error: err.message }
  }
}
