/**
 * ========================================
 * CHARACTER SETTINGS SERVICE
 * ========================================
 * Service for managing character profile settings
 *
 * FEATURES:
 * - Fetch character settings
 * - Update character settings
 * - Upload profile picture
 * - Manage action buttons
 * - Manage languages, frameworks, and tools
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// FETCH OPERATIONS
// ========================================

/**
 * Fetch character settings
 * Returns the first (and only) row from character_settings table
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getCharacterSettings() {
  try {
    logger.debug('Fetching character settings...')

    const { data, error } = await supabase
      .from('character_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      logger.error('Error fetching character settings', error)
      return { data: null, error: error.message }
    }

    logger.info('Character settings fetched successfully')
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching character settings', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update character settings
 * @param {Object} settingsData - The updated settings data
 * @param {string} [settingsData.profile_picture_url] - Profile picture URL
 * @param {string} [settingsData.display_name] - Display name
 * @param {string} [settingsData.subtitle] - Subtitle
 * @param {string} [settingsData.description] - Description
 * @param {string} [settingsData.class] - Character class
 * @param {string} [settingsData.location] - Location
 * @param {string} [settingsData.current_quest] - Current quest
 * @param {string} [settingsData.birthday] - Birthday (YYYY-MM-DD)
 * @param {string} [settingsData.linkedin_url] - LinkedIn URL
 * @param {Array<string>} [settingsData.languages] - Array of languages
 * @param {Array<string>} [settingsData.frameworks] - Array of frameworks
 * @param {Array<string>} [settingsData.tools] - Array of tools
 * @param {Array<Object>} [settingsData.action_buttons] - Array of action buttons
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateCharacterSettings(settingsData) {
  try {
    logger.info('Updating character settings...')

    // Get the existing settings to get the ID
    const { data: existing, error: fetchError } = await getCharacterSettings()

    if (fetchError || !existing) {
      logger.error('Cannot update - no existing settings found')
      return { data: null, error: 'No existing settings found' }
    }

    // Clean the data - remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(settingsData).filter(([_, v]) => v !== undefined)
    )

    // Update the settings (bypassing RLS by using service role - will be handled by admin auth)
    const { data, error } = await supabase
      .from('character_settings')
      .update(cleanData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating character settings', error)
      return { data: null, error: error.message }
    }

    logger.info('Character settings updated successfully')
    return { data, error: null }
  } catch (err) {
    logger.error('Unexpected error updating character settings', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// PROFILE PICTURE OPERATIONS
// ========================================

/**
 * Upload profile picture to Supabase Storage
 * @param {File} file - The image file to upload
 * @returns {Promise<{url: string|null, error: string|null}>}
 */
export async function uploadProfilePicture(file) {
  try {
    logger.info('Uploading profile picture...')

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP).' }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { url: null, error: 'File too large. Maximum size is 5MB.' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `profile-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      logger.error('Error uploading profile picture', error)
      return { url: null, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(data.path)

    logger.info('Profile picture uploaded successfully')
    return { url: publicUrl, error: null }
  } catch (err) {
    logger.error('Unexpected error uploading profile picture', err)
    return { url: null, error: err.message }
  }
}

/**
 * Delete profile picture from Supabase Storage
 * @param {string} url - The profile picture URL to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteProfilePicture(url) {
  try {
    logger.info('Deleting profile picture...')

    // Extract the file path from the URL
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]

    const { error } = await supabase.storage
      .from('profile-pictures')
      .remove([fileName])

    if (error) {
      logger.error('Error deleting profile picture', error)
      return { success: false, error: error.message }
    }

    logger.info('Profile picture deleted successfully')
    return { success: true, error: null }
  } catch (err) {
    logger.error('Unexpected error deleting profile picture', err)
    return { success: false, error: err.message }
  }
}

// ========================================
// ARRAY MANAGEMENT HELPERS
// ========================================

/**
 * Add an item to a list (languages, frameworks, or tools)
 * @param {string} listType - The list type: 'languages', 'frameworks', or 'tools'
 * @param {string} item - The item to add
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function addToList(listType, item) {
  try {
    const { data: current, error: fetchError } = await getCharacterSettings()
    if (fetchError || !current) {
      return { data: null, error: 'Failed to fetch current settings' }
    }

    const currentList = current[listType] || []

    // Don't add duplicates
    if (currentList.includes(item)) {
      return { data: current, error: 'Item already exists in list' }
    }

    const updatedList = [...currentList, item]
    return updateCharacterSettings({ [listType]: updatedList })
  } catch (err) {
    logger.error(`Error adding to ${listType}`, err)
    return { data: null, error: err.message }
  }
}

/**
 * Remove an item from a list (languages, frameworks, or tools)
 * @param {string} listType - The list type: 'languages', 'frameworks', or 'tools'
 * @param {string} item - The item to remove
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function removeFromList(listType, item) {
  try {
    const { data: current, error: fetchError } = await getCharacterSettings()
    if (fetchError || !current) {
      return { data: null, error: 'Failed to fetch current settings' }
    }

    const currentList = current[listType] || []
    const updatedList = currentList.filter(i => i !== item)

    return updateCharacterSettings({ [listType]: updatedList })
  } catch (err) {
    logger.error(`Error removing from ${listType}`, err)
    return { data: null, error: err.message }
  }
}

// ========================================
// ACTION BUTTONS MANAGEMENT
// ========================================

/**
 * Add an action button
 * @param {Object} button - The button data
 * @param {string} button.label - Button label
 * @param {string} button.url - Button URL
 * @param {string} button.icon - Icon name
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function addActionButton(button) {
  try {
    const { data: current, error: fetchError } = await getCharacterSettings()
    if (fetchError || !current) {
      return { data: null, error: 'Failed to fetch current settings' }
    }

    const currentButtons = current.action_buttons || []
    const updatedButtons = [...currentButtons, button]

    return updateCharacterSettings({ action_buttons: updatedButtons })
  } catch (err) {
    logger.error('Error adding action button', err)
    return { data: null, error: err.message }
  }
}

/**
 * Update an action button by index
 * @param {number} index - The button index
 * @param {Object} button - The updated button data
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateActionButton(index, button) {
  try {
    const { data: current, error: fetchError } = await getCharacterSettings()
    if (fetchError || !current) {
      return { data: null, error: 'Failed to fetch current settings' }
    }

    const currentButtons = current.action_buttons || []
    if (index < 0 || index >= currentButtons.length) {
      return { data: null, error: 'Invalid button index' }
    }

    const updatedButtons = [...currentButtons]
    updatedButtons[index] = button

    return updateCharacterSettings({ action_buttons: updatedButtons })
  } catch (err) {
    logger.error('Error updating action button', err)
    return { data: null, error: err.message }
  }
}

/**
 * Remove an action button by index
 * @param {number} index - The button index to remove
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function removeActionButton(index) {
  try {
    const { data: current, error: fetchError } = await getCharacterSettings()
    if (fetchError || !current) {
      return { data: null, error: 'Failed to fetch current settings' }
    }

    const currentButtons = current.action_buttons || []
    if (index < 0 || index >= currentButtons.length) {
      return { data: null, error: 'Invalid button index' }
    }

    const updatedButtons = currentButtons.filter((_, i) => i !== index)

    return updateCharacterSettings({ action_buttons: updatedButtons })
  } catch (err) {
    logger.error('Error removing action button', err)
    return { data: null, error: err.message }
  }
}
