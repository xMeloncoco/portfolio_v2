/**
 * Database type definitions for Portfolio v2
 * Using JSDoc for type hints in JavaScript
 */

// ========================================
// ENUMS & CONSTANTS
// ========================================

/**
 * @typedef {'planning' | 'active' | 'completed' | 'on_hold' | 'archived'} ProjectStatus
 */

/**
 * @typedef {'main' | 'side' | 'future'} QuestType
 */

/**
 * @typedef {'gathering_info' | 'creating_plan' | 'in_progress' | 'debugging' | 'testing' | 'polishing' | 'finished' | 'on_hold' | 'dropped' | 'future'} QuestStatus
 */

/**
 * @typedef {'blog' | 'devlog' | 'notes' | 'project'} PageType
 */

/**
 * @typedef {'public' | 'private'} Visibility
 */

/**
 * @typedef {'project' | 'quest'} ConnectionType
 */

/**
 * @typedef {'bug' | 'improvement'} IssueType
 */

/**
 * @typedef {'critical' | 'major' | 'minor'} IssueSeverity
 */

/**
 * @typedef {'open' | 'in_progress' | 'blocked' | 'done' | 'postponed' | 'cancelled'} IssueStatus
 */

// ========================================
// DATABASE ENTITIES
// ========================================

/**
 * @typedef {Object} Project
 * @property {string} id - UUID primary key
 * @property {string|null} parent_id - Optional parent project UUID
 * @property {string} title - Project title
 * @property {string|null} description - Project description
 * @property {string} slug - URL-friendly identifier
 * @property {ProjectStatus} status - Current project status
 * @property {Visibility} visibility - Public or private
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} Quest
 * @property {string} id - UUID primary key
 * @property {string} title - Quest title
 * @property {QuestType} quest_type - main, side, or future
 * @property {QuestStatus} status - Current quest status
 * @property {string|null} description - Quest description
 * @property {Visibility} visibility - Public or private
 * @property {string|null} project_id - Foreign key to parent project (NULLABLE)
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} Page
 * @property {string} id - UUID primary key
 * @property {string} title - Page title
 * @property {PageType} page_type - blog, devlog, notes, or project
 * @property {string|null} content - HTML/Markdown content
 * @property {string|null} slug - URL-friendly identifier
 * @property {Visibility} visibility - Public or private
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 * @property {string|null} project_status - For project pages only
 * @property {string|null} project_start_date - For project pages only
 * @property {string|null} project_end_date - For project pages only
 */

/**
 * @typedef {Object} PageConnection
 * @property {string} id - UUID primary key
 * @property {string} page_id - Reference to pages.id
 * @property {ConnectionType} connected_to_type - 'project' or 'quest'
 * @property {string} connected_to_id - UUID of project or quest
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} Issue
 * @property {string} id - UUID primary key
 * @property {ConnectionType} attached_to_type - 'project' or 'quest'
 * @property {string} attached_to_id - UUID of project or quest
 * @property {IssueType} issue_type - 'bug' or 'improvement'
 * @property {IssueSeverity|null} severity - Required for bugs, null for improvements
 * @property {string} title - Issue title
 * @property {string|null} description - Issue description
 * @property {IssueStatus} status - Current issue status
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} DevlogIssue
 * @property {string} id - UUID primary key
 * @property {string} devlog_id - Reference to pages.id (devlog page)
 * @property {string} issue_id - Reference to issues.id
 * @property {IssueStatus|null} status_change - Status set in this devlog session
 * @property {string|null} work_notes - Notes about work done in this devlog
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} Tag
 * @property {string} id - UUID primary key
 * @property {string} name - Tag name
 * @property {string} color - Hex color code
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} SubQuest
 * @property {string} id - UUID primary key
 * @property {string} quest_id - Parent quest UUID
 * @property {string} title - Subquest title
 * @property {boolean} is_completed - Completion status
 * @property {number} sort_order - Display order
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

// ========================================
// EXTENDED TYPES (with relationships)
// ========================================

/**
 * @typedef {Project & { tags?: Tag[], quests?: Quest[], child_projects?: Project[] }} ProjectWithRelations
 */

/**
 * @typedef {Quest & { tags?: Tag[], subquests?: SubQuest[], parent_quest?: Quest, project?: Project }} QuestWithRelations
 */

/**
 * @typedef {Page & { tags?: Tag[], connections?: PageConnection[] }} PageWithRelations
 */

/**
 * @typedef {Issue & { devlog_history?: DevlogIssue[] }} IssueWithHistory
 */

/**
 * @typedef {DevlogIssue & { issue?: Issue }} DevlogIssueWithDetails
 */

// ========================================
// DISPLAY CONSTANTS
// ========================================

/**
 * Issue status sort order for display
 * Lower number = higher priority in list
 */
export const ISSUE_STATUS_ORDER = {
  in_progress: 1,
  blocked: 2,
  postponed: 3,
  open: 4,
  done: 5,
  cancelled: 6
};

/**
 * Issue status display names
 */
export const ISSUE_STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
  postponed: 'Postponed',
  cancelled: 'Cancelled'
};

/**
 * Issue severity display names and colors
 */
export const ISSUE_SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: '#ff4444' },
  major: { label: 'Major', color: '#ffaa00' },
  minor: { label: 'Minor', color: '#88ccff' }
};

/**
 * Issue type display names
 */
export const ISSUE_TYPE_LABELS = {
  bug: 'Bug',
  improvement: 'Improvement'
};

/**
 * Project status display names (RPG themed)
 */
export const PROJECT_STATUS_LABELS = {
  planning: 'Planning Campaign',
  active: 'Active Quest',
  completed: 'Victory Achieved',
  on_hold: 'Paused Adventure',
  archived: 'Tales of Old'
};

/**
 * Quest status display names (RPG themed)
 */
export const QUEST_STATUS_LABELS = {
  gathering_info: 'Gathering Resources',
  creating_plan: 'Crafting Battle Plan',
  in_progress: 'In Progress',
  debugging: 'Stuck in Battle',
  testing: 'Testing Potions',
  polishing: 'Polishing Artifact',
  finished: 'Quest Complete!',
  on_hold: 'Waiting for Mana',
  dropped: 'Quest Abandoned',
  future: 'Future Quest'
};

/**
 * Check if an issue status is considered "complete"
 * @param {IssueStatus} status
 * @returns {boolean}
 */
export const isIssueComplete = (status) => {
  return status === 'done' || status === 'cancelled';
};

/**
 * Sort issues by status order
 * @param {Issue[]} issues
 * @returns {Issue[]}
 */
export const sortIssuesByStatus = (issues) => {
  return [...issues].sort((a, b) => {
    const orderA = ISSUE_STATUS_ORDER[a.status] || 999;
    const orderB = ISSUE_STATUS_ORDER[b.status] || 999;
    return orderA - orderB;
  });
};

/**
 * Group issues by their status category
 * @param {Issue[]} issues
 * @returns {{ active: Issue[], complete: Issue[] }}
 */
export const groupIssuesByCompletion = (issues) => {
  const active = [];
  const complete = [];

  issues.forEach(issue => {
    if (isIssueComplete(issue.status)) {
      complete.push(issue);
    } else {
      active.push(issue);
    }
  });

  return {
    active: sortIssuesByStatus(active),
    complete: sortIssuesByStatus(complete)
  };
};

export default {
  ISSUE_STATUS_ORDER,
  ISSUE_STATUS_LABELS,
  ISSUE_SEVERITY_CONFIG,
  ISSUE_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  QUEST_STATUS_LABELS,
  isIssueComplete,
  sortIssuesByStatus,
  groupIssuesByCompletion
};
