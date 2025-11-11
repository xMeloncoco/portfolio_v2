import { useEffect, useState } from 'react'
import { supabase } from './config/supabase'
import { logger } from './utils/logger'

function App() {
  const [connectionStatus, setConnectionStatus] = useState('checking...')

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        logger.info('Testing Supabase connection...')
        
        // Simple query to test connection
        const { data, error } = await supabase
          .from('_test_connection')
          .select('*')
          .limit(1)
        
        if (error) {
          // Expected error codes when table doesn't exist - but connection works!
          // 42P01 = PostgreSQL error (direct connection)
          // PGRST116 = PostgREST error (REST API - table not found)
          if (error.code === '42P01' || error.code === 'PGRST205') {
            setConnectionStatus('✅ Connected to Supabase!')
            logger.info('Supabase connection successful (test table not found, but that is expected)')
          } else {
            throw error
          }
        } else {
          setConnectionStatus('✅ Connected to Supabase!')
          logger.info('Supabase connection successful', data)
        }
      } catch (error) {
        setConnectionStatus('❌ Connection failed')
        logger.error('Supabase connection failed', error)
      }
    }

    testConnection()
  }, [])

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1>🏰 Portfolio V2 - Phase 0 Setup</h1>
      <div style={{ 
        padding: '20px', 
        background: '#f0f0f0', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Setup Status:</h2>
        <ul style={{ lineHeight: '2' }}>
          <li>✅ React + Vite installed</li>
          <li>✅ Supabase client configured</li>
          <li>✅ Logger utility created</li>
          <li>✅ Folder structure ready</li>
          <li>{connectionStatus}</li>
        </ul>
      </div>
      <p style={{ marginTop: '20px', color: '#666' }}>
        Check the browser console (F12) for detailed logs!
      </p>
    </div>
  )
}

export default App