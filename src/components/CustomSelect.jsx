/**
 * ========================================
 * CUSTOM SELECT COMPONENT
 * ========================================
 * Custom dropdown to replace native select
 * Provides full styling control with dark theme support
 */

import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

/**
 * CustomSelect Component
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.name - Input name
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {Array} props.options - Array of {value, label, description}
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether disabled
 * @param {boolean} props.error - Whether has error
 */
function CustomSelect({
  id,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  error = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef(null)
  const listRef = useRef(null)

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value)
  const displayText = selectedOption
    ? `${selectedOption.label} - ${selectedOption.description}`
    : placeholder

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        if (onBlur) {
          onBlur({ target: { name, value } })
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, name, value, onBlur])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen && focusedIndex >= 0) {
          handleSelect(options[focusedIndex])
        } else {
          setIsOpen(!isOpen)
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break

      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex(prev =>
            prev < options.length - 1 ? prev + 1 : prev
          )
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setFocusedIndex(prev => prev > 0 ? prev - 1 : prev)
        }
        break

      case 'Tab':
        setIsOpen(false)
        break

      default:
        break
    }
  }

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex]
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex, isOpen])

  // Handle option selection
  const handleSelect = (option) => {
    onChange({ target: { name, value: option.value } })
    setIsOpen(false)
    if (onBlur) {
      onBlur({ target: { name, value: option.value } })
    }
  }

  // Toggle dropdown
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setFocusedIndex(-1)
      }
    }
  }

  return (
    <div
      className={`custom-select ${error ? 'error' : ''} ${disabled ? 'disabled' : ''} ${value ? 'has-value' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Selected value display */}
      <div
        className={`custom-select__trigger ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={id}
      >
        <span className={`custom-select__value ${!value ? 'placeholder' : ''}`}>
          {displayText}
        </span>
        <span className="custom-select__arrow" aria-hidden="true">
          ▼
        </span>
      </div>

      {/* Options dropdown */}
      {isOpen && (
        <ul
          className="custom-select__options"
          ref={listRef}
          role="listbox"
          aria-labelledby={id}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              className={`custom-select__option ${
                value === option.value ? 'selected' : ''
              } ${focusedIndex === index ? 'focused' : ''}`}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setFocusedIndex(index)}
              role="option"
              aria-selected={value === option.value}
            >
              <span className="option-label">{option.label}</span>
              <span className="option-description"> - {option.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default CustomSelect
