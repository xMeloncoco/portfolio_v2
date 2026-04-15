import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getCharacterSettings } from '../services/characterSettingsService'
import { supabase } from '../config/supabase'
import UnderConstruction from '../pages/public/UnderConstruction'

function ConstructionGate({ children }) {
  const [constructionMode, setConstructionMode] = useState(false)
  const [whitelist, setWhitelist] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await getCharacterSettings()
      setConstructionMode(data?.construction_mode === true)
      setWhitelist(data?.construction_whitelist || [])

      const { data: { session } } = await supabase.auth.getSession()
      setIsAdmin(!!session)
      setLoading(false)
    }
    fetchSettings()
  }, [])

  if (loading) return null

  // Admin users and admin routes always pass through
  if (isAdmin || location.pathname.startsWith('/admin')) {
    return children
  }

  // Construction mode off — render normally
  if (!constructionMode) {
    return children
  }

  // Check whitelist against the current path (before any routing/redirects)
  const isWhitelisted = whitelist.some(path => {
    const normalized = path.startsWith('/') ? path : `/${path}`
    return location.pathname === normalized || location.pathname.startsWith(`${normalized}/`)
  })

  if (isWhitelisted) {
    return children
  }

  return <UnderConstruction />
}

export default ConstructionGate
