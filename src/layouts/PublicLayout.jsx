/**
 * ========================================
 * PUBLIC LAYOUT
 * ========================================
 * Main layout wrapper for the public frontend
 *
 * FEATURES:
 * - Top navigation bar
 * - Main content area
 * - Footer with links
 * - Responsive design
 * - RPG-themed styling
 */

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../components/Icon'
import './PublicLayout.css'

// ========================================
// PUBLIC LAYOUT COMPONENT
// ========================================

function PublicLayout({ children }) {
  // ========================================
  // STATE
  // ========================================

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  // ========================================
  // SCROLL DETECTION
  // ========================================

  /**
   * Detect scroll to add shadow to navbar
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /**
   * Close menu when route changes
   */
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  // ========================================
  // NAVIGATION ITEMS
  // ========================================

  const navItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/blog', label: 'Blog', icon: 'writing' },
    { path: '/projects', label: 'Projects', icon: 'castle' },
    { path: '/quests', label: 'Quests', icon: 'quests' }
  ]

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="public-layout">
      {/* Navigation */}
      <nav className={`public-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Logo/Brand */}
          <Link to="/" className="nav-brand">
            <Icon name="crown" size={32} />
            <span className="brand-text">Portfolio Miriam Schouten</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-links desktop-only">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Admin Link */}
          <Link to="/admin" className="admin-link desktop-only">
            <Icon name="lock" size={18} />
            <span>Admin</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Icon name={isMenuOpen ? 'cross' : 'hamburger'} size={28} />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="nav-links-mobile">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={24} />
                <span>{item.label}</span>
              </Link>
            ))}
            <Link to="/admin" className="nav-link admin-mobile">
              <Icon name="lock" size={24} />
              <span>Admin</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="public-main">{children}</main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Icon name="crown" size={28} />
            <span>Portfolio</span>
          </div>

          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/quests">Quests</Link>
          </div>

          <div className="footer-social">
            <a href="#" title="GitHub" aria-label="GitHub">
              <Icon name="web" size={24} />
            </a>
            <a href="#" title="LinkedIn" aria-label="LinkedIn">
              <Icon name="web" size={24} />
            </a>
            <a href="#" title="Email" aria-label="Email">
              <Icon name="mail" size={24} />
            </a>
          </div>

          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} Your Name. All rights reserved.</p>
            <p className="footer-theme">
              <Icon name="theme" size={16} />
              <span>Built with RPG vibes</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default PublicLayout
