/**
 * ========================================
 * FULL INVENTORY PAGE
 * ========================================
 * Public page showing all inventory items
 *
 * FEATURES:
 * - Shows all inventory items without limit
 * - Same grid layout as home page
 * - Click to view item details
 * - Back button to home
 */

import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import InventoryDisplay from '../../components/InventoryDisplay'
import './FullInventory.css'

// ========================================
// FULL INVENTORY PAGE COMPONENT
// ========================================

function FullInventory() {
  return (
    <div className="full-inventory-page">
      {/* Page Header */}
      <div className="full-page-header">
        <Link to="/" className="back-to-home">
          <Icon name="chevron-left" size={20} />
          <span>Back to Home</span>
        </Link>
        <h1 className="full-page-title">
          <Icon name="treasure-chest" size={48} />
          Full Inventory
        </h1>
        <p className="full-page-subtitle">
          Explore all the items collected on this adventure
        </p>
      </div>

      {/* Full Inventory Display */}
      <div className="full-inventory-content">
        <InventoryDisplay limit={100} showHeader={false} showAll={true} />
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default FullInventory
