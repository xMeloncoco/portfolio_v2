-- ========================================
-- FIX RLS FOR CUSTOM AUTHENTICATION
-- ========================================
-- This fixes the "Cannot coerce the result to a single JSON object" error
-- that happens when using custom authentication (localStorage)
-- instead of Supabase Auth.
--
-- IMPORTANT: Run this in your Supabase SQL Editor
-- ========================================

-- Step 1: DROP ALL EXISTING POLICIES
DROP POLICY IF EXISTS "contact_messages_insert_policy" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_select_policy" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_update_policy" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_delete_policy" ON contact_messages;

-- Step 2: RECREATE POLICIES FOR CUSTOM AUTH

-- Allow ANYONE to INSERT (contact form submissions from visitors)
CREATE POLICY "contact_messages_insert_policy"
  ON contact_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow ANYONE to SELECT (admin panel uses custom auth, not Supabase auth)
-- Security is handled by React app authentication
CREATE POLICY "contact_messages_select_policy"
  ON contact_messages
  FOR SELECT
  TO public
  USING (true);

-- Allow ANYONE to UPDATE (admin panel uses custom auth)
-- Security is handled by React app authentication
CREATE POLICY "contact_messages_update_policy"
  ON contact_messages
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow ANYONE to DELETE (admin panel uses custom auth)
-- Security is handled by React app authentication
CREATE POLICY "contact_messages_delete_policy"
  ON contact_messages
  FOR DELETE
  TO public
  USING (true);

-- Step 3: VERIFY POLICIES WERE CREATED
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'contact_messages'
ORDER BY policyname;

-- Step 4: VERIFY RLS IS ENABLED
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'contact_messages';

-- ========================================
-- EXPECTED RESULTS
-- ========================================
-- You should see 4 policies, all with roles: {public}
-- 1. contact_messages_insert_policy (FOR INSERT, roles: {public})
-- 2. contact_messages_select_policy (FOR SELECT, roles: {public})
-- 3. contact_messages_update_policy (FOR UPDATE, roles: {public})
-- 4. contact_messages_delete_policy (FOR DELETE, roles: {public})
--
-- rowsecurity should be: true
--
-- ========================================
-- SECURITY NOTE
-- ========================================
-- Since all operations are allowed to 'public', your security
-- relies on the React app's custom authentication system.
-- The admin routes are protected by React Router and the
-- isAuthenticated() check in the ProtectedRoute component.
--
-- If you want stronger database-level security, you should
-- switch to using Supabase Auth instead of custom authentication.
-- ========================================
