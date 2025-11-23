-- ========================================
-- FIX RLS POLICIES FOR QUESTS TABLE
-- ========================================
-- Ensures that project_id can be updated properly
-- ========================================

-- First, check current policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'quests';

-- ========================================
-- Option 1: If you have a custom admin role
-- ========================================
-- If you're using a custom role (like 'dashboard_user'), ensure it can update all fields
-- This is the recommended approach for admin panels

-- DROP POLICY IF EXISTS "Allow admin full access to quests" ON public.quests;
-- CREATE POLICY "Allow admin full access to quests"
--   ON public.quests
--   FOR ALL
--   TO dashboard_user
--   USING (true)
--   WITH CHECK (true);

-- ========================================
-- Option 2: If using authenticated role
-- ========================================
-- Allow authenticated users to update their own quests including project_id

-- This policy allows SELECT
DROP POLICY IF EXISTS "Allow authenticated read on quests" ON public.quests;
CREATE POLICY "Allow authenticated read on quests"
  ON public.quests
  FOR SELECT
  TO authenticated
  USING (true);

-- This policy allows INSERT
DROP POLICY IF EXISTS "Allow authenticated insert on quests" ON public.quests;
CREATE POLICY "Allow authenticated insert on quests"
  ON public.quests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- This policy allows UPDATE (including project_id)
DROP POLICY IF EXISTS "Allow authenticated update on quests" ON public.quests;
CREATE POLICY "Allow authenticated update on quests"
  ON public.quests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- This policy allows DELETE
DROP POLICY IF EXISTS "Allow authenticated delete on quests" ON public.quests;
CREATE POLICY "Allow authenticated delete on quests"
  ON public.quests
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- Public read access (optional)
-- ========================================
-- Allow public users to read public quests

DROP POLICY IF EXISTS "Allow public read on public quests" ON public.quests;
CREATE POLICY "Allow public read on public quests"
  ON public.quests
  FOR SELECT
  TO anon, authenticated
  USING (visibility = 'public');

-- ========================================
-- Verification
-- ========================================

-- Show all current policies
SELECT
  policyname,
  cmd as operation,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'quests'
ORDER BY cmd, policyname;

-- Test query - make sure this returns your quests
SELECT id, title, project_id, visibility
FROM public.quests
LIMIT 5;

RAISE NOTICE 'RLS policies updated successfully!';
RAISE NOTICE 'Try updating a quest with project_id in your application now.';
