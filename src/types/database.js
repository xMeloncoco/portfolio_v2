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
 * @typedef {'blog' | 'notes'} PageType
 */

/**
 * @typedef {'public' | 'private'} Visibility
 */

/**
 * @typedef {'project' | 'quest'} ConnectionType
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
 * @property {PageType} page_type - blog or notes
 * @property {string|null} content - HTML/Markdown content
 * @property {string|null} slug - URL-friendly identifier
 * @property {Visibility} visibility - Public or private
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
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

// ========================================
// DISPLAY CONSTANTS
// ========================================

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

export default {
  PROJECT_STATUS_LABELS,
  QUEST_STATUS_LABELS
};
