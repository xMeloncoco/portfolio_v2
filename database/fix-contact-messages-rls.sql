-- ========================================
-- FIX RLS POLICY FOR CONTACT MESSAGES
-- ========================================
-- Run this if you're getting:
-- "new row violates row-level security policy"
-- ========================================

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow anonymous insert on contact_messages" ON contact_messages;

-- Create a new INSERT policy that allows EVERYONE to insert
-- (both anonymous and authenticated users)
CREATE POLICY "Allow public insert on contact_messages"
  ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'contact_messages';
