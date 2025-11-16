/**
 * ========================================
 * INVENTORY SERVICE
 * ========================================
 * Service for managing inventory items and achievements
 *
 * FEATURES:
 * - CRUD operations for inventory items
 * - Support for both inventory and achievement types
 * - Tag management
 * - Sort order management for drag-and-drop
 * - Visibility filtering
 *
 * ITEM TYPES:
 * - inventory: Projects, tools, artifacts (box display)
 * - achievement: Certificates, courses, badges (achievement display)
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Fetch all inventory items with their tags
 * @param {Object} [options] - Filter options
 * @param {string} [options.itemType] - Filter by item type ('inventory' or 'achievement')
 * @param {string} [options.visibility] - Filter by visibility
 * @param {boolean} [options.includePrivate=true] - Include private items
 * @param {number} [options.limit] - Limit number of results
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getAllInventoryItems(options = {}) {
  try {
    logger.debug('Fetching inventory items...', options)

    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        inventory_item_tags (
          tag_id,
          tags (id, name, color)
        )
      `)
      .order('sort_order', { ascending: true })

    // Apply filters
    if (options.itemType) {
      query = query.eq('item_type', options.itemType)
    }

    if (options.visibility) {
      query = query.eq('visibility', options.visibility)
    } else if (options.includePrivate === false) {
      query = query.eq('visibility', 'public')
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching inventory items', error)
      return { data: [], error: error.message }
    }

    // Transform data to flatten tags
    const transformedData = data.map(item => ({
      ...item,
      tags: item.inventory_item_tags?.map(it => it.tags) || []
    }))

    logger.info(`Fetched ${transformedData.length} inventory items`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching inventory items', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch a single inventory item by ID
 * @param {string} itemId - The item UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getInventoryItemById(itemId) {
  try {
    logger.debug(`Fetching inventory item: ${itemId}`)

    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        inventory_item_tags (
          tag_id,
          tags (id, name, color)
        )
      `)
      .eq('id', itemId)
      .single()

    if (error) {
      logger.error('Error fetching inventory item', error)
      return { data: null, error: error.message }
    }

    // Transform data
    const transformedData = {
      ...data,
      tags: data.inventory_item_tags?.map(it => it.tags) || []
    }

    logger.info(`Fetched inventory item: ${itemId}`)
    return { data: transformedData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching inventory item', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Create a new inventory item
 * @param {Object} itemData - The item data
 * @param {string} itemData.item_name - Display name (required)
 * @param {string} itemData.title - Internal title (required)
 * @param {string} [itemData.item_type='inventory'] - Item type
 * @param {string} [itemData.visibility='public'] - Visibility
 * @param {string} [itemData.icon_name='treasure-chest'] - Icon name
 * @param {string} [itemData.popup_content] - Popup HTML content
 * @param {Array} [tagIds=[]] - Array of tag UUIDs
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createInventoryItem(itemData, tagIds = []) {
  try {
    logger.info('Creating new inventory item:', itemData.title)

    // Validate required fields
    if (!itemData.item_name || itemData.item_name.trim() === '') {
      return { data: null, error: 'Item name is required' }
    }

    if (!itemData.title || itemData.title.trim() === '') {
      return { data: null, error: 'Item title is required' }
    }

    // Get the next sort order
    const { data: existingItems } = await supabase
      .from('inventory_items')
      .select('sort_order')
      .eq('item_type', itemData.item_type || 'inventory')
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existingItems && existingItems.length > 0
      ? existingItems[0].sort_order + 1
      : 0

    // Clean item fields
    const cleanItemData = {
      item_name: itemData.item_name.trim(),
      title: itemData.title.trim(),
      item_type: itemData.item_type || 'inventory',
      visibility: itemData.visibility || 'public',
      icon_name: itemData.icon_name || 'treasure-chest',
      popup_content: itemData.popup_content || '',
      sort_order: nextOrder
    }

    // Insert the item
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .insert([cleanItemData])
      .select()
      .single()

    if (itemError) {
      logger.error('Error creating inventory item', itemError)
      return { data: null, error: itemError.message }
    }

    logger.debug(`Inventory item created with ID: ${item.id}`)

    // Add tags if provided
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        item_id: item.id,
        tag_id: tagId
      }))

      const { error: tagError } = await supabase
        .from('inventory_item_tags')
        .insert(tagRelations)

      if (tagError) {
        logger.warn('Error adding tags to inventory item', tagError)
      }
    }

    // Fetch the complete item with relations
    const result = await getInventoryItemById(item.id)
    logger.info(`Inventory item created successfully: ${item.id}`)
    return result
  } catch (err) {
    logger.error('Unexpected error creating inventory item', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update an existing inventory item
 * @param {string} itemId - The item UUID
 * @param {Object} itemData - The updated item data
 * @param {Array} [tagIds] - Array of tag UUIDs (replaces existing)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateInventoryItem(itemId, itemData, tagIds) {
  try {
    logger.info(`Updating inventory item: ${itemId}`)

    // Update the item itself
    if (Object.keys(itemData).length > 0) {
      const { error: itemError } = await supabase
        .from('inventory_items')
        .update(itemData)
        .eq('id', itemId)

      if (itemError) {
        logger.error('Error updating inventory item', itemError)
        return { data: null, error: itemError.message }
      }
    }

    // Update tags if provided (replace all existing tags)
    if (tagIds !== undefined) {
      // Delete existing tags
      await supabase.from('inventory_item_tags').delete().eq('item_id', itemId)

      // Insert new tags
      if (tagIds.length > 0) {
        const tagRelations = tagIds.map(tagId => ({
          item_id: itemId,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('inventory_item_tags')
          .insert(tagRelations)

        if (tagError) {
          logger.warn('Error updating inventory item tags', tagError)
        }
      }
    }

    // Fetch and return the updated item
    const result = await getInventoryItemById(itemId)
    logger.info(`Inventory item updated successfully: ${itemId}`)
    return result
  } catch (err) {
    logger.error('Unexpected error updating inventory item', err)
    return { data: null, error: err.message }
  }
}

/**
 * Update sort order for multiple items (for drag-and-drop)
 * @param {Array} items - Array of { id, sort_order } objects
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function updateInventoryItemsOrder(items) {
  try {
    logger.info(`Updating sort order for ${items.length} items`)

    // Update each item's sort_order
    for (const item of items) {
      const { error } = await supabase
        .from('inventory_items')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)

      if (error) {
        logger.error(`Error updating sort order for item ${item.id}`, error)
        return { success: false, error: error.message }
      }
    }

    logger.info('Sort order updated successfully')
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error updating sort order', err)
    return { success: false, error: err.message }
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete an inventory item by ID
 * @param {string} itemId - The item UUID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteInventoryItem(itemId) {
  try {
    logger.info(`Deleting inventory item: ${itemId}`)

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      logger.error('Error deleting inventory item', error)
      return { success: false, error: error.message }
    }

    logger.info(`Inventory item deleted successfully: ${itemId}`)
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting inventory item', err)
    return { success: false, error: err.message }
  }
}
