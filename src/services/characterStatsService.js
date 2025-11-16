/**
 * ========================================
 * CHARACTER STATS SERVICE
 * ========================================
 * Calculates D&D-style character stats from real database data
 *
 * STATS MAPPING:
 * STR - Total quests completed
 * INT - Achievements/certifications earned
 * WIS - Devlogs written
 * DEX - Projects completed in last year
 * CON - Abandoned quests (lower is better)
 * CHA - Projects with external links
 *
 * FEATURES:
 * - Real-time calculation from database
 * - Automatic stat scoring (10-20 range like D&D)
 * - Caching for performance
 * - Detailed breakdowns available
 */

import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// ========================================
// STAT CALCULATION FUNCTIONS
// ========================================

/**
 * Calculate all character stats from database
 * @returns {Promise<{data: Object, error: string|null}>}
 */
export async function calculateCharacterStats() {
  try {
    logger.info('Calculating character stats...')

    // Fetch all required data in parallel
    const [questsResult, pagesResult, achievementsResult] = await Promise.all([
      fetchQuestsData(),
      fetchPagesData(),
      fetchAchievementsData()
    ])

    if (questsResult.error || pagesResult.error || achievementsResult.error) {
      const errors = [questsResult.error, pagesResult.error, achievementsResult.error]
        .filter(Boolean)
        .join(', ')
      return { data: null, error: errors }
    }

    // Calculate raw values
    const rawStats = {
      str: calculateStrength(questsResult.data),
      int: calculateIntelligence(achievementsResult.data),
      wis: calculateWisdom(pagesResult.data),
      dex: calculateDexterity(pagesResult.data),
      con: calculateConstitution(questsResult.data),
      cha: calculateCharisma(pagesResult.data)
    }

    // Convert to D&D-style scores (10-20 range)
    const stats = {
      str: {
        name: 'Strength',
        score: convertToStatScore(rawStats.str.value, 'str'),
        rawValue: rawStats.str.value,
        description: 'Quests Completed',
        tooltip: 'Total number of quests you have completed. Shows your capability to finish what you start.',
        details: rawStats.str.details
      },
      int: {
        name: 'Intelligence',
        score: convertToStatScore(rawStats.int.value, 'int'),
        rawValue: rawStats.int.value,
        description: 'Achievements Earned',
        tooltip: 'Number of certifications and achievements unlocked. Represents formal knowledge and recognition.',
        details: rawStats.int.details
      },
      wis: {
        name: 'Wisdom',
        score: convertToStatScore(rawStats.wis.value, 'wis'),
        rawValue: rawStats.wis.value,
        description: 'Devlogs Written',
        tooltip: 'Development logs documenting your journey. Wisdom comes from reflection and sharing knowledge.',
        details: rawStats.wis.details
      },
      dex: {
        name: 'Dexterity',
        score: convertToStatScore(rawStats.dex.value, 'dex'),
        rawValue: rawStats.dex.value,
        description: 'Projects This Year',
        tooltip: 'Projects completed in the last 12 months. Shows your current agility and productivity.',
        details: rawStats.dex.details
      },
      con: {
        name: 'Constitution',
        score: convertToStatScore(rawStats.con.value, 'con'),
        rawValue: rawStats.con.value,
        description: 'Abandoned Quests',
        tooltip: 'Number of quests abandoned. Lower is better - shows persistence and follow-through.',
        details: rawStats.con.details,
        inverseScoring: true // Flag that lower raw value = higher score
      },
      cha: {
        name: 'Charisma',
        score: convertToStatScore(rawStats.cha.value, 'cha'),
        rawValue: rawStats.cha.value,
        description: 'Projects with Links',
        tooltip: 'Projects with external/live links. Shows your public presence and impact.',
        details: rawStats.cha.details
      }
    }

    logger.info('Character stats calculated successfully')
    return { data: stats, error: null }
  } catch (err) {
    logger.error('Error calculating character stats', err)
    return { data: null, error: err.message }
  }
}

// ========================================
// DATA FETCHING HELPERS
// ========================================

/**
 * Fetch quests data for stat calculations
 */
async function fetchQuestsData() {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('id, title, status, quest_type, visibility')

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    logger.error('Error fetching quests for stats', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch pages data for stat calculations
 */
async function fetchPagesData() {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('id, title, page_type, created_at, external_link, visibility')

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    logger.error('Error fetching pages for stats', err)
    return { data: [], error: err.message }
  }
}

/**
 * Fetch achievements count
 */
async function fetchAchievementsData() {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, item_name')
      .eq('item_type', 'achievement')
      .eq('visibility', 'public')

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    logger.error('Error fetching achievements for stats', err)
    return { data: [], error: err.message }
  }
}

// ========================================
// INDIVIDUAL STAT CALCULATIONS
// ========================================

/**
 * STR: Total quests completed
 */
function calculateStrength(quests) {
  const completedQuests = quests.filter((q) => q.status === 'completed')
  return {
    value: completedQuests.length,
    details: `${completedQuests.length} quests completed out of ${quests.length} total`
  }
}

/**
 * INT: Achievements/certifications earned
 */
function calculateIntelligence(achievements) {
  return {
    value: achievements.length,
    details: `${achievements.length} achievements unlocked`
  }
}

/**
 * WIS: Devlogs written
 */
function calculateWisdom(pages) {
  const devlogs = pages.filter((p) => p.page_type === 'devlog')
  return {
    value: devlogs.length,
    details: `${devlogs.length} devlogs documenting the journey`
  }
}

/**
 * DEX: Projects completed in last year
 */
function calculateDexterity(pages) {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const recentProjects = pages.filter((p) => {
    if (p.page_type !== 'project') return false
    const createdDate = new Date(p.created_at)
    return createdDate >= oneYearAgo
  })

  return {
    value: recentProjects.length,
    details: `${recentProjects.length} projects created in the last 12 months`
  }
}

/**
 * CON: Abandoned quests (lower is better)
 */
function calculateConstitution(quests) {
  const abandonedQuests = quests.filter((q) => q.status === 'abandoned')
  return {
    value: abandonedQuests.length,
    details: `${abandonedQuests.length} quests abandoned (lower is better!)`
  }
}

/**
 * CHA: Projects with external links
 */
function calculateCharisma(pages) {
  const projectsWithLinks = pages.filter(
    (p) => p.page_type === 'project' && p.external_link && p.external_link.trim() !== ''
  )
  const totalProjects = pages.filter((p) => p.page_type === 'project').length

  return {
    value: projectsWithLinks.length,
    details: `${projectsWithLinks.length} out of ${totalProjects} projects have live links`
  }
}

// ========================================
// STAT SCORE CONVERSION
// ========================================

/**
 * Convert raw value to D&D-style stat score (8-20 range)
 * @param {number} rawValue - The raw count/value
 * @param {string} statType - The stat type (str, int, etc.)
 * @returns {number} - D&D-style score (8-20)
 */
function convertToStatScore(rawValue, statType) {
  // Different scaling for each stat type
  const scalingRules = {
    str: { // Quests completed: 0=8, 5=10, 10=12, 20=15, 30+=18
      thresholds: [0, 2, 5, 10, 15, 20, 25, 30],
      scores: [8, 9, 10, 12, 14, 15, 17, 18]
    },
    int: { // Achievements: 0=8, 3=10, 5=12, 10=15, 15+=18
      thresholds: [0, 1, 3, 5, 8, 10, 12, 15],
      scores: [8, 9, 10, 12, 13, 15, 16, 18]
    },
    wis: { // Devlogs: 0=8, 3=10, 5=12, 10=15, 20+=18
      thresholds: [0, 1, 3, 5, 8, 10, 15, 20],
      scores: [8, 9, 10, 12, 13, 15, 16, 18]
    },
    dex: { // Projects this year: 0=8, 2=10, 4=12, 6=15, 10+=18
      thresholds: [0, 1, 2, 4, 6, 8, 10, 12],
      scores: [8, 9, 10, 12, 14, 16, 18, 20]
    },
    con: { // Abandoned quests (inverse): 5+=8, 4=10, 3=12, 2=14, 1=16, 0=18
      thresholds: [0, 1, 2, 3, 4, 5, 6, 7],
      scores: [18, 16, 14, 12, 10, 9, 8, 8],
      inverse: true
    },
    cha: { // Projects with links: 0=8, 2=10, 4=12, 6=14, 8+=16
      thresholds: [0, 1, 2, 4, 6, 8, 10, 12],
      scores: [8, 9, 10, 12, 14, 16, 17, 18]
    }
  }

  const rules = scalingRules[statType]
  if (!rules) return 10 // Default to average

  // Find the appropriate score based on thresholds
  for (let i = rules.thresholds.length - 1; i >= 0; i--) {
    if (rawValue >= rules.thresholds[i]) {
      return rules.scores[i]
    }
  }

  return rules.scores[0]
}

/**
 * Calculate stat modifier (D&D style: (score - 10) / 2)
 * @param {number} score - The stat score
 * @returns {number} - The modifier (-1 to +5)
 */
export function calculateModifier(score) {
  return Math.floor((score - 10) / 2)
}

/**
 * Format modifier for display
 * @param {number} modifier - The modifier value
 * @returns {string} - Formatted string like "+2" or "-1"
 */
export function formatModifier(modifier) {
  if (modifier >= 0) {
    return `+${modifier}`
  }
  return `${modifier}`
}

// ========================================
// EXPORTS
// ========================================

export default {
  calculateCharacterStats,
  calculateModifier,
  formatModifier
}
