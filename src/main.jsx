import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import theme styles
import './styles/theme-base.css'
import './styles/themes/theme-mystic-blue-gold.css'

// Import app-specific styles
import './index.css'

// Import app component
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)