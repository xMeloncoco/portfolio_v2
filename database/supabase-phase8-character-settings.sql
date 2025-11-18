-- ========================================
-- PORTFOLIO V2 - CHARACTER SETTINGS TABLE
-- ========================================
-- Phase 8: Character Settings Management
-- Run this in your Supabase SQL Editor
-- ========================================

-- ========================================
-- TABLE: character_settings
-- Stores editable character profile information
-- ========================================
CREATE TABLE IF NOT EXISTS character_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_picture_url TEXT,
  display_name TEXT NOT NULL DEFAULT 'Miriam Schouten',
  subtitle TEXT DEFAULT 'Software Tester / Vibe Coder',
  description TEXT,
  class TEXT DEFAULT 'Software Tester / Vibe Coder',
  location TEXT DEFAULT 'Ermelo, Netherlands',
  current_quest TEXT DEFAULT 'Finding my IT spark',
  birthday DATE DEFAULT '1995-03-14',
  linkedin_url TEXT DEFAULT 'https://linkedin.com/in/yourprofile',
  languages JSONB DEFAULT '[]'::jsonb,
  frameworks JSONB DEFAULT '[]'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb,
  action_buttons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default character settings
INSERT INTO character_settings (
  display_name,
  subtitle,
  description,
  class,
  location,
  current_quest,
  birthday,
  linkedin_url,
  languages,
  frameworks,
  tools,
  action_buttons
)
VALUES (
  'Miriam Schouten',
  'Software Tester / Vibe Coder',
  'Passionate about quality assurance and creating delightful user experiences through meticulous testing and creative problem-solving.',
  'Software Tester / Vibe Coder',
  'Ermelo, Netherlands',
  'Finding my IT spark',
  '1995-03-14',
  'https://linkedin.com/in/yourprofile',
  '["JavaScript", "Python", "SQL", "HTML/CSS"]'::jsonb,
  '["React", "Node.js", "Express", "Jest"]'::jsonb,
  '["Git", "Postman", "Jira", "Selenium"]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on character_settings
ALTER TABLE character_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read character settings (needed for public profile display)
CREATE POLICY "Allow public read access to character_settings"
  ON character_settings
  FOR SELECT
  USING (true);

-- Allow updates only through authenticated sessions
-- (We'll handle admin authentication through the application)
CREATE POLICY "Restrict character_settings updates"
  ON character_settings
  FOR UPDATE
  USING (false);

-- Prevent deletions
CREATE POLICY "Prevent character_settings deletions"
  ON character_settings
  FOR DELETE
  USING (false);

-- Prevent inserts (only one row should exist)
CREATE POLICY "Prevent character_settings inserts"
  ON character_settings
  FOR INSERT
  WITH CHECK (false);

-- ========================================
-- FUNCTION: Update character settings timestamp
-- ========================================
CREATE OR REPLACE FUNCTION update_character_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS character_settings_updated_at ON character_settings;
CREATE TRIGGER character_settings_updated_at
  BEFORE UPDATE ON character_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_character_settings_updated_at();

-- ========================================
-- NOTES FOR DEVELOPER
-- ========================================
--
-- JSONB STRUCTURE EXAMPLES:
--
-- languages: ["JavaScript", "Python", "SQL"]
-- frameworks: ["React", "Node.js", "Express"]
-- tools: ["Git", "Postman", "Jira"]
-- action_buttons: [
--   {"label": "LinkedIn", "url": "https://linkedin.com/in/profile", "icon": "linkedin"},
--   {"label": "Send Message", "url": "mailto:email@example.com", "icon": "mail"}
-- ]
--
-- TESTING THE SETUP:
-- Run this query to verify the table exists:
-- SELECT * FROM character_settings;
--
-- You should see one row with the default character settings
-- ========================================
