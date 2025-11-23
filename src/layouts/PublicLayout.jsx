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
import ContactForm from '../components/ContactForm'
import { getCharacterSettings } from '../services/characterSettingsService'
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
  const [displayName, setDisplayName] = useState('Portfolio Miriam Schouten')
  const [showContactForm, setShowContactForm] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const location = useLocation()

  // ========================================
  // FETCH CHARACTER NAME
  // ========================================

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await getCharacterSettings()
      if (data?.display_name) {
        setDisplayName(`Portfolio ${data.display_name}`)
      }
    }
    fetchSettings()
  }, [])

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
    { path: '/blog', label: 'Posts', icon: 'writing' },
    { path: '/projects', label: 'Projects', icon: 'castle' },
    { path: '/quests', label: 'Quests', icon: 'quests' }
  ]

  // ========================================
  // CONTACT FORM HANDLERS
  // ========================================

  const handleContactClick = () => {
    setShowContactForm(true)
    setShowSuccessMessage(false)
  }

  const handleCloseContactForm = () => {
    setShowContactForm(false)
  }

  const handleContactSuccess = () => {
    setShowSuccessMessage(true)
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 5000)
  }

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
            <span className="brand-text">{displayName}</span>
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
          {/* Contact Me Button */}
          <button className="footer-contact-button" onClick={handleContactClick}>
            <Icon name="mail" size={20} />
            <span>Contact Me</span>
          </button>

          {/* Navigation Links */}
          <nav className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/blog">Posts</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/quests">Quests</Link>
          </nav>

          {/* Copyright */}
          <div className="footer-copyright">
            <p>
              &copy; 2025 Miriam Schouten. Icons by{' '}
              <a
                href="https://icons8.com"
                target="_blank"
                rel="noopener noreferrer"
                className="icons8-link"
              >
                icons8
              </a>
              .
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Form */}
      <ContactForm
        isOpen={showContactForm}
        onClose={handleCloseContactForm}
        onSuccess={handleContactSuccess}
      />

      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="success-toast">
          <Icon name="done" size={24} />
          <p>Message sent successfully! I&apos;ll get back to you soon.</p>
        </div>
      )}
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default PublicLayout
