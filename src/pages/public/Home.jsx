/**
 * ========================================
 * PUBLIC HOME PAGE
 * ========================================
 * Landing page for the portfolio with RPG-themed hero section
 *
 * FEATURES:
 * - Hero section with character intro
 * - Featured projects
 * - Recent blog posts
 * - Skills preview
 * - Call to action
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllPages } from '../../services/pagesService'
import { getAllQuests } from '../../services/questsService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import Tag from '../../components/Tag'
import './Home.css'

// ========================================
// HOME PAGE COMPONENT
// ========================================

function Home() {
  // ========================================
  // STATE
  // ========================================

  const [featuredProjects, setFeaturedProjects] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [activeQuests, setActiveQuests] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch featured content on mount
   */
  useEffect(() => {
    fetchContent()
  }, [])

  /**
   * Load content from database
   */
  const fetchContent = async () => {
    try {
      setIsLoading(true)

      // Fetch public pages
      const { data: pages } = await getAllPages({ visibility: 'public' })

      if (pages) {
        // Get featured projects (first 3)
        const projects = pages
          .filter((p) => p.page_type === 'project')
          .slice(0, 3)
        setFeaturedProjects(projects)

        // Get recent blog posts (first 3)
        const posts = pages
          .filter((p) => p.page_type === 'blog' || p.page_type === 'devlog')
          .slice(0, 3)
        setRecentPosts(posts)
      }

      // Fetch active quests
      const { data: quests } = await getAllQuests({ status: 'in_progress' })
      if (quests) {
        setActiveQuests(quests.slice(0, 3))
      }

      logger.info('Home page content loaded')
    } catch (err) {
      logger.error('Error fetching home content', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  /**
   * Truncate text to max length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Max characters
   * @returns {string} - Truncated text
   */
  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Icon name="crown" size={24} />
            <span>Level 99 Developer</span>
          </div>

          <h1 className="hero-title">
            Welcome, <span className="highlight">Adventurer</span>
          </h1>

          <p className="hero-subtitle">
            I&apos;m a passionate developer on a quest to build amazing digital experiences.
            Explore my projects, follow my journey, and join me on this adventure.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <Icon name="castle" size={32} />
              <div>
                <span className="stat-value">{featuredProjects.length}+</span>
                <span className="stat-label">Projects</span>
              </div>
            </div>
            <div className="stat-item">
              <Icon name="quests" size={32} />
              <div>
                <span className="stat-value">{activeQuests.length}</span>
                <span className="stat-label">Active Quests</span>
              </div>
            </div>
            <div className="stat-item">
              <Icon name="writing" size={32} />
              <div>
                <span className="stat-value">{recentPosts.length}+</span>
                <span className="stat-label">Blog Posts</span>
              </div>
            </div>
          </div>

          <div className="hero-actions">
            <Link to="/projects" className="primary-button">
              <Icon name="castle" size={24} />
              <span>View Projects</span>
            </Link>
            <Link to="/blog" className="secondary-button">
              <Icon name="writing" size={24} />
              <span>Read Blog</span>
            </Link>
          </div>
        </div>

        <div className="hero-decoration">
          <Icon name="adventure" size={200} />
        </div>
      </section>

      {/* Featured Projects */}
      <section className="section featured-projects">
        <div className="section-header">
          <Icon name="castle" size={36} />
          <h2>Featured Projects</h2>
        </div>

        {isLoading ? (
          <div className="loading-placeholder">
            <div className="loading-spinner"></div>
            <span>Loading projects...</span>
          </div>
        ) : featuredProjects.length > 0 ? (
          <div className="projects-grid">
            {featuredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/page/${project.id}`}
                className="project-card"
              >
                <div className="project-icon">
                  <Icon name="castle" size={48} />
                </div>
                <h3>{project.title}</h3>
                <p>{truncateText(project.content)}</p>
                {project.tags && project.tags.length > 0 && (
                  <div className="project-tags">
                    {project.tags.slice(0, 3).map((tag) => (
                      <Tag
                        key={tag.id}
                        name={tag.name}
                        color={tag.color}
                        size="small"
                      />
                    ))}
                  </div>
                )}
                <span className="project-date">
                  <Icon name="time" size={14} />
                  {formatDate(project.updated_at)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-section">
            <Icon name="castle" size={48} />
            <p>No projects available yet. Check back soon!</p>
          </div>
        )}

        <div className="section-footer">
          <Link to="/projects" className="view-all-link">
            <span>View All Projects</span>
            <Icon name="chevron-right" size={20} />
          </Link>
        </div>
      </section>

      {/* Active Quests */}
      <section className="section active-quests">
        <div className="section-header">
          <Icon name="quests" size={36} />
          <h2>Active Quests</h2>
        </div>

        {isLoading ? (
          <div className="loading-placeholder">
            <div className="loading-spinner"></div>
            <span>Loading quests...</span>
          </div>
        ) : activeQuests.length > 0 ? (
          <div className="quests-list-public">
            {activeQuests.map((quest) => {
              const completed = quest.sub_quests?.filter((sq) => sq.is_completed).length || 0
              const total = quest.sub_quests?.length || 0
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <Link key={quest.id} to={`/quests`} className="quest-card-public">
                  <div className="quest-icon-public">
                    <Icon
                      name={
                        quest.quest_type === 'main'
                          ? 'crown'
                          : quest.quest_type === 'future'
                          ? 'future'
                          : 'sword'
                      }
                      size={32}
                    />
                  </div>
                  <div className="quest-info-public">
                    <h4>{quest.title}</h4>
                    <div className="quest-progress-public">
                      <div className="progress-bar-small">
                        <div
                          className="progress-fill-small"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span>{percentage}% Complete</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="empty-section">
            <Icon name="quests" size={48} />
            <p>No active quests at the moment.</p>
          </div>
        )}

        <div className="section-footer">
          <Link to="/quests" className="view-all-link">
            <span>View Quest Log</span>
            <Icon name="chevron-right" size={20} />
          </Link>
        </div>
      </section>

      {/* Recent Blog Posts */}
      <section className="section recent-posts">
        <div className="section-header">
          <Icon name="writing" size={36} />
          <h2>Recent Posts</h2>
        </div>

        {isLoading ? (
          <div className="loading-placeholder">
            <div className="loading-spinner"></div>
            <span>Loading posts...</span>
          </div>
        ) : recentPosts.length > 0 ? (
          <div className="posts-list">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                to={`/page/${post.id}`}
                className="post-card"
              >
                <div className="post-type">
                  <Icon
                    name={post.page_type === 'blog' ? 'writing' : 'logbook'}
                    size={24}
                  />
                  <span>{post.page_type === 'blog' ? 'Blog' : 'Devlog'}</span>
                </div>
                <h4>{post.title}</h4>
                <p>{truncateText(post.content, 100)}</p>
                <span className="post-date">
                  <Icon name="time" size={14} />
                  {formatDate(post.updated_at)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-section">
            <Icon name="writing" size={48} />
            <p>No blog posts yet. Stay tuned!</p>
          </div>
        )}

        <div className="section-footer">
          <Link to="/blog" className="view-all-link">
            <span>View All Posts</span>
            <Icon name="chevron-right" size={20} />
          </Link>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <Icon name="mail" size={48} />
          <h2>Ready to Start Your Quest?</h2>
          <p>
            Let&apos;s collaborate on your next project or discuss opportunities.
            I&apos;m always excited to embark on new adventures!
          </p>
          <a href="mailto:your@email.com" className="cta-button">
            <Icon name="mail" size={24} />
            <span>Contact Me</span>
          </a>
        </div>
      </section>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default Home
