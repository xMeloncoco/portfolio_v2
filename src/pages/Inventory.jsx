/**
 * ========================================
 * INVENTORY MANAGEMENT PAGE (Admin)
 * ========================================
 * List view for managing inventory items and achievements
 *
 * FEATURES:
 * - List all items with drag-to-reorder
 * - Filter by type (inventory/achievement)
 * - Create new items
 * - Edit existing items
 * - Delete items with confirmation
 * - Preview how items will look on frontend
 * - Shows tags and visibility status
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAllInventoryItems,
  deleteInventoryItem,
  updateInventoryItemsOrder
} from '../services/inventoryService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import Tag from '../components/Tag'
import ConfirmModal from '../components/ConfirmModal'
import './Inventory.css'

// ========================================
// INVENTORY COMPONENT
// ========================================

function Inventory() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Items data
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtering
  const [filterType, setFilterType] = useState('all')

  // Drag and drop
  const [draggedIndex, setDraggedIndex] = useState(null)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Navigation
  const navigate = useNavigate()

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch all inventory items from the database
   */
  const fetchItems = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info('Fetching inventory items...')

      const options = {}
      if (filterType !== 'all') {
        options.itemType = filterType
      }

      const { data, error: fetchError } = await getAllInventoryItems(options)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching inventory items', fetchError)
      } else {
        setItems(data)
        logger.info(`Loaded ${data.length} inventory items`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching inventory items', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch items on mount and when filter changes
  useEffect(() => {
    fetchItems()
  }, [filterType])

  // ========================================
  // DRAG AND DROP HANDLERS
  // ========================================

  /**
   * Handle drag start
   * @param {number} index - Index of dragged item
   */
  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  /**
   * Handle drag over
   * @param {Event} e - Drag event
   */
  const handleDragOver = (e) => {
    e.preventDefault()
  }

  /**
   * Handle drop for reordering
   * @param {number} dropIndex - Index where item is dropped
   */
  const handleDrop = async (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newItems = [...items]
    const draggedItem = newItems[draggedIndex]

    // Remove from old position
    newItems.splice(draggedIndex, 1)
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItem)

    // Update local state immediately for responsive UI
    setItems(newItems)
    setDraggedIndex(null)

    // Update sort_order in database
    const updatedOrder = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index
    }))

    const { error: orderError } = await updateInventoryItemsOrder(updatedOrder)
    if (orderError) {
      logger.error('Error saving new order', orderError)
      // Revert on error
      fetchItems()
    } else {
      logger.info('Order updated successfully')
    }
  }

  /**
   * Handle drag end (cleanup)
   */
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Navigate to create new item
   */
  const handleCreateItem = () => {
    navigate('/admin/inventory/new')
  }

  /**
   * Navigate to edit item
   * @param {string} itemId - Item UUID
   */
  const handleEditItem = (itemId) => {
    navigate(`/admin/inventory/${itemId}/edit`)
  }

  /**
   * Open delete confirmation modal
   * @param {Object} item - Item object
   */
  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  /**
   * Confirm item deletion
   */
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    try {
      setIsDeleting(true)
      logger.info(`Deleting item: ${itemToDelete.id}`)

      const { success, error: deleteError } = await deleteInventoryItem(itemToDelete.id)

      if (deleteError) {
        setError(deleteError)
        logger.error('Error deleting item', deleteError)
      } else if (success) {
        logger.info(`Item deleted successfully: ${itemToDelete.id}`)
        await fetchItems()
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error deleting item', err)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  /**
   * Handle filter change
   * @param {string} type - Item type to filter by
   */
  const handleFilterChange = (type) => {
    setFilterType(type)
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="inventory-container">
      {/* Page Header */}
      <div className="inventory-header">
        <div className="inventory-title-section">
          <Icon name="treasure-chest" size={48} />
          <div>
            <h1>Inventory</h1>
            <p className="inventory-subtitle">Manage your items and achievements</p>
          </div>
        </div>

        <button
          className="create-button"
          onClick={handleCreateItem}
          title="Create new item"
        >
          <Icon name="plus" size={24} />
          <span>New Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="inventory-filters">
        <div className="filter-group">
          <span className="filter-label">Filter by type:</span>
          <div className="filter-buttons">
            <button
              className={`filter-button ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            <button
              className={`filter-button ${filterType === 'inventory' ? 'active' : ''}`}
              onClick={() => handleFilterChange('inventory')}
            >
              <Icon name="treasure-chest" size={18} />
              Inventory
            </button>
            <button
              className={`filter-button ${filterType === 'achievement' ? 'active' : ''}`}
              onClick={() => handleFilterChange('achievement')}
            >
              <Icon name="trophy" size={18} />
              Achievements
            </button>
          </div>
        </div>

        <div className="inventory-count">
          {!isLoading && (
            <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <Icon name="idea" size={20} />
        <span>Drag items to reorder how they appear on the frontend</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <Icon name="cross" size={24} />
          <span>{error}</span>
          <button onClick={fetchItems} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading inventory...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="empty-state">
          <Icon name="treasure-chest" size={64} />
          <h2>No items yet</h2>
          <p>
            {filterType === 'all'
              ? 'Create your first inventory item or achievement!'
              : `No ${filterType} items found.`}
          </p>
          <button className="create-button" onClick={handleCreateItem}>
            <Icon name="plus" size={24} />
            <span>Create Item</span>
          </button>
        </div>
      )}

      {/* Items List */}
      {!isLoading && !error && items.length > 0 && (
        <div className="inventory-list">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`inventory-item ${draggedIndex === index ? 'dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
            >
              {/* Drag Handle */}
              <div className="drag-handle" title="Drag to reorder">
                <Icon name="menu" size={20} />
              </div>

              {/* Sort Order Badge */}
              <div className="sort-order-badge">
                #{index + 1}
              </div>

              {/* Item Icon */}
              <div className={`item-icon-box ${item.item_type}`}>
                <Icon name={item.icon_name || 'treasure-chest'} size={32} />
              </div>

              {/* Item Info */}
              <div className="item-info">
                <h3 className="item-name">{item.item_name}</h3>
                <p className="item-title">{item.title}</p>

                <div className="item-meta">
                  <span className={`item-type-badge ${item.item_type}`}>
                    <Icon
                      name={item.item_type === 'achievement' ? 'trophy' : 'treasure-chest'}
                      size={14}
                    />
                    {item.item_type}
                  </span>

                  <span className={`item-visibility ${item.visibility}`}>
                    <Icon name={item.visibility === 'public' ? 'web' : 'lock'} size={14} />
                    {item.visibility}
                  </span>
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="item-tags">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Tag
                        key={tag.id}
                        name={tag.name}
                        color={tag.color}
                        size="small"
                      />
                    ))}
                    {item.tags.length > 3 && (
                      <span className="more-tags">+{item.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="item-actions">
                <button
                  className="action-button edit"
                  onClick={() => handleEditItem(item.id)}
                  title="Edit item"
                >
                  <Icon name="edit-pencil" size={20} />
                </button>
                <button
                  className="action-button delete"
                  onClick={() => handleDeleteClick(item)}
                  title="Delete item"
                >
                  <Icon name="trash-can" size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.item_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default Inventory
