/**
 * ========================================
 * FULL ACHIEVEMENTS PAGE
 * ========================================
 * Public page showing all achievements
 *
 * FEATURES:
 * - Shows all achievements without limit
 * - Badge-style layout
 * - Click to view achievement details
 * - Back button to home
 */

import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import AchievementsDisplay from '../../components/AchievementsDisplay'
import './FullAchievements.css'

// ========================================
// FULL ACHIEVEMENTS PAGE COMPONENT
// ========================================

function FullAchievements() {
  return (
    <div className="full-achievements-page">
      {/* Page Header */}
      <div className="full-page-header">
        <Link to="/" className="back-to-home">
          <Icon name="chevron-left" size={20} />
          <span>Back to Home</span>
        </Link>
        <h1 className="full-page-title">
          <Icon name="trophy" size={48} />
          All Achievements
        </h1>
        <p className="full-page-subtitle">
          Badges of honor earned through completed challenges
        </p>
      </div>

      {/* Full Achievements Display */}
      <div className="full-achievements-content">
        <AchievementsDisplay limit={100} showHeader={false} showAll={true} />
      </div>
    </div>
  )
}

// ========================================
// EXPORTS
// ========================================

export default FullAchievements
