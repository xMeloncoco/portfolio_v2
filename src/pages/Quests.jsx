/**
 * ========================================
 * QUESTS MANAGEMENT PAGE (Admin)
 * ========================================
 * This page will show a list of all quests (main, side, future)
 * and allow creating, editing, and managing sub-quests
 */

import Icon from '../components/Icon'
import './PlaceholderPage.css'

function Quests() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name="adventure" size={56} />
        <h1>Quests</h1>
        <p className="placeholder-subtitle">Manage your project quests and sub-quests</p>
      </div>

      <div className="placeholder-content">
        <div className="info-box">
          <Icon name="hourglass" size={40} />
          <h2>Implementation begins Phase 3</h2>
          <p>
            The Quest manager will support:
          </p>
          <ul className="feature-list">
            <li><Icon name="crown" size={24} /> <strong>Main Quests:</strong> Major projects and goals</li>
            <li><Icon name="sword" size={24} /> <strong>Side Quests:</strong> Smaller tasks and features</li>
            <li><Icon name="future" size={24} /> <strong>Future Quests:</strong> Planned future work</li>
            <li><Icon name="done" size={24} /> <strong>Sub-quests:</strong> Checklist items for each quest</li>
          </ul>
          <p>
            Track progress, link to project pages, and manage quest statuses with
            fun RPG-style status names like "Stuck in Battle" (debugging) and
            "Waiting for Motivation to Respawn" (on hold).
          </p>
        </div>
      </div>
    </div>
  )
}

export default Quests
