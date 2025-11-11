import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import theme system
// 1. Base template (structure) - ALWAYS imported
import './styles/theme-base.css'

// 2. Active theme (values) - CHANGE THIS LINE to switch themes
import './styles/themes/theme-mystic-blue-gold.css'

// 3. App-specific styles
import './index.css'

// 4. App component
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)