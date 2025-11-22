-- ========================================
-- COMPLETE FIX FOR CONTACT MESSAGES RLS
-- ========================================
-- This will completely reset the RLS policies
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: DROP ALL EXISTING POLICIES
DROP POLICY IF EXISTS "Allow anonymous insert on contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow public insert on contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated read on contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated update on contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated delete on contact_messages" ON contact_messages;

-- Step 2: RECREATE POLICIES WITH CORRECT PERMISSIONS

-- Allow ANYONE to INSERT (submit contact form)
CREATE POLICY "contact_messages_insert_policy"
  ON contact_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow AUTHENTICATED users to SELECT (view in admin inbox)
CREATE POLICY "contact_messages_select_policy"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow AUTHENTICATED users to UPDATE (change status)
CREATE POLICY "contact_messages_update_policy"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow AUTHENTICATED users to DELETE (remove messages)
CREATE POLICY "contact_messages_delete_policy"
  ON contact_messages
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 3: VERIFY POLICIES WERE CREATED
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
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

-- Expected results:
-- You should see 4 policies:
-- 1. contact_messages_insert_policy (FOR INSERT, roles: {public})
-- 2. contact_messages_select_policy (FOR SELECT, roles: {authenticated})
-- 3. contact_messages_update_policy (FOR UPDATE, roles: {authenticated})
-- 4. contact_messages_delete_policy (FOR DELETE, roles: {authenticated})
--
-- rowsecurity should be: true
