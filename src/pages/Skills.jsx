/**
 * ========================================
 * SKILLS PAGE (Admin)
 * ========================================
 * This page will manage skills displayed on the frontend
 */

import Icon from '../components/Icon'
import './PlaceholderPage.css'

function Skills() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-header">
        <Icon name="skills" size={48} />
        <h1>Skills</h1>
        <p className="placeholder-subtitle">Manage your skills and technologies</p>
      </div>

      <div className="placeholder-content">
        <div className="info-box">
          <Icon name="hourglass" size={32} />
          <h2>Coming in a later phase</h2>
          <p>
            The Skills feature will allow you to showcase your technical abilities
            and proficiencies in various technologies, languages, and frameworks.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Skills
