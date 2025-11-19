/**
 * ========================================
 * SERVICES INDEX
 * ========================================
 * Central export for all database services
 *
 * Usage:
 * import { projectsService, issuesService } from '../services'
 * or
 * import * as services from '../services'
 */

// Core entity services
export * as projectsService from './projectsService'
export * as questsService from './questsService'
export * as pagesService from './pagesService'
export * as issuesService from './issuesService'
export * as tagsService from './tagsService'

// Relationship services
export * as pageConnectionsService from './pageConnectionsService'
export * as devlogIssuesService from './devlogIssuesService'

// Specialized services
export * as inventoryService from './inventoryService'
export * as characterStatsService from './characterStatsService'
export * as contactService from './contactService'

// Complex query services
export * as portfolioQueries from './portfolioQueries'

// Type definitions and constants
export * from '../types/database'

// Re-export commonly used functions for convenience
export {
  // Projects
  getAllProjects,
  getProjectById,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  getProjectQuests,
  getProjectStatistics
} from './projectsService'

export {
  // Quests
  getAllQuests,
  getQuestById,
  createQuest,
  updateQuest,
  deleteQuest,
  addSubQuest,
  updateSubQuest,
  deleteSubQuest
} from './questsService'

export {
  // Issues
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  updateIssueStatus,
  deleteIssue,
  getProjectIssues,
  getQuestIssues,
  getIssueHistory
} from './issuesService'

export {
  // Page connections
  connectPage,
  disconnectPage,
  getPageConnections,
  getPagesConnectedToProject,
  getPagesConnectedToQuest,
  getProjectDevlogs
} from './pageConnectionsService'

export {
  // Devlog issues
  linkIssueToDevlog,
  unlinkIssueFromDevlog,
  getDevlogIssues,
  getDevlogIssuesSectioned,
  getIssueDevlogHistory
} from './devlogIssuesService'

export {
  // Portfolio queries
  getProjectViewData,
  getQuestViewData,
  getDevlogViewData,
  getDashboardData,
  searchPortfolio,
  getPortfolioStatistics,
  getProjectTree
} from './portfolioQueries'

export {
  // Contact messages
  submitMessage,
  getAllMessages,
  getMessageById,
  updateMessageStatus,
  markAsRead,
  markAsReplied,
  deleteMessage,
  getUnreadCount,
  getInboxStatistics,
  getAllCategories,
  getAllStatuses
} from './contactService'
