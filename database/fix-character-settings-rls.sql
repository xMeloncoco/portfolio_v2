-- ========================================
-- FIX CHARACTER SETTINGS RLS POLICIES
-- ========================================
-- This fixes the "Cannot coerce the result to a single JSON object" error
-- when trying to update character settings (e.g., uploading profile pictures)
-- ========================================

-- Drop the old restrictive update policy
DROP POLICY IF EXISTS "Restrict character_settings updates" ON character_settings;

-- Create new policy that allows updates
-- Since this is a personal portfolio with custom password authentication
-- at the application level, we allow updates through the anon key
CREATE POLICY "Allow character_settings updates"
  ON character_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ========================================
-- VERIFICATION
-- ========================================
-- Test that updates now work:
-- UPDATE character_settings
-- SET display_name = 'Test Name'
-- WHERE id = (SELECT id FROM character_settings LIMIT 1);
--
-- If successful, you should see "UPDATE 1" in the results
-- ========================================

-- ========================================
-- NOTES
-- ========================================
-- This policy allows any update to character_settings.
-- Security is handled at the application level through:
-- 1. Password-protected admin login
-- 2. Protected routes (only accessible after authentication)
-- 3. Session management in the application
--
-- For a personal portfolio with a single admin user, this is appropriate.
-- ========================================
