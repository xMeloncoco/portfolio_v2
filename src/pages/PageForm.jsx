/**
 * ========================================
 * PAGE FORM (Create/Edit)
 * ========================================
 * Complete form for creating or editing pages
 *
 * FEATURES:
 * - Title input with validation
 * - Page type selector (Blog, Devlog, Notes, Project)
 * - Visibility toggle (Public/Private)
 * - Content editor (textarea with markdown support)
 * - Tag selector with create capability
 * - Quest linking (optional)
 * - Project-specific fields (status, dates)
 * - Form validation
 * - Auto-save indicator
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { getPageById, createPage, updatePage } from '../services/pagesService'
import { getAllQuests } from '../services/questsService'
import { getAllProjects } from '../services/projectsService'
import { getQuestIssues, getProjectIssues, ISSUE_STATUS_LABELS, ISSUE_SEVERITY_CONFIG, updateIssueStatus } from '../services/issuesService'
import { bulkLinkIssuesToDevlog } from '../services/devlogIssuesService'
import { bulkLinkSubquestsToDevlog } from '../services/devlogSubquestsService'
import { logger } from '../utils/logger'
import Icon from '../components/Icon'
import TagSelector from '../components/TagSelector'
import './PageForm.css'

// ========================================
// CONSTANTS
// ========================================

/**
 * Page type options
 */
const PAGE_TYPES = [
  { value: 'project', label: 'Project', icon: 'castle', description: 'Project documentation with status tracking' },
  { value: 'devlog', label: 'Devlog', icon: 'logbook', description: 'Development logs with to-do lists' },
  { value: 'blog', label: 'Blog', icon: 'writing', description: 'General blog posts and articles' },
  { value: 'notes', label: 'Notes', icon: 'parchment', description: 'Quick notes and references' }
]

/**
 * Visibility options
 */
const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: 'lock', description: 'Only visible in admin' },
  { value: 'public', label: 'Public', icon: 'web', description: 'Visible to everyone' }
]

/**
 * Project status options
 */
const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
]

// ========================================
// PAGE FORM COMPONENT
// ========================================

function PageForm() {
  // ========================================
  // ROUTING
  // ========================================

  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    page_type: 'notes',
    visibility: 'private',
    content: '',
    project_status: 'planning',
    project_start_date: '',
    project_end_date: '',
    external_link: ''
  })

  // Tags, quests, and projects
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedQuestIds, setSelectedQuestIds] = useState([])
  const [selectedProjectIds, setSelectedProjectIds] = useState([])
  const [availableQuests, setAvailableQuests] = useState([])
  const [availableProjects, setAvailableProjects] = useState([])

  // Issues and subquests (for devlogs)
  const [questIssues, setQuestIssues] = useState([])
  const [questSubquests, setQuestSubquests] = useState([])
  const [issueWorkData, setIssueWorkData] = useState({}) // { issueId: { selected: bool, status_change: string, work_notes: string } }
  const [subquestWorkData, setSubquestWorkData] = useState({}) // { subquestId: { selected: bool, was_completed: bool, work_notes: string } }
  const [isLoadingIssues, setIsLoadingIssues] = useState(false)
  const [isLoadingSubquests, setIsLoadingSubquests] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch page data if editing
   */
  useEffect(() => {
    if (isEditing) {
      fetchPageData()
    }
  }, [id])

  /**
   * Fetch available quests and projects for linking
   */
  useEffect(() => {
    fetchQuests()
    fetchProjects()
  }, [])

  /**
   * Fetch issues and subquests when quests/projects are selected and page type is devlog
   */
  useEffect(() => {
    if (formData.page_type === 'devlog' && (selectedQuestIds.length > 0 || selectedProjectIds.length > 0)) {
      fetchAllIssuesAndSubquests()
    } else {
      setQuestIssues([])
      setQuestSubquests([])
      setIssueWorkData({})
      setSubquestWorkData({})
    }
  }, [selectedQuestIds, selectedProjectIds, formData.page_type])

  /**
   * Load page data for editing
   */
  const fetchPageData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.info(`Fetching page data for ID: ${id}`)

      const { data, error: fetchError } = await getPageById(id)

      if (fetchError) {
        setError(fetchError)
        logger.error('Error fetching page', fetchError)
      } else if (data) {
        // Populate form with existing data
        setFormData({
          title: data.title || '',
          page_type: data.page_type || 'notes',
          visibility: data.visibility || 'private',
          content: data.content || '',
          project_status: data.project_status || 'planning',
          project_start_date: data.project_start_date || '',
          project_end_date: data.project_end_date || '',
          external_link: data.external_link || ''
        })

        // Set selected tags
        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTags(data.tags)
        }

        // Set selected quests
        if (data.quests && Array.isArray(data.quests)) {
          setSelectedQuestIds(data.quests.map((q) => q.id))
        }

        logger.info('Page data loaded successfully')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error fetching page', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fetch all available quests
   */
  const fetchQuests = async () => {
    try {
      const { data, error: fetchError } = await getAllQuests()

      if (fetchError) {
        logger.error('Error fetching quests', fetchError)
      } else {
        setAvailableQuests(data || [])
        logger.info(`Loaded ${data?.length || 0} quests for linking`)
      }
    } catch (err) {
      logger.error('Unexpected error fetching quests', err)
    }
  }

  /**
   * Fetch all available projects
   */
  const fetchProjects = async () => {
    try {
      const { data, error: fetchError } = await getAllProjects()

      if (fetchError) {
        logger.error('Error fetching projects', fetchError)
      } else {
        setAvailableProjects(data || [])
        logger.info(`Loaded ${data?.length || 0} projects for linking`)
      }
    } catch (err) {
      logger.error('Unexpected error fetching projects', err)
    }
  }

  /**
   * Fetch issues for a specific quest
   * @param {string} questId - Quest UUID
   */
  const fetchQuestIssues = async (questId) => {
    try {
      setIsLoadingIssues(true)
      logger.info(`Fetching issues for quest: ${questId}`)

      const { data, error: fetchError } = await getQuestIssues(questId)

      if (fetchError) {
        logger.error('Error fetching quest issues', fetchError)
      } else {
        setQuestIssues(data || [])
        // Initialize issue work data for all issues
        const initialWorkData = {}
        data.forEach(issue => {
          initialWorkData[issue.id] = {
            selected: false,
            status_change: issue.status,
            work_notes: ''
          }
        })
        setIssueWorkData(initialWorkData)
        logger.info(`Loaded ${data?.length || 0} issues for quest`)
      }
    } catch (err) {
      logger.error('Unexpected error fetching quest issues', err)
    } finally {
      setIsLoadingIssues(false)
    }
  }

  /**
   * Fetch all issues and subquests from selected quests and projects
   */
  const fetchAllIssuesAndSubquests = async () => {
    try {
      setIsLoadingIssues(true)
      setIsLoadingSubquests(true)

      logger.info(`Fetching issues from ${selectedQuestIds.length} quests and ${selectedProjectIds.length} projects`)

      // Fetch issues from all selected quests
      const questIssuePromises = selectedQuestIds.map(questId => getQuestIssues(questId))
      const questIssuesResults = await Promise.all(questIssuePromises)

      // Fetch issues from all selected projects
      const projectIssuePromises = selectedProjectIds.map(projectId => getProjectIssues(projectId))
      const projectIssuesResults = await Promise.all(projectIssuePromises)

      // Merge all issues and deduplicate by ID
      const allIssues = []
      const issueIds = new Set()

      questIssuesResults.forEach(result => {
        if (result.data) {
          result.data.forEach(issue => {
            if (!issueIds.has(issue.id)) {
              issueIds.add(issue.id)
              allIssues.push(issue)
            }
          })
        }
      })

      projectIssuesResults.forEach(result => {
        if (result.data) {
          result.data.forEach(issue => {
            if (!issueIds.has(issue.id)) {
              issueIds.add(issue.id)
              allIssues.push(issue)
            }
          })
        }
      })

      setQuestIssues(allIssues)

      // Get the most recent devlog date to auto-detect new/changed issues
      let lastDevlogDate = null
      try {
        // Fetch recent devlogs
        const { data: recentDevlogs } = await supabase
          .from('pages')
          .select('id, created_at')
          .eq('page_type', 'devlog')
          .order('created_at', { ascending: false })
          .limit(50)

        if (recentDevlogs && recentDevlogs.length > 0) {
          // Fetch connections for these devlogs
          const devlogIds = recentDevlogs.map(d => d.id)
          const { data: allConnections } = await supabase
            .from('page_connections')
            .select('page_id, connected_to_id, connected_to_type')
            .in('page_id', devlogIds)

          // Find the most recent devlog that shares any quest/project with current selection
          for (const devlog of recentDevlogs) {
            const connections = allConnections?.filter(c => c.page_id === devlog.id) || []
            const hasSharedConnection = connections.some(conn =>
              (conn.connected_to_type === 'quest' && selectedQuestIds.includes(conn.connected_to_id)) ||
              (conn.connected_to_type === 'project' && selectedProjectIds.includes(conn.connected_to_id))
            )

            if (hasSharedConnection) {
              lastDevlogDate = new Date(devlog.created_at)
              logger.info(`Found last devlog date: ${lastDevlogDate.toISOString()}`)
              break
            }
          }
        }
      } catch (err) {
        logger.warn('Could not fetch last devlog date', err)
      }

      // Initialize issue work data for all issues
      const initialWorkData = {}
      allIssues.forEach(issue => {
        const issueCreatedDate = new Date(issue.created_at)
        const issueUpdatedDate = new Date(issue.updated_at)

        // Auto-select if created or updated after last devlog
        const isNew = lastDevlogDate && (issueCreatedDate > lastDevlogDate || issueUpdatedDate > lastDevlogDate)

        initialWorkData[issue.id] = {
          selected: isNew || false, // Auto-select new/changed issues
          status_change: issue.status,
          work_notes: '',
          isNew: isNew || false // Flag for highlighting in UI
        }
      })
      setIssueWorkData(initialWorkData)

      logger.info(`Loaded ${allIssues.length} unique issues${lastDevlogDate ? `, auto-selected ${Object.values(initialWorkData).filter(d => d.isNew).length} new/changed issues` : ''}`)

      // Fetch subquests from all selected quests
      const allSubquests = []
      for (const questId of selectedQuestIds) {
        const quest = availableQuests.find(q => q.id === questId)
        if (quest && quest.sub_quests) {
          allSubquests.push(...quest.sub_quests.map(sq => ({
            ...sq,
            quest_id: questId,
            quest_title: quest.title
          })))
        }
      }

      setQuestSubquests(allSubquests)

      // Initialize subquest work data
      const initialSubquestData = {}
      allSubquests.forEach(subquest => {
        initialSubquestData[subquest.id] = {
          selected: false,
          was_completed: false,
          work_notes: ''
        }
      })
      setSubquestWorkData(initialSubquestData)

      logger.info(`Loaded ${allSubquests.length} subquests`)

    } catch (err) {
      logger.error('Unexpected error fetching issues and subquests', err)
    } finally {
      setIsLoadingIssues(false)
      setIsLoadingSubquests(false)
    }
  }

  // ========================================
  // FORM HANDLERS
  // ========================================

  /**
   * Handle form field changes
   * @param {Event} e - Change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  /**
   * Handle tags change
   * @param {Array} tags - Selected tags
   */
  const handleTagsChange = (tags) => {
    setSelectedTags(tags)
  }

  /**
   * Handle quest selection toggle
   * @param {string} questId - Quest ID
   */
  const handleQuestToggle = (questId) => {
    setSelectedQuestIds((prev) => {
      if (prev.includes(questId)) {
        return prev.filter((id) => id !== questId)
      } else {
        return [...prev, questId]
      }
    })
  }

  /**
   * Handle project selection toggle
   * @param {string} projectId - Project ID
   */
  const handleProjectToggle = (projectId) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId)
      } else {
        return [...prev, projectId]
      }
    })
  }

  /**
   * Handle issue selection toggle
   * @param {string} issueId - Issue ID
   */
  const handleIssueToggle = (issueId) => {
    setIssueWorkData(prev => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        selected: !prev[issueId]?.selected
      }
    }))
  }

  /**
   * Handle issue status change
   * @param {string} issueId - Issue ID
   * @param {string} newStatus - New status
   */
  const handleIssueStatusChange = (issueId, newStatus) => {
    setIssueWorkData(prev => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        status_change: newStatus,
        selected: true // Auto-select when status is changed
      }
    }))
  }

  /**
   * Handle issue work notes change
   * @param {string} issueId - Issue ID
   * @param {string} notes - Work notes
   */
  const handleIssueNotesChange = (issueId, notes) => {
    setIssueWorkData(prev => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        work_notes: notes,
        selected: notes.trim() !== '' || prev[issueId]?.selected // Auto-select when notes are added
      }
    }))
  }

  /**
   * Handle subquest selection toggle
   * @param {string} subquestId - Subquest ID
   */
  const handleSubquestToggle = (subquestId) => {
    setSubquestWorkData(prev => ({
      ...prev,
      [subquestId]: {
        ...prev[subquestId],
        selected: !prev[subquestId]?.selected
      }
    }))
  }

  /**
   * Handle subquest completion toggle
   * @param {string} subquestId - Subquest ID
   * @param {boolean} wasCompleted - Whether it was completed in this session
   */
  const handleSubquestCompletionChange = (subquestId, wasCompleted) => {
    setSubquestWorkData(prev => ({
      ...prev,
      [subquestId]: {
        ...prev[subquestId],
        was_completed: wasCompleted,
        selected: true // Auto-select when completion is changed
      }
    }))
  }

  /**
   * Handle subquest work notes change
   * @param {string} subquestId - Subquest ID
   * @param {string} notes - Work notes
   */
  const handleSubquestNotesChange = (subquestId, notes) => {
    setSubquestWorkData(prev => ({
      ...prev,
      [subquestId]: {
        ...prev[subquestId],
        work_notes: notes,
        selected: notes.trim() !== '' || prev[subquestId]?.selected // Auto-select when notes are added
      }
    }))
  }

  /**
   * Validate form data
   * @returns {boolean} - True if valid
   */
  const validateForm = () => {
    const errors = {}

    // Title is required
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters'
    }

    // Content can be empty but has max length
    if (formData.content && formData.content.length > 100000) {
      errors.content = 'Content is too long (max 100,000 characters)'
    }

    // Project date validation
    if (formData.page_type === 'project') {
      if (formData.project_start_date && formData.project_end_date) {
        const start = new Date(formData.project_start_date)
        const end = new Date(formData.project_end_date)
        if (end < start) {
          errors.project_end_date = 'End date must be after start date'
        }
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      logger.warn('Form validation failed', validationErrors)
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      // Prepare page data
      const pageData = {
        title: formData.title.trim(),
        page_type: formData.page_type,
        visibility: formData.visibility,
        content: formData.content
      }

      // Add project-specific fields if project type
      if (formData.page_type === 'project') {
        pageData.project_status = formData.project_status
        pageData.project_start_date = formData.project_start_date || null
        pageData.project_end_date = formData.project_end_date || null
        pageData.external_link = formData.external_link || null
      }

      // Add tag IDs, quest IDs, and project IDs
      const tagIds = selectedTags.map((t) => t.id)

      // Prepare page data with connections
      pageData.tagIds = tagIds
      pageData.questIds = selectedQuestIds
      pageData.projectIds = selectedProjectIds

      let result

      if (isEditing) {
        // Update existing page
        logger.info(`Updating page: ${id}`)
        result = await updatePage(id, pageData)
      } else {
        // Create new page
        logger.info('Creating new page')
        result = await createPage(pageData)
      }

      if (result.error) {
        setError(result.error)
        logger.error(`Error ${isEditing ? 'updating' : 'creating'} page`, result.error)
      } else {
        logger.info(`Page ${isEditing ? 'updated' : 'created'} successfully`)

        // If this is a devlog, save issue and subquest work data
        if (formData.page_type === 'devlog' && result.data) {
          const pageId = result.data.id
          await saveIssueWorkData(pageId)
          await saveSubquestWorkData(pageId)
        }

        // Navigate to pages list
        navigate('/admin/pages')
      }
    } catch (err) {
      setError(err.message)
      logger.error('Unexpected error saving page', err)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Save issue work data for devlog
   * @param {string} devlogId - The created/updated devlog page ID
   */
  const saveIssueWorkData = async (devlogId) => {
    try {
      // Get all selected issues with their work data
      const selectedIssues = Object.entries(issueWorkData)
        .filter(([_, data]) => data.selected)
        .map(([issueId, data]) => ({
          issue_id: issueId,
          status_change: data.status_change,
          work_notes: data.work_notes
        }))

      if (selectedIssues.length === 0) {
        logger.info('No issues selected for this devlog')
        return
      }

      logger.info(`Saving ${selectedIssues.length} issue work entries`)

      // Bulk link issues to devlog
      const { error: linkError } = await bulkLinkIssuesToDevlog(devlogId, selectedIssues)

      if (linkError) {
        logger.error('Error linking issues to devlog', linkError)
        // Don't throw error, page is already saved
      } else {
        // Update actual issue statuses
        for (const issueData of selectedIssues) {
          const originalIssue = questIssues.find(i => i.id === issueData.issue_id)
          if (originalIssue && originalIssue.status !== issueData.status_change) {
            await updateIssueStatus(issueData.issue_id, issueData.status_change)
            logger.info(`Updated issue ${issueData.issue_id} status to ${issueData.status_change}`)
          }
        }
        logger.info('Issue work data saved successfully')
      }
    } catch (err) {
      logger.error('Error saving issue work data', err)
    }
  }

  /**
   * Save subquest work data for devlog
   * @param {string} devlogId - The created/updated devlog page ID
   */
  const saveSubquestWorkData = async (devlogId) => {
    try {
      // Get all selected subquests with their work data
      const selectedSubquests = Object.entries(subquestWorkData)
        .filter(([_, data]) => data.selected)
        .map(([subquestId, data]) => ({
          id: subquestId,
          was_completed: data.was_completed,
          work_notes: data.work_notes
        }))

      if (selectedSubquests.length === 0) {
        logger.info('No subquests selected for this devlog')
        return
      }

      logger.info(`Saving ${selectedSubquests.length} subquest work entries`)

      // Bulk link subquests to devlog
      const { error: linkError } = await bulkLinkSubquestsToDevlog(devlogId, selectedSubquests)

      if (linkError) {
        logger.error('Error linking subquests to devlog', linkError)
        // Don't throw error, page is already saved
      } else {
        logger.info('Subquest work data saved successfully')
      }
    } catch (err) {
      logger.error('Error saving subquest work data', err)
    }
  }

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    navigate('/admin/pages')
  }

  // ========================================
  // RENDER
  // ========================================

  // Show loading state
  if (isLoading) {
    return (
      <div className="page-form-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading page data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-form-container">
      {/* Header */}
      <div className="page-form-header">
        <Icon name={isEditing ? 'edit-pencil' : 'plus'} size={48} />
        <div>
          <h1>{isEditing ? 'Edit Page' : 'Create New Page'}</h1>
          <p className="form-subtitle">
            {isEditing ? 'Modify your page content and settings' : 'Add a new page to your portfolio'}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <Icon name="cross" size={24} />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="page-form">
        {/* Basic Info Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="parchment" size={24} />
            Basic Information
          </h2>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter page title..."
              className={`form-input ${validationErrors.title ? 'error' : ''}`}
              maxLength={200}
            />
            {validationErrors.title && (
              <span className="error-message">{validationErrors.title}</span>
            )}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Page Type */}
          <div className="form-group">
            <label className="form-label">Page Type</label>
            <div className="type-selector">
              {PAGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-option ${formData.page_type === type.value ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'page_type', value: type.value } })}
                >
                  <Icon name={type.icon} size={32} />
                  <span className="type-label">{type.label}</span>
                  <span className="type-description">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div className="visibility-selector">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`visibility-option ${formData.visibility === option.value ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'visibility', value: option.value } })}
                >
                  <Icon name={option.icon} size={24} />
                  <span className="visibility-label">{option.label}</span>
                  <span className="visibility-description">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quest Linking Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="quests" size={24} />
            Linked Quests
            <span className="label-hint">(Optional - Select quests related to this page)</span>
          </h2>

          <div className="form-group">
            <label className="form-label">
              Link to Quests
              <span className="label-hint">(Optional)</span>
            </label>

            {availableQuests.length === 0 ? (
              <div className="no-quests-message">
                <Icon name="quests" size={32} />
                <p>No quests available. Create quests first to link them to pages.</p>
              </div>
            ) : (
              <div className="quest-selector">
                {availableQuests.map((quest) => (
                  <label key={quest.id} className="quest-option">
                    <input
                      type="checkbox"
                      checked={selectedQuestIds.includes(quest.id)}
                      onChange={() => handleQuestToggle(quest.id)}
                    />
                    <span className="quest-checkbox"></span>
                    <span className="quest-title">{quest.title}</span>
                    <span className="quest-status">{quest.status}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Linking Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="castle" size={24} />
            Linked Projects
            <span className="label-hint">(Optional - Select projects related to this page)</span>
          </h2>

          <div className="form-group">
            {availableProjects.length === 0 ? (
              <div className="no-quests-message">
                <Icon name="castle" size={32} />
                <p>No projects available. Create projects first to link them to pages.</p>
              </div>
            ) : (
              <div className="quest-selector">
                {availableProjects.map((project) => (
                  <label key={project.id} className="quest-option">
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => handleProjectToggle(project.id)}
                    />
                    <span className="quest-checkbox"></span>
                    <span className="quest-title">{project.title}</span>
                    <span className="quest-status">{project.status}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="writing" size={24} />
            Content
          </h2>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Page Content
              <span className="label-hint">(Markdown supported)</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your content here... (Markdown is supported)"
              className={`form-textarea ${validationErrors.content ? 'error' : ''}`}
              rows={15}
            />
            {validationErrors.content && (
              <span className="error-message">{validationErrors.content}</span>
            )}
            <span className="char-count">{formData.content.length} characters</span>
          </div>
        </div>

        {/* Project-Specific Fields */}
        {formData.page_type === 'project' && (
          <div className="form-section">
            <h2 className="section-title">
              <Icon name="castle" size={24} />
              Project Details
            </h2>

            <div className="form-row">
              {/* Project Status */}
              <div className="form-group">
                <label htmlFor="project_status" className="form-label">
                  Project Status
                </label>
                <select
                  id="project_status"
                  name="project_status"
                  value={formData.project_status}
                  onChange={handleChange}
                  className="form-select"
                >
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label htmlFor="project_start_date" className="form-label">
                  Start Date
                </label>
                <input
                  type="date"
                  id="project_start_date"
                  name="project_start_date"
                  value={formData.project_start_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* End Date */}
              <div className="form-group">
                <label htmlFor="project_end_date" className="form-label">
                  End Date
                </label>
                <input
                  type="date"
                  id="project_end_date"
                  name="project_end_date"
                  value={formData.project_end_date}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.project_end_date ? 'error' : ''}`}
                />
                {validationErrors.project_end_date && (
                  <span className="error-message">{validationErrors.project_end_date}</span>
                )}
              </div>
            </div>

            {/* External Link */}
            <div className="form-group">
              <label htmlFor="external_link" className="form-label">
                External Link
                <span className="label-hint">(Live project URL)</span>
              </label>
              <input
                type="url"
                id="external_link"
                name="external_link"
                value={formData.external_link}
                onChange={handleChange}
                className="form-input"
                placeholder="https://your-project.com"
              />
            </div>
          </div>
        )}

        {/* Tags Section */}
        <div className="form-section">
          <h2 className="section-title">
            <Icon name="gem" size={24} />
            Tags
          </h2>

          <div className="form-group">
            <label className="form-label">
              Add Tags
              <span className="label-hint">(Search or create new tags)</span>
            </label>
            <TagSelector selectedTags={selectedTags} onTagsChange={handleTagsChange} />
          </div>
        </div>

        {/* Subquests Section (for devlogs only) */}
        {formData.page_type === 'devlog' && questSubquests.length > 0 && (
          <div className="form-section">
            <h2 className="section-title">
              <Icon name="done" size={24} />
              Quest Objectives Worked On
            </h2>

            {isLoadingSubquests ? (
              <div className="loading-issues">
                <div className="loading-spinner"></div>
                <p>Loading objectives...</p>
              </div>
            ) : (
              <div className="issues-work-list">
                <p className="issues-help-text">
                  Select the quest objectives you worked on in this session.
                </p>
                {questSubquests.map((subquest) => {
                  const workData = subquestWorkData[subquest.id] || {}

                  return (
                    <div
                      key={subquest.id}
                      className={`issue-work-item ${workData.selected ? 'selected' : ''}`}
                    >
                      <div className="issue-work-header">
                        <label className="issue-select-checkbox">
                          <input
                            type="checkbox"
                            checked={workData.selected || false}
                            onChange={() => handleSubquestToggle(subquest.id)}
                          />
                          <span className="checkbox-mark"></span>
                        </label>

                        <div className="issue-work-info">
                          <div className="issue-work-title">
                            <span className="issue-type-badge quest">
                              {subquest.quest_title}
                            </span>
                            <span className="issue-title-text">{subquest.title}</span>
                          </div>
                        </div>
                      </div>

                      {workData.selected && (
                        <div className="issue-work-details">
                          <div className="issue-status-change">
                            <label className="status-label">
                              <input
                                type="checkbox"
                                checked={workData.was_completed || false}
                                onChange={(e) => handleSubquestCompletionChange(subquest.id, e.target.checked)}
                              />
                              <span style={{ marginLeft: '8px' }}>Mark as completed in this session</span>
                            </label>
                          </div>

                          <div className="issue-work-notes">
                            <label className="notes-label">Work Notes:</label>
                            <textarea
                              value={workData.work_notes || ''}
                              onChange={(e) => handleSubquestNotesChange(subquest.id, e.target.value)}
                              placeholder="Describe the work done on this objective..."
                              className="work-notes-textarea"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Issues Section (for devlogs only) */}
        {formData.page_type === 'devlog' && (selectedQuestIds.length > 0 || selectedProjectIds.length > 0) && (
          <div className="form-section">
            <h2 className="section-title">
              <Icon name="bug" size={24} />
              Issues Worked On
            </h2>

            {isLoadingIssues ? (
              <div className="loading-issues">
                <div className="loading-spinner"></div>
                <p>Loading issues...</p>
              </div>
            ) : questIssues.length === 0 ? (
              <div className="no-issues-message">
                <Icon name="bug" size={32} />
                <p>No issues found for the selected quests/projects. Create issues first in the Issues page.</p>
              </div>
            ) : (
              <div className="issues-work-list">
                <p className="issues-help-text">
                  Select the issues you worked on in this session. Update their status and add notes about the work done.
                </p>
                {questIssues.map((issue) => {
                  const workData = issueWorkData[issue.id] || {}
                  const severityConfig = issue.severity ? ISSUE_SEVERITY_CONFIG[issue.severity] : null

                  return (
                    <div
                      key={issue.id}
                      className={`issue-work-item ${workData.selected ? 'selected' : ''} ${workData.isNew ? 'is-new' : ''}`}
                    >
                      <div className="issue-work-header">
                        <label className="issue-select-checkbox">
                          <input
                            type="checkbox"
                            checked={workData.selected || false}
                            onChange={() => handleIssueToggle(issue.id)}
                          />
                          <span className="checkbox-mark"></span>
                        </label>

                        <div className="issue-work-info">
                          <div className="issue-work-title">
                            <span className={`issue-type-badge ${issue.issue_type}`}>
                              {issue.issue_type === 'bug' ? 'Bug' : 'Improvement'}
                            </span>
                            {severityConfig && (
                              <span
                                className="issue-severity-badge"
                                style={{ backgroundColor: severityConfig.color }}
                              >
                                {severityConfig.label}
                              </span>
                            )}
                            {workData.isNew && (
                              <span className="issue-new-badge" title="New or changed since last devlog">
                                NEW
                              </span>
                            )}
                            <span className="issue-title-text">{issue.title}</span>
                          </div>
                          {issue.description && (
                            <p className="issue-work-description">{issue.description}</p>
                          )}
                        </div>
                      </div>

                      {workData.selected && (
                        <div className="issue-work-details">
                          <div className="issue-status-change">
                            <label className="status-label">Update Status:</label>
                            <select
                              value={workData.status_change || issue.status}
                              onChange={(e) => handleIssueStatusChange(issue.id, e.target.value)}
                              className="status-select"
                            >
                              {Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="issue-work-notes">
                            <label className="notes-label">Work Notes:</label>
                            <textarea
                              value={workData.work_notes || ''}
                              onChange={(e) => handleIssueNotesChange(issue.id, e.target.value)}
                              placeholder="Describe the work done on this issue..."
                              className="work-notes-textarea"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCancel} disabled={isSaving}>
            <Icon name="cross" size={24} />
            <span>Cancel</span>
          </button>

          <button type="submit" className="save-button" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="button-spinner"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon name="checkmark" size={24} />
                <span>{isEditing ? 'Update Page' : 'Create Page'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default PageForm
