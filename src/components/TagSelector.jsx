/**
 * ========================================
 * TAG SELECTOR COMPONENT
 * ========================================
 * Searchable tag selector with create capability
 * Used in page and quest forms
 *
 * FEATURES:
 * - Search existing tags
 * - Select multiple tags
 * - Create new tags
 * - Remove selected tags
 * - Visual tag display with colors
 */

import { useState, useEffect, useRef } from 'react'
import { getAllTags, searchTags, createTag } from '../services/tagsService'
import { logger } from '../utils/logger'
import Icon from './Icon'
import Tag from './Tag'
import './TagSelector.css'

// ========================================
// TAG SELECTOR COMPONENT
// ========================================

function TagSelector({ selectedTags = [], onTagsChange, placeholder = 'Search or create tags...' }) {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Search and suggestions
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [allTags, setAllTags] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Create new tag
  const [isCreating, setIsCreating] = useState(false)
  const [newTagColor, setNewTagColor] = useState('#3498db')

  // Refs
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch all tags on mount
   */
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await getAllTags()
        if (error) {
          logger.error('Error fetching tags', error)
        } else {
          setAllTags(data)
        }
      } catch (err) {
        logger.error('Unexpected error fetching tags', err)
      }
    }

    fetchTags()
  }, [])

  /**
   * Filter suggestions based on search query
   */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }

    // Filter tags that match search and aren't already selected
    const selectedIds = selectedTags.map((t) => t.id)
    const filtered = allTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedIds.includes(tag.id)
    )

    setSuggestions(filtered)
  }, [searchQuery, allTags, selectedTags])

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle search input change
   * @param {Event} e - Input change event
   */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setShowSuggestions(true)
  }

  /**
   * Handle input focus
   */
  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  /**
   * Handle clicking outside to close suggestions
   */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Select a tag from suggestions
   * @param {Object} tag - Tag to select
   */
  const handleSelectTag = (tag) => {
    const newSelected = [...selectedTags, tag]
    onTagsChange(newSelected)
    setSearchQuery('')
    setShowSuggestions(false)
    logger.info(`Tag selected: ${tag.name}`)
  }

  /**
   * Remove a selected tag
   * @param {string} tagId - ID of tag to remove
   */
  const handleRemoveTag = (tagId) => {
    const newSelected = selectedTags.filter((t) => t.id !== tagId)
    onTagsChange(newSelected)
    logger.info(`Tag removed: ${tagId}`)
  }

  /**
   * Create a new tag
   */
  const handleCreateTag = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsCreating(true)
      logger.info(`Creating new tag: ${searchQuery}`)

      const { data, error } = await createTag({
        name: searchQuery.trim(),
        color: newTagColor
      })

      if (error) {
        logger.error('Error creating tag', error)
      } else if (data) {
        // Add to all tags list
        setAllTags([...allTags, data])

        // Select the new tag
        const newSelected = [...selectedTags, data]
        onTagsChange(newSelected)

        logger.info(`Tag created and selected: ${data.name}`)
      }
    } catch (err) {
      logger.error('Unexpected error creating tag', err)
    } finally {
      setIsCreating(false)
      setSearchQuery('')
      setShowSuggestions(false)
    }
  }

  /**
   * Handle key press in input
   * @param {KeyboardEvent} e - Key event
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault()

      // If there's an exact match, select it
      const exactMatch = suggestions.find(
        (tag) => tag.name.toLowerCase() === searchQuery.toLowerCase()
      )

      if (exactMatch) {
        handleSelectTag(exactMatch)
      } else if (suggestions.length > 0) {
        // Select first suggestion
        handleSelectTag(suggestions[0])
      } else {
        // Create new tag
        handleCreateTag()
      }
    }
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Check if current search can create a new tag
   * @returns {boolean} - True if can create
   */
  const canCreateTag = () => {
    if (!searchQuery.trim()) return false

    // Check if tag with this name already exists
    const exists = allTags.some(
      (tag) => tag.name.toLowerCase() === searchQuery.toLowerCase()
    )

    return !exists
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="tag-selector">
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="selected-tags">
          {selectedTags.map((tag) => (
            <Tag
              key={tag.id}
              name={tag.name}
              color={tag.color}
              size="normal"
              onRemove={() => handleRemoveTag(tag.id)}
            />
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="tag-search-wrapper">
        <div className="tag-search-input">
          <Icon name="magnifier" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isCreating}
          />
          {isLoading && <div className="tag-loading-spinner"></div>}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (searchQuery.trim() || suggestions.length > 0) && (
          <div className="tag-suggestions" ref={suggestionsRef}>
            {suggestions.length > 0 && (
              <div className="suggestions-list">
                {suggestions.slice(0, 10).map((tag) => (
                  <button
                    key={tag.id}
                    className="suggestion-item"
                    onClick={() => handleSelectTag(tag)}
                    type="button"
                  >
                    <span
                      className="suggestion-color"
                      style={{ backgroundColor: tag.color }}
                    ></span>
                    <span className="suggestion-name">{tag.name}</span>
                    <Icon name="plus" size={16} />
                  </button>
                ))}
              </div>
            )}

            {/* Create New Tag Option */}
            {canCreateTag() && (
              <div className="create-tag-section">
                <div className="create-tag-header">
                  <Icon name="plus" size={18} />
                  <span>Create &quot;{searchQuery}&quot;</span>
                </div>
                <div className="create-tag-options">
                  <div className="color-picker">
                    <label>Color:</label>
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                    />
                    <span
                      className="color-preview"
                      style={{ backgroundColor: newTagColor }}
                    ></span>
                  </div>
                  <button
                    className="create-tag-button"
                    onClick={handleCreateTag}
                    disabled={isCreating}
                    type="button"
                  >
                    {isCreating ? 'Creating...' : 'Create Tag'}
                  </button>
                </div>
              </div>
            )}

            {/* No Results */}
            {searchQuery.trim() && suggestions.length === 0 && !canCreateTag() && (
              <div className="no-suggestions">
                <Icon name="cross" size={18} />
                <span>Tag already selected</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default TagSelector
