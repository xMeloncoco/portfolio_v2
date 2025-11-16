/**
 * ========================================
 * ADMIN LAYOUT
 * ========================================
 * Layout component for admin pages
 * Includes navigation sidebar and main content area
 *
 * FEATURES:
 * - Responsive sidebar navigation
 * - Mobile menu toggle
 * - Logout functionality
 * - Active route highlighting
 * - Uses custom icons
 *
 * USAGE:
 * <AdminLayout>
 *   <YourPageComponent />
 * </AdminLayout>
 */

import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../utils/auth'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import './AdminLayout.css'

// ========================================
// NAVIGATION CONFIGURATION
// ========================================

/**
 * Navigation menu items
 * Each item has:
 * - path: Route path
 * - icon: Icon name (from your icon set)
 * - label: Display text
 * - description: Tooltip/accessible description
 */
const NAV_ITEMS = [
  {
    path: '/admin',
    icon: 'home',
    label: 'Overview',
    description: 'Admin dashboard overview'
  },
  {
    path: '/admin/character-stats',
    icon: 'default-user',
    label: 'Character Stats',
    description: 'Edit character stats (Phase 8)'
  },
  {
    path: '/admin/pages',
    icon: 'parchment',
    label: 'Pages',
    description: 'Manage pages (Phase 2)'
  },
  {
    path: '/admin/quests',
    icon: 'adventure',
    label: 'Quests',
    description: 'Manage quests (Phase 3)'
  },
  {
    path: '/admin/inventory',
    icon: 'treasure-chest',
    label: 'Inventory',
    description: 'Manage inventory & achievements (Phase 4)'
  },
  {
    path: '/admin/skills',
    icon: 'skills',
    label: 'Skills',
    description: 'Manage skills (Later phase)'
  },
  {
    path: '/admin/theme',
    icon: 'theme',
    label: 'Theme',
    description: 'Theme settings (Later phase)'
  }
]

// ========================================
// ADMIN LAYOUT COMPONENT
// ========================================

/**
 * AdminLayout Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to display
 */
function AdminLayout({ children }) {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Mobile menu open/closed state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // React Router navigation
  const navigate = useNavigate()

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Toggle mobile menu open/closed
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    logger.debug(`Mobile menu ${!isMobileMenuOpen ? 'opened' : 'closed'}`)
  }

  /**
   * Close mobile menu
   * Called when a nav link is clicked
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    logger.debug('Mobile menu closed')
  }

  /**
   * Handle logout
   * Clears authentication and redirects to login
   */
  const handleLogout = () => {
    logger.info('Logout initiated')

    try {
      // Clear authentication
      logout()

      // Redirect to login page
      navigate('/admin/login')

      logger.info('Logout successful')
    } catch (error) {
      logger.error('Error during logout', error)
      // Still try to redirect even if logout fails
      navigate('/admin/login')
    }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="admin-layout">
      {/* ========================================
       * SIDEBAR NAVIGATION
       * ======================================== */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar header */}
        <div className="sidebar-header">
          <Icon name="castle" size={48} alt="Castle icon" />
          <h1 className="sidebar-title">Admin Portal</h1>
        </div>

        {/* Navigation menu */}
        <nav className="sidebar-nav" aria-label="Admin navigation">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  end={item.path === '/admin'} // Exact match for overview
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMobileMenu}
                  title={item.description}
                  aria-label={item.description}
                >
                  <Icon name={item.icon} size={28} alt="" />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout button at bottom */}
        <div className="sidebar-footer">
          <button
            className="logout-button"
            onClick={handleLogout}
            title="Logout from admin portal"
            aria-label="Logout"
          >
            <Icon name="logout" size={28} alt="" />
            <span>Logout</span>
          </button>
        </div>

        {/* Close button for mobile */}
        <button
          className="mobile-close-button"
          onClick={toggleMobileMenu}
          aria-label="Close menu"
        >
          <Icon name="cross" size={28} alt="" />
        </button>
      </aside>

      {/* ========================================
       * MOBILE OVERLAY
       * ======================================== */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* ========================================
       * MAIN CONTENT AREA
       * ======================================== */}
      <div className="admin-main">
        {/* Mobile header with menu button */}
        <header className="mobile-header">
          <button
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
          >
            <Icon name="menu" size={32} alt="" />
          </button>

          <div className="mobile-header-title">
            <Icon name="castle" size={32} alt="" />
            <span>Admin Portal</span>
          </div>

          <button
            className="mobile-logout-button"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <Icon name="logout" size={28} alt="" />
          </button>
        </header>

        {/* Page content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default AdminLayout
