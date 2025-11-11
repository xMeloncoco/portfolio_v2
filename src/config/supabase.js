import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please check your .env file')
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Log successful connection (remove in production)
console.log('✅ Supabase client initialized')