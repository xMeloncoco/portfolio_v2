-- ========================================
-- PORTFOLIO V2 - SUPABASE DATABASE SETUP
-- ========================================
-- This file contains all SQL needed for Phase 1
-- Run this in your Supabase SQL Editor
-- ========================================

-- ========================================
-- TABLE: admin_config
-- Stores the admin password and configuration
-- ========================================
CREATE TABLE IF NOT EXISTS admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin password (you MUST change this!)
-- Default password: "admin123" (CHANGE THIS IMMEDIATELY)
-- This is hashed using bcrypt
INSERT INTO admin_config (password_hash)
VALUES ('$2b$10$N8ChhGJW0c13H2/FbajyKeAJqiI/WNV1DHogZE/CTG8fNZtiPdHXO')
ON CONFLICT DO NOTHING;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on admin_config
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the password hash (needed for login verification)
-- This is safe because it's a hash, not the actual password
CREATE POLICY "Allow public read access to admin_config"
  ON admin_config
  FOR SELECT
  USING (true);

-- Only allow updates through authenticated sessions
-- (We'll handle this through the application)
CREATE POLICY "Restrict admin_config updates"
  ON admin_config
  FOR UPDATE
  USING (false);

-- Prevent deletions
CREATE POLICY "Prevent admin_config deletions"
  ON admin_config
  FOR DELETE
  USING (false);

-- ========================================
-- NOTES FOR DEVELOPER
-- ========================================
--
-- IMPORTANT SECURITY NOTES:
-- 1. Change the default password immediately after setup
-- 2. The password is stored as a bcrypt hash (secure)
-- 3. RLS policies prevent unauthorized modifications
-- 4. For production, consider adding rate limiting
--
-- TO CHANGE THE PASSWORD:
-- 1. Generate a new bcrypt hash (use online tool or npm bcrypt)
-- 2. Update the password_hash in admin_config table
--
-- TESTING THE SETUP:
-- Run this query to verify the table exists:
-- SELECT * FROM admin_config;
--
-- You should see one row with the password hash
-- ========================================
