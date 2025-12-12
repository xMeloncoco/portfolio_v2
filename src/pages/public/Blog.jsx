/**
 * ========================================
 * PUBLIC BLOG PAGE
 * ========================================
 * Lists all public blog posts and notes
 *
 * FEATURES:
 * - Filter by type (Blog/Notes)
 * - Tag filtering
 * - Sorted by date
 * - Responsive grid layout
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllPages } from '../../services/pagesService'
import { logger } from '../../utils/logger'
import Icon from '../../components/Icon'
import Tag from '../../components/Tag'
import './Blog.css'

// ========================================
// BLOG PAGE COMPONENT
// ========================================

function Blog() {
  // ========================================
  // STATE
  // ========================================

  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [selectedTag, setSelectedTag] = useState(null)
  const [allTags, setAllTags] = useState([])

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch posts on mount
   */
  useEffect(() => {
    fetchPosts()
  }, [])

  /**
   * Apply filters when posts or filters change
   */
  useEffect(() => {
    applyFilters()
  }, [posts, filterType, selectedTag])

  /**
   * Load public blog posts and notes
   */
  const fetchPosts = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await getAllPages({ visibility: 'public' })

      if (error) {
        logger.error('Error fetching posts', error)
      } else if (data) {
        // Filter to only blog and notes types
        const blogPosts = data.filter(
          (p) => p.page_type === 'blog' || p.page_type === 'notes'
        )
        setPosts(blogPosts)

        // Extract unique tags
        const tags = new Map()
        blogPosts.forEach((post) => {
          post.tags?.forEach((tag) => {
            if (!tags.has(tag.id)) {
              tags.set(tag.id, tag)
            }
          })
        })
        setAllTags(Array.from(tags.values()))

        logger.info(`Loaded ${blogPosts.length} blog posts`)
      }
    } catch (err) {
      logger.error('Unexpected error fetching posts', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Apply type and tag filters
   */
  const applyFilters = () => {
    let filtered = [...posts]

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((p) => p.page_type === filterType)
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter((p) =>
        p.tags?.some((t) => t.id === selectedTag)
      )
    }

    setFilteredPosts(filtered)
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
      month: 'long',
      year: 'numeric'
    })
  }

  /**
   * Truncate text
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Max characters
   * @returns {string} - Truncated text
   */
  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  /**
   * Clear tag filter
   */
  const clearTagFilter = () => {
    setSelectedTag(null)
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="blog-page">
      {/* Header */}
      <div className="blog-header">
        <div className="blog-title-section">
          <Icon name="writing" size={48} />
          <div>
            <h1>Blog & Notes</h1>
            <p>Follow my journey and learn from my experiences</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="blog-filters">
        <div className="type-filters">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Posts
          </button>
          <button
            className={`filter-btn ${filterType === 'blog' ? 'active' : ''}`}
            onClick={() => setFilterType('blog')}
          >
            <Icon name="writing" size={18} />
            Blog
          </button>
          <button
            className={`filter-btn ${filterType === 'notes' ? 'active' : ''}`}
            onClick={() => setFilterType('notes')}
          >
            <Icon name="parchment" size={18} />
            Notes
          </button>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="tag-filters">
            <span className="filter-label">Filter by tag:</span>
            <div className="tag-list">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  className={`tag-filter-btn ${selectedTag === tag.id ? 'active' : ''}`}
                  onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                  style={{
                    '--tag-color': tag.color,
                    borderColor: selectedTag === tag.id ? tag.color : 'transparent'
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            {selectedTag && (
              <button className="clear-filter-btn" onClick={clearTagFilter}>
                <Icon name="cross" size={16} />
                Clear Filter
              </button>
            )}
          </div>
        )}

        <div className="posts-count">
          {!isLoading && (
            <span>
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading posts...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPosts.length === 0 && (
        <div className="empty-state">
          <Icon name="writing" size={64} />
          <h2>No posts found</h2>
          <p>
            {filterType !== 'all' || selectedTag
              ? 'Try adjusting your filters to see more posts.'
              : 'Check back soon for new content!'}
          </p>
        </div>
      )}

      {/* Posts Grid */}
      {!isLoading && filteredPosts.length > 0 && (
        <div className="posts-grid">
          {filteredPosts.map((post) => (
            <Link key={post.id} to={`/page/${post.id}`} className="post-card-large">
              <div className="post-header">
                <div
                  className="post-type-badge"
                  style={{
                    backgroundColor: post.page_type === 'blog' ? '#3498db' : '#f39c12'
                  }}
                >
                  <Icon
                    name={post.page_type === 'blog' ? 'writing' : 'parchment'}
                    size={20}
                  />
                  <span>{post.page_type === 'blog' ? 'Blog' : 'Notes'}</span>
                </div>
                <span className="post-date">
                  <Icon name="time" size={16} />
                  {formatDate(post.updated_at)}
                </span>
              </div>

              <h3>{post.title}</h3>
              <p>{truncateText(post.content)}</p>

              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.slice(0, 4).map((tag) => (
                    <Tag key={tag.id} name={tag.name} color={tag.color} size="small" />
                  ))}
                </div>
              )}

              <div className="read-more">
                <span>Read More</span>
                <Icon name="chevron-right" size={18} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default Blog
