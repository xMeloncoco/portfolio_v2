import Icon from '../../components/Icon'
import './UnderConstruction.css'

function UnderConstruction() {
  return (
    <div className="construction-page">
      <div className="construction-content">
        <div className="construction-icon">
          <Icon name="tools" size={80} />
        </div>
        <h1 className="construction-title">Under Construction</h1>
        <p className="construction-message">
          The guild is currently upgrading this realm. New adventures await — check back soon!
        </p>
        <div className="construction-divider" />
        <p className="construction-submessage">
          Something great is being forged.
        </p>
      </div>
    </div>
  )
}

export default UnderConstruction
