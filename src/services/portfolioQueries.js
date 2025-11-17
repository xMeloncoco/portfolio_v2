/**
 * ========================================
 * PORTFOLIO QUERIES SERVICE
 * ========================================
 * High-level query functions that implement business logic requirements
 *
 * This service provides compound queries that:
 * - Cascade content from quests to projects
 * - Aggregate data across multiple tables
 * - Support the display requirements of the portfolio site
 *
 * CASCADING DISPLAY RULES:
 * - Project pages show ALL related content (direct + from quests)
 * - Quest pages show their subquests, devlogs, and issues
 * - Devlog pages show issue work history
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { getProjectById, getProjectQuests, getProjectStatistics } from './projectsService'
import { getProjectIssues, getQuestIssues } from './issuesService'
import { getProjectAllPages, getPagesConnectedToQuest } from './pageConnectionsService'
import { getDevlogIssuesSectioned } from './devlogIssuesService'

// ========================================
// PROJECT VIEW QUERIES
// ========================================

/**
 * Get complete project view data (for Project page display)
 * Includes all cascaded content from quests
 * @param {string} projectId - The project UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getProjectViewData(projectId) {
  try {
    logger.info(`Fetching complete view data for project: ${projectId}`)

    // Fetch all data in parallel
    const [
      projectResult,
      questsResult,
      issuesResult,
      pagesResult,
      statsResult
    ] = await Promise.all([
      getProjectById(projectId),
      getProjectQuests(projectId),
      getProjectIssues(projectId, { includeCascaded: true }),
      getProjectAllPages(projectId, { includeCascaded: true }),
      getProjectStatistics(projectId)
    ])

    if (projectResult.error) {
      return { data: null, error: projectResult.error }
    }

    // Organize pages by type
    const pagesByType = {
      devlogs: [],
      blogs: [],
      notes: [],
      project_pages: []
    }

    pagesResult.data.forEach(page => {
      switch (page.page_type) {
        case 'devlog':
          pagesByType.devlogs.push(page)
          break
        case 'blog':
          pagesByType.blogs.push(page)
          break
        case 'notes':
          pagesByType.notes.push(page)
          break
        case 'project':
          pagesByType.project_pages.push(page)
          break
      }
    })

    // Get child projects
    const { data: childProjects } = await supabase
      .from('projects')
      .select(`
        id, title, slug, status, visibility, created_at, updated_at,
        project_tags (
          tag_id,
          tags (id, name, color)
        )
      `)
      .eq('parent_id', projectId)
      .order('updated_at', { ascending: false })

    const transformedChildren = childProjects?.map(p => ({
      ...p,
      tags: p.project_tags?.map(pt => pt.tags) || []
    })) || []

    const viewData = {
      project: projectResult.data,
      quests: questsResult.data || [],
      issues: {
        all: issuesResult.data || [],
        direct: issuesResult.data?.filter(i =>
          i.attached_to_type === 'project' && i.attached_to_id === projectId
        ) || [],
        from_quests: issuesResult.data?.filter(i =>
          i.attached_to_type === 'quest'
        ) || []
      },
      pages: pagesByType,
      child_projects: transformedChildren,
      statistics: statsResult.data || {}
    }

    logger.info(`Fetched complete view data for project: ${projectId}`)
    return { data: viewData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching project view data', err)
    return { data: null, error: err.message }
  }
}

/**
 * Get project tree (hierarchical structure)
 * @param {string} [rootProjectId=null] - Start from specific project, or null for all roots
 * @param {number} [maxDepth=3] - Maximum depth to traverse
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getProjectTree(rootProjectId = null, maxDepth = 3) {
  try {
    logger.debug('Fetching project tree', { rootProjectId, maxDepth })

    async function buildTree(parentId, currentDepth) {
      if (currentDepth > maxDepth) return []

      let query = supabase
        .from('projects')
        .select(`
          id, title, slug, status, visibility, created_at,
          project_tags (
            tag_id,
            tags (id, name, color)
          )
        `)
        .order('title')

      if (parentId === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', parentId)
      }

      const { data: projects, error } = await query

      if (error) {
        logger.error('Error fetching project tree level', error)
        return []
      }

      const treeNodes = await Promise.all(
        projects.map(async (project) => {
          const children = await buildTree(project.id, currentDepth + 1)
          return {
            ...project,
            tags: project.project_tags?.map(pt => pt.tags) || [],
            children
          }
        })
      )

      return treeNodes
    }

    const tree = await buildTree(rootProjectId, 1)

    logger.info(`Built project tree with ${tree.length} root nodes`)
    return { data: tree, error: null }
  } catch (err) {
    logger.error('Unexpected error building project tree', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// QUEST VIEW QUERIES
// ========================================

/**
 * Get complete quest view data (for Quest page display)
 * @param {string} questId - The quest UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getQuestViewData(questId) {
  try {
    logger.info(`Fetching complete view data for quest: ${questId}`)

    // Get quest with its details
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select(`
        *,
        quest_tags (
          tag_id,
          tags (id, name, color)
        ),
        sub_quests (
          id, title, is_completed, sort_order
        )
      `)
      .eq('id', questId)
      .single()

    if (questError) {
      logger.error('Error fetching quest', questError)
      return { data: null, error: questError.message }
    }

    // Get subquests (child quests)
    const { data: childQuests } = await supabase
      .from('quests')
      .select(`
        *,
        quest_tags (
          tag_id,
          tags (id, name, color)
        ),
        sub_quests (
          id, title, is_completed, sort_order
        )
      `)
      .eq('parent_quest_id', questId)
      .order('updated_at', { ascending: false })

    // Fetch issues and pages
    const [issuesResult, pagesResult] = await Promise.all([
      getQuestIssues(questId),
      getPagesConnectedToQuest(questId)
    ])

    // Organize pages by type
    const pagesByType = {
      devlogs: [],
      blogs: [],
      notes: [],
      project_pages: []
    }

    pagesResult.data?.forEach(page => {
      switch (page.page_type) {
        case 'devlog':
          pagesByType.devlogs.push(page)
          break
        case 'blog':
          pagesByType.blogs.push(page)
          break
        case 'notes':
          pagesByType.notes.push(page)
          break
        case 'project':
          pagesByType.project_pages.push(page)
          break
      }
    })

    // Calculate progress
    const subQuestItems = quest.sub_quests?.sort((a, b) => a.sort_order - b.sort_order) || []
    const completedCount = subQuestItems.filter(sq => sq.is_completed).length
    const totalCount = subQuestItems.length

    const viewData = {
      quest: {
        ...quest,
        tags: quest.quest_tags?.map(qt => qt.tags) || [],
        sub_quests: subQuestItems,
        progress: {
          completed: completedCount,
          total: totalCount,
          percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        }
      },
      child_quests: childQuests?.map(q => {
        const subs = q.sub_quests?.sort((a, b) => a.sort_order - b.sort_order) || []
        const completed = subs.filter(s => s.is_completed).length
        return {
          ...q,
          tags: q.quest_tags?.map(qt => qt.tags) || [],
          sub_quests: subs,
          progress: {
            completed,
            total: subs.length,
            percentage: subs.length > 0 ? Math.round((completed / subs.length) * 100) : 0
          }
        }
      }) || [],
      issues: issuesResult.data || [],
      pages: pagesByType
    }

    logger.info(`Fetched complete view data for quest: ${questId}`)
    return { data: viewData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching quest view data', err)
    return { data: null, error: err.message }
  }
}

/**
 * Get quest hierarchy (parent chain)
 * @param {string} questId - The quest UUID
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function getQuestBreadcrumb(questId) {
  try {
    logger.debug(`Fetching breadcrumb for quest: ${questId}`)

    const breadcrumb = []
    let currentId = questId

    while (currentId) {
      const { data: quest, error } = await supabase
        .from('quests')
        .select('id, name, parent_quest_id, project_id')
        .eq('id', currentId)
        .single()

      if (error || !quest) break

      breadcrumb.unshift({
        id: quest.id,
        name: quest.name,
        type: 'quest'
      })

      currentId = quest.parent_quest_id

      // If no parent quest but has project, add project to breadcrumb
      if (!currentId && quest.project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('id, title, slug')
          .eq('id', quest.project_id)
          .single()

        if (project) {
          breadcrumb.unshift({
            id: project.id,
            name: project.title,
            slug: project.slug,
            type: 'project'
          })
        }
      }
    }

    logger.info(`Built breadcrumb with ${breadcrumb.length} items`)
    return { data: breadcrumb, error: null }
  } catch (err) {
    logger.error('Unexpected error building quest breadcrumb', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// DEVLOG VIEW QUERIES
// ========================================

/**
 * Get complete devlog view data (for Devlog page display)
 * @param {string} devlogId - The devlog page UUID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getDevlogViewData(devlogId) {
  try {
    logger.info(`Fetching complete view data for devlog: ${devlogId}`)

    // Get the devlog page
    const { data: devlog, error: devlogError } = await supabase
      .from('pages')
      .select(`
        *,
        page_tags (
          tag_id,
          tags (id, name, color)
        )
      `)
      .eq('id', devlogId)
      .eq('page_type', 'devlog')
      .single()

    if (devlogError) {
      logger.error('Error fetching devlog', devlogError)
      return { data: null, error: devlogError.message }
    }

    // Get what the devlog is connected to
    const { data: connections, error: connError } = await supabase
      .from('page_connections')
      .select('*')
      .eq('page_id', devlogId)

    if (connError) {
      logger.warn('Error fetching devlog connections', connError)
    }

    // Get issue sections for each connection
    let issueSections = {}
    let attachedTo = null

    if (connections && connections.length > 0) {
      // Take first connection as primary (devlogs should be exclusive)
      const primaryConnection = connections[0]
      attachedTo = {
        type: primaryConnection.connected_to_type,
        id: primaryConnection.connected_to_id
      }

      // Get details of what it's attached to
      if (primaryConnection.connected_to_type === 'project') {
        const { data: project } = await supabase
          .from('projects')
          .select('id, title, slug')
          .eq('id', primaryConnection.connected_to_id)
          .single()
        attachedTo.details = project
      } else if (primaryConnection.connected_to_type === 'quest') {
        const { data: quest } = await supabase
          .from('quests')
          .select('id, name, project_id')
          .eq('id', primaryConnection.connected_to_id)
          .single()
        attachedTo.details = quest
      }

      // Get sectioned issues
      const { data: sections } = await getDevlogIssuesSectioned(
        devlogId,
        primaryConnection.connected_to_type,
        primaryConnection.connected_to_id
      )
      issueSections = sections || {}
    }

    const viewData = {
      devlog: {
        ...devlog,
        tags: devlog.page_tags?.map(pt => pt.tags) || []
      },
      attached_to: attachedTo,
      connections: connections || [],
      issue_sections: issueSections
    }

    logger.info(`Fetched complete view data for devlog: ${devlogId}`)
    return { data: viewData, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching devlog view data', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// DASHBOARD & OVERVIEW QUERIES
// ========================================

/**
 * Get portfolio dashboard data
 * High-level overview of all projects, quests, and issues
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getDashboardData() {
  try {
    logger.info('Fetching dashboard data')

    // Fetch counts and recent items in parallel
    const [
      projectsCount,
      questsCount,
      issuesCount,
      recentProjects,
      recentQuests,
      activeIssues
    ] = await Promise.all([
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('quests').select('id', { count: 'exact', head: true }).is('parent_quest_id', null),
      supabase.from('issues').select('id', { count: 'exact', head: true }),
      supabase.from('projects')
        .select('id, title, slug, status, visibility, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase.from('quests')
        .select('id, name, status, quest_type, updated_at')
        .is('parent_quest_id', null)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase.from('issues')
        .select('id, title, issue_type, severity, status, updated_at')
        .not('status', 'in', '("done","cancelled")')
        .order('updated_at', { ascending: false })
        .limit(10)
    ])

    // Get issue breakdown
    const { data: allIssues } = await supabase
      .from('issues')
      .select('status, issue_type, severity')

    const issueBreakdown = {
      by_status: {},
      by_type: { bug: 0, improvement: 0 },
      by_severity: { critical: 0, major: 0, minor: 0 }
    }

    allIssues?.forEach(issue => {
      issueBreakdown.by_status[issue.status] = (issueBreakdown.by_status[issue.status] || 0) + 1
      issueBreakdown.by_type[issue.issue_type]++
      if (issue.severity) {
        issueBreakdown.by_severity[issue.severity]++
      }
    })

    const dashboard = {
      counts: {
        projects: projectsCount.count || 0,
        quests: questsCount.count || 0,
        issues: issuesCount.count || 0,
        active_issues: activeIssues.data?.length || 0
      },
      recent: {
        projects: recentProjects.data || [],
        quests: recentQuests.data || []
      },
      active_issues: activeIssues.data || [],
      issue_breakdown: issueBreakdown
    }

    logger.info('Fetched dashboard data')
    return { data: dashboard, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching dashboard data', err)
    return { data: null, error: err.message }
  }
}

/**
 * Search across all content (projects, quests, pages, issues)
 * @param {string} searchTerm - Search query
 * @param {Object} [options] - Search options
 * @param {Array<string>} [options.types] - Types to search: ['projects', 'quests', 'pages', 'issues']
 * @param {number} [options.limit=10] - Max results per type
 * @returns {Promise<{data: Object, error: string|null}>}
 */
export async function searchPortfolio(searchTerm, options = {}) {
  try {
    logger.info(`Searching portfolio for: ${searchTerm}`)

    const types = options.types || ['projects', 'quests', 'pages', 'issues']
    const limit = options.limit || 10
    const results = {}

    const searchPromises = []

    if (types.includes('projects')) {
      searchPromises.push(
        supabase.from('projects')
          .select('id, title, slug, description, status')
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(limit)
          .then(res => { results.projects = res.data || [] })
      )
    }

    if (types.includes('quests')) {
      searchPromises.push(
        supabase.from('quests')
          .select('id, name, short_description, status, quest_type')
          .or(`name.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%,long_description.ilike.%${searchTerm}%`)
          .limit(limit)
          .then(res => { results.quests = res.data || [] })
      )
    }

    if (types.includes('pages')) {
      searchPromises.push(
        supabase.from('pages')
          .select('id, title, page_type, slug')
          .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
          .limit(limit)
          .then(res => { results.pages = res.data || [] })
      )
    }

    if (types.includes('issues')) {
      searchPromises.push(
        supabase.from('issues')
          .select('id, title, description, issue_type, status')
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(limit)
          .then(res => { results.issues = res.data || [] })
      )
    }

    await Promise.all(searchPromises)

    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    logger.info(`Found ${totalResults} results for: ${searchTerm}`)

    return { data: results, error: null }
  } catch (err) {
    logger.error('Unexpected error searching portfolio', err)
    return { data: {}, error: err.message }
  }
}

// ========================================
// STATISTICS & REPORTING
// ========================================

/**
 * Get overall portfolio statistics
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getPortfolioStatistics() {
  try {
    logger.info('Fetching portfolio statistics')

    // Fetch all data in parallel
    const [
      projects,
      quests,
      issues,
      pages
    ] = await Promise.all([
      supabase.from('projects').select('id, status, visibility, created_at'),
      supabase.from('quests').select('id, status, quest_type, visibility').is('parent_quest_id', null),
      supabase.from('issues').select('id, status, issue_type, severity'),
      supabase.from('pages').select('id, page_type, visibility')
    ])

    const stats = {
      projects: {
        total: projects.data?.length || 0,
        by_status: {},
        public: projects.data?.filter(p => p.visibility === 'public').length || 0,
        private: projects.data?.filter(p => p.visibility === 'private').length || 0
      },
      quests: {
        total: quests.data?.length || 0,
        by_type: { main: 0, side: 0, future: 0 },
        completed: quests.data?.filter(q => q.status === 'finished').length || 0,
        in_progress: quests.data?.filter(q => q.status === 'in_progress').length || 0
      },
      issues: {
        total: issues.data?.length || 0,
        bugs: issues.data?.filter(i => i.issue_type === 'bug').length || 0,
        improvements: issues.data?.filter(i => i.issue_type === 'improvement').length || 0,
        critical_bugs: issues.data?.filter(i => i.issue_type === 'bug' && i.severity === 'critical').length || 0,
        open_issues: issues.data?.filter(i => !['done', 'cancelled'].includes(i.status)).length || 0,
        resolution_rate: 0
      },
      pages: {
        total: pages.data?.length || 0,
        by_type: { blog: 0, devlog: 0, notes: 0, project: 0 }
      }
    }

    // Calculate breakdowns
    projects.data?.forEach(p => {
      stats.projects.by_status[p.status] = (stats.projects.by_status[p.status] || 0) + 1
    })

    quests.data?.forEach(q => {
      stats.quests.by_type[q.quest_type]++
    })

    pages.data?.forEach(p => {
      stats.pages.by_type[p.page_type]++
    })

    // Calculate issue resolution rate
    if (issues.data?.length > 0) {
      const resolved = issues.data.filter(i => i.status === 'done').length
      stats.issues.resolution_rate = Math.round((resolved / issues.data.length) * 100)
    }

    logger.info('Fetched portfolio statistics')
    return { data: stats, error: null }
  } catch (err) {
    logger.error('Unexpected error fetching portfolio statistics', err)
    return { data: null, error: err.message }
  }
}

export default {
  // Project views
  getProjectViewData,
  getProjectTree,
  // Quest views
  getQuestViewData,
  getQuestBreadcrumb,
  // Devlog views
  getDevlogViewData,
  // Dashboard
  getDashboardData,
  searchPortfolio,
  getPortfolioStatistics
}
