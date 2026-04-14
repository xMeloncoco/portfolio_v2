-- ========================================
-- ADD CONSTRUCTION MODE TO CHARACTER SETTINGS
-- ========================================
-- Adds a boolean flag to enable/disable construction mode
-- When enabled, public visitors see an "Under Construction" page
-- Admin users can still browse the site normally

ALTER TABLE character_settings
ADD COLUMN IF NOT EXISTS construction_mode BOOLEAN DEFAULT false;

-- Add a comment for documentation
COMMENT ON COLUMN character_settings.construction_mode IS 'When true, public visitors see an Under Construction page. Admins can still browse normally.';
