/**
 * ========================================
 * CHARACTER STATS PAGE (Admin)
 * ========================================
 * Admin page for editing character profile settings
 */

import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import {
  getCharacterSettings,
  updateCharacterSettings,
  uploadProfilePicture,
  deleteProfilePicture
} from '../services/characterSettingsService'
import './CharacterStats.css'

function CharacterStats() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    subtitle: '',
    description: '',
    class: '',
    location: '',
    current_quest: '',
    birthday: '',
    linkedin_url: '',
    languages: [],
    frameworks: [],
    tools: [],
    action_buttons: []
  })

  // Temporary input states for adding items
  const [newLanguage, setNewLanguage] = useState('')
  const [newFramework, setNewFramework] = useState('')
  const [newTool, setNewTool] = useState('')
  const [newButton, setNewButton] = useState({ label: '', url: '', icon: 'star' })

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getCharacterSettings()

    if (fetchError) {
      setError(fetchError)
      setLoading(false)
      return
    }

    setSettings(data)
    setFormData({
      display_name: data.display_name || '',
      subtitle: data.subtitle || '',
      description: data.description || '',
      class: data.class || '',
      location: data.location || '',
      current_quest: data.current_quest || '',
      birthday: data.birthday || '',
      linkedin_url: data.linkedin_url || '',
      languages: data.languages || [],
      frameworks: data.frameworks || [],
      tools: data.tools || [],
      action_buttons: data.action_buttons || []
    })
    setLoading(false)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const { data, error: saveError } = await updateCharacterSettings(formData)

    if (saveError) {
      setError(saveError)
      setSaving(false)
      return
    }

    setSettings(data)
    setSuccess('Settings saved successfully!')
    setSaving(false)

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    const { url, error: uploadError } = await uploadProfilePicture(file)

    if (uploadError) {
      setError(uploadError)
      setUploadingImage(false)
      return
    }

    // Delete old image if exists
    if (settings?.profile_picture_url) {
      await deleteProfilePicture(settings.profile_picture_url)
    }

    // Update settings with new URL
    const { error: updateError } = await updateCharacterSettings({
      profile_picture_url: url
    })

    if (updateError) {
      setError(updateError)
      setUploadingImage(false)
      return
    }

    setUploadingImage(false)
    loadSettings() // Reload to get updated data
  }

  // Array management functions
  const addToArray = (field, value, setter) => {
    if (!value.trim()) return
    if (formData[field].includes(value.trim())) {
      setError(`"${value.trim()}" already exists in ${field}`)
      return
    }
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }))
    setter('')
  }

  const removeFromArray = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const addButton = () => {
    if (!newButton.label.trim() || !newButton.url.trim()) {
      setError('Button label and URL are required')
      return
    }
    setFormData(prev => ({
      ...prev,
      action_buttons: [...prev.action_buttons, { ...newButton }]
    }))
    setNewButton({ label: '', url: '', icon: 'star' })
  }

  const removeButton = (index) => {
    setFormData(prev => ({
      ...prev,
      action_buttons: prev.action_buttons.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="character-stats-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="character-stats-page">
      <div className="page-header">
        <div className="header-left">
          <Icon name="default-user" size={40} />
          <div>
            <h1>Character Settings</h1>
            <p className="page-subtitle">Customize your portfolio character profile</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <Icon name="x-circle" size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <Icon name="check-circle" size={20} />
          {success}
        </div>
      )}

      <div className="settings-sections">
        {/* Profile Picture */}
        <section className="settings-section">
          <h2>Profile Picture</h2>
          <div className="profile-picture-upload">
            <div className="current-picture">
              {settings?.profile_picture_url ? (
                <img src={settings.profile_picture_url} alt="Profile" />
              ) : (
                <div className="no-picture">
                  <Icon name="default-user" size={80} />
                </div>
              )}
            </div>
            <div className="upload-controls">
              <label className="btn-secondary file-upload-btn">
                {uploadingImage ? 'Uploading...' : 'Upload New Picture'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
              <p className="help-text">Max 5MB. JPEG, PNG, GIF, or WebP.</p>
            </div>
          </div>
        </section>

        {/* Basic Information */}
        <section className="settings-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="e.g., Miriam Schouten"
              />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="e.g., Software Tester / Vibe Coder"
              />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description about yourself..."
                rows={4}
              />
            </div>
            <div className="form-group">
              <label>Birthday</label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </div>
        </section>

        {/* Character Info */}
        <section className="settings-section">
          <h2>Character Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Class</label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => handleInputChange('class', e.target.value)}
                placeholder="e.g., Software Tester / Vibe Coder"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Ermelo, Netherlands"
              />
            </div>
            <div className="form-group full-width">
              <label>Current Quest</label>
              <input
                type="text"
                value={formData.current_quest}
                onChange={(e) => handleInputChange('current_quest', e.target.value)}
                placeholder="e.g., Finding my IT spark"
              />
            </div>
          </div>
        </section>

        {/* Languages */}
        <section className="settings-section">
          <h2>Languages</h2>
          <div className="array-manager">
            <div className="add-item-form">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="e.g., JavaScript"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('languages', newLanguage, setNewLanguage)
                  }
                }}
              />
              <button
                className="btn-secondary"
                onClick={() => addToArray('languages', newLanguage, setNewLanguage)}
              >
                <Icon name="plus" size={16} />
                Add
              </button>
            </div>
            <div className="items-list">
              {formData.languages.map((lang, index) => (
                <div key={index} className="list-item">
                  <span>{lang}</span>
                  <button
                    className="btn-icon"
                    onClick={() => removeFromArray('languages', index)}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
              {formData.languages.length === 0 && (
                <p className="empty-state">No languages added yet</p>
              )}
            </div>
          </div>
        </section>

        {/* Frameworks */}
        <section className="settings-section">
          <h2>Frameworks</h2>
          <div className="array-manager">
            <div className="add-item-form">
              <input
                type="text"
                value={newFramework}
                onChange={(e) => setNewFramework(e.target.value)}
                placeholder="e.g., React"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('frameworks', newFramework, setNewFramework)
                  }
                }}
              />
              <button
                className="btn-secondary"
                onClick={() => addToArray('frameworks', newFramework, setNewFramework)}
              >
                <Icon name="plus" size={16} />
                Add
              </button>
            </div>
            <div className="items-list">
              {formData.frameworks.map((framework, index) => (
                <div key={index} className="list-item">
                  <span>{framework}</span>
                  <button
                    className="btn-icon"
                    onClick={() => removeFromArray('frameworks', index)}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
              {formData.frameworks.length === 0 && (
                <p className="empty-state">No frameworks added yet</p>
              )}
            </div>
          </div>
        </section>

        {/* Tools */}
        <section className="settings-section">
          <h2>Tools</h2>
          <div className="array-manager">
            <div className="add-item-form">
              <input
                type="text"
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                placeholder="e.g., Git"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToArray('tools', newTool, setNewTool)
                  }
                }}
              />
              <button
                className="btn-secondary"
                onClick={() => addToArray('tools', newTool, setNewTool)}
              >
                <Icon name="plus" size={16} />
                Add
              </button>
            </div>
            <div className="items-list">
              {formData.tools.map((tool, index) => (
                <div key={index} className="list-item">
                  <span>{tool}</span>
                  <button
                    className="btn-icon"
                    onClick={() => removeFromArray('tools', index)}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
              {formData.tools.length === 0 && (
                <p className="empty-state">No tools added yet</p>
              )}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="settings-section">
          <h2>Action Buttons</h2>
          <p className="section-description">
            Custom buttons to display next to LinkedIn and Send Message
          </p>
          <div className="array-manager">
            <div className="add-button-form">
              <input
                type="text"
                value={newButton.label}
                onChange={(e) => setNewButton(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Button Label"
              />
              <input
                type="url"
                value={newButton.url}
                onChange={(e) => setNewButton(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
              <input
                type="text"
                value={newButton.icon}
                onChange={(e) => setNewButton(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="Icon name"
              />
              <button className="btn-secondary" onClick={addButton}>
                <Icon name="plus" size={16} />
                Add
              </button>
            </div>
            <div className="items-list">
              {formData.action_buttons.map((button, index) => (
                <div key={index} className="list-item button-item">
                  <div className="button-info">
                    <Icon name={button.icon} size={16} />
                    <span>{button.label}</span>
                    <span className="button-url">{button.url}</span>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => removeButton(index)}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
              {formData.action_buttons.length === 0 && (
                <p className="empty-state">No custom buttons added yet</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom save button */}
      <div className="page-footer">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  )
}

export default CharacterStats
