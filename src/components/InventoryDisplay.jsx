/**
 * ========================================
 * INVENTORY DISPLAY COMPONENT
 * ========================================
 * Displays inventory items in a box grid layout
 *
 * FEATURES:
 * - Box-style grid display
 * - Limited to specified number of items
 * - "Show all" link when more items available
 * - Click on item to open popup modal
 * - Hover effects with item preview
 * - Responsive grid layout
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllInventoryItems } from '../services/inventoryService'
import { logger } from '../utils/logger'
import Icon from './Icon'
import ItemPopupModal from './ItemPopupModal'
import './InventoryDisplay.css'

// ========================================
// INVENTORY DISPLAY COMPONENT
// ========================================

/**
 * InventoryDisplay - Shows inventory items in a grid with empty slots
 * @param {Object} props - Component props
 * @param {number} [props.limit=10] - Maximum items to display (total slots)
 * @param {boolean} [props.showHeader=true] - Show section header
 * @param {boolean} [props.showAll=false] - Show all items (ignore limit)
 */
function InventoryDisplay({ limit = 10, showHeader = true, showAll = false }) {
  // ========================================
  // STATE
  // ========================================

  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch inventory items on mount
   */
  useEffect(() => {
    fetchItems()
  }, [])

  /**
   * Load inventory items from database
   */
  const fetchItems = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await getAllInventoryItems({
        itemType: 'inventory',
        visibility: 'public'
      })

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching inventory items', fetchError)
      } else {
        setItems(data || [])
        logger.info(`Fetched ${data?.length || 0} inventory items`)
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching inventory', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Handle item click to open modal
   * @param {Object} item - The clicked item
   */
  const handleItemClick = (item) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  // ========================================
  // COMPUTED VALUES
  // ========================================

  // Get items to display based on limit
  const displayItems = showAll ? items : items.slice(0, limit)
  const hasMore = !showAll && items.length > limit
  const remainingCount = items.length - limit

  // Calculate empty slots
  const totalSlots = showAll ? items.length : limit
  const emptySlots = Math.max(0, totalSlots - displayItems.length)

  // ========================================
  // RENDER
  // ========================================

  // Error state
  if (error) {
    return (
      <div className="inventory-display-container">
        {showHeader && (
          <div className="inventory-display-header">
            <div className="header-title">
              <Icon name="treasure-chest" size={36} />
              <h2>Inventory</h2>
            </div>
          </div>
        )}
        <div className="inventory-error">
          <Icon name="cross" size={32} />
          <p>Failed to load inventory</p>
        </div>
      </div>
    )
  }

  return (
    <div className="inventory-display-container">
      {/* Header */}
      {showHeader && (
        <div className="inventory-display-header">
          <div className="header-title">
            <Icon name="treasure-chest" size={36} />
            <h2>Inventory</h2>
          </div>
          <Link to="/inventory" className="show-all-link">
            Show All Inventory
          </Link>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="inventory-loading">
          <div className="loading-spinner"></div>
          <span>Loading inventory...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="inventory-empty">
          <Icon name="treasure-chest" size={48} />
          <p>No items in inventory yet</p>
        </div>
      )}

      {/* Items Grid */}
      {!isLoading && (
        <div className="inventory-grid">
          {/* Display filled slots */}
          {displayItems.map((item) => (
            <button
              key={item.id}
              className="inventory-item-box filled"
              onClick={() => handleItemClick(item)}
              title={item.item_name}
            >
              <div className="item-box-icon">
                <Icon name={item.icon_name || 'treasure-chest'} size={40} />
              </div>
              <span className="item-box-name">{item.item_name}</span>
            </button>
          ))}

          {/* Display empty slots */}
          {!showAll && Array.from({ length: emptySlots }).map((_, index) => (
            <div key={`empty-${index}`} className="inventory-item-box empty">
              <div className="item-box-icon empty-icon">
                <Icon name="circle" size={40} />
              </div>
              <span className="item-box-name empty-label">Empty</span>
            </div>
          ))}
        </div>
      )}

      {/* Item Popup Modal */}
      <ItemPopupModal item={selectedItem} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default InventoryDisplay
