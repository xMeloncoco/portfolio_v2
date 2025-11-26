-- ========================================
-- SECURE RLS POLICIES WITH SUPABASE AUTH
-- ========================================
-- This restores proper security by using 'authenticated' role
-- Now that we're using Supabase Auth instead of custom localStorage auth
--
-- IMPORTANT: Run this AFTER setting up Supabase Auth user
-- IMPORTANT: Run this in your Supabase SQL Editor
--
-- SECURITY BENEFITS:
-- - Only authenticated Supabase users can edit data
-- - Even with anon key, attackers can't bypass auth
-- - Proper database-level security
-- ========================================

-- ========================================
-- CONTACT MESSAGES TABLE
-- ========================================
DROP POLICY IF EXISTS "contact_messages_insert_policy" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_select_policy" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_update_policy" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_delete_policy" ON contact_messages;

-- Allow ANYONE to INSERT (contact form submissions from public visitors)
CREATE POLICY "contact_messages_insert_policy"
  ON contact_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only AUTHENTICATED users can SELECT (view in admin inbox)
CREATE POLICY "contact_messages_select_policy"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Only AUTHENTICATED users can UPDATE (change message status)
CREATE POLICY "contact_messages_update_policy"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only AUTHENTICATED users can DELETE (remove messages)
CREATE POLICY "contact_messages_delete_policy"
  ON contact_messages
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- PROJECTS TABLE
-- ========================================
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;
DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to manage projects" ON projects;

-- Allow ANYONE to SELECT (public can view projects on portfolio)
CREATE POLICY "projects_select_policy"
  ON projects
  FOR SELECT
  TO public
  USING (true);

-- Only AUTHENTICATED users can INSERT
CREATE POLICY "projects_insert_policy"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only AUTHENTICATED users can UPDATE
CREATE POLICY "projects_update_policy"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only AUTHENTICATED users can DELETE
CREATE POLICY "projects_delete_policy"
  ON projects
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- PROJECT_TAGS TABLE
-- ========================================
DROP POLICY IF EXISTS "project_tags_select_policy" ON project_tags;
DROP POLICY IF EXISTS "project_tags_insert_policy" ON project_tags;
DROP POLICY IF EXISTS "project_tags_update_policy" ON project_tags;
DROP POLICY IF EXISTS "project_tags_delete_policy" ON project_tags;

CREATE POLICY "project_tags_select_policy" ON project_tags FOR SELECT TO public USING (true);
CREATE POLICY "project_tags_insert_policy" ON project_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "project_tags_update_policy" ON project_tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "project_tags_delete_policy" ON project_tags FOR DELETE TO authenticated USING (true);

-- ========================================
-- QUESTS TABLE
-- ========================================
DROP POLICY IF EXISTS "quests_select_policy" ON quests;
DROP POLICY IF EXISTS "quests_insert_policy" ON quests;
DROP POLICY IF EXISTS "quests_update_policy" ON quests;
DROP POLICY IF EXISTS "quests_delete_policy" ON quests;
DROP POLICY IF EXISTS "Allow public read access to quests" ON quests;
DROP POLICY IF EXISTS "Allow authenticated users to manage quests" ON quests;

CREATE POLICY "quests_select_policy" ON quests FOR SELECT TO public USING (true);
CREATE POLICY "quests_insert_policy" ON quests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quests_update_policy" ON quests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "quests_delete_policy" ON quests FOR DELETE TO authenticated USING (true);

-- ========================================
-- DEVLOGS TABLE
-- ========================================
DROP POLICY IF EXISTS "devlogs_select_policy" ON devlogs;
DROP POLICY IF EXISTS "devlogs_insert_policy" ON devlogs;
DROP POLICY IF EXISTS "devlogs_update_policy" ON devlogs;
DROP POLICY IF EXISTS "devlogs_delete_policy" ON devlogs;
DROP POLICY IF EXISTS "Allow public read access to devlogs" ON devlogs;
DROP POLICY IF EXISTS "Allow authenticated users to manage devlogs" ON devlogs;

CREATE POLICY "devlogs_select_policy" ON devlogs FOR SELECT TO public USING (true);
CREATE POLICY "devlogs_insert_policy" ON devlogs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "devlogs_update_policy" ON devlogs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "devlogs_delete_policy" ON devlogs FOR DELETE TO authenticated USING (true);

-- ========================================
-- DEVLOG_TAGS TABLE
-- ========================================
DROP POLICY IF EXISTS "devlog_tags_select_policy" ON devlog_tags;
DROP POLICY IF EXISTS "devlog_tags_insert_policy" ON devlog_tags;
DROP POLICY IF EXISTS "devlog_tags_update_policy" ON devlog_tags;
DROP POLICY IF EXISTS "devlog_tags_delete_policy" ON devlog_tags;

CREATE POLICY "devlog_tags_select_policy" ON devlog_tags FOR SELECT TO public USING (true);
CREATE POLICY "devlog_tags_insert_policy" ON devlog_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "devlog_tags_update_policy" ON devlog_tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "devlog_tags_delete_policy" ON devlog_tags FOR DELETE TO authenticated USING (true);

-- ========================================
-- DEVLOG_QUESTS TABLE
-- ========================================
DROP POLICY IF EXISTS "devlog_quests_select_policy" ON devlog_quests;
DROP POLICY IF EXISTS "devlog_quests_insert_policy" ON devlog_quests;
DROP POLICY IF EXISTS "devlog_quests_update_policy" ON devlog_quests;
DROP POLICY IF EXISTS "devlog_quests_delete_policy" ON devlog_quests;

CREATE POLICY "devlog_quests_select_policy" ON devlog_quests FOR SELECT TO public USING (true);
CREATE POLICY "devlog_quests_insert_policy" ON devlog_quests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "devlog_quests_update_policy" ON devlog_quests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "devlog_quests_delete_policy" ON devlog_quests FOR DELETE TO authenticated USING (true);

-- ========================================
-- CHARACTER_SETTINGS TABLE
-- ========================================
DROP POLICY IF EXISTS "character_settings_select_policy" ON character_settings;
DROP POLICY IF EXISTS "character_settings_insert_policy" ON character_settings;
DROP POLICY IF EXISTS "character_settings_update_policy" ON character_settings;
DROP POLICY IF EXISTS "character_settings_delete_policy" ON character_settings;

CREATE POLICY "character_settings_select_policy" ON character_settings FOR SELECT TO public USING (true);
CREATE POLICY "character_settings_insert_policy" ON character_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "character_settings_update_policy" ON character_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "character_settings_delete_policy" ON character_settings FOR DELETE TO authenticated USING (true);

-- ========================================
-- TAGS TABLE
-- ========================================
DROP POLICY IF EXISTS "tags_select_policy" ON tags;
DROP POLICY IF EXISTS "tags_insert_policy" ON tags;
DROP POLICY IF EXISTS "tags_update_policy" ON tags;
DROP POLICY IF EXISTS "tags_delete_policy" ON tags;

CREATE POLICY "tags_select_policy" ON tags FOR SELECT TO public USING (true);
CREATE POLICY "tags_insert_policy" ON tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tags_update_policy" ON tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tags_delete_policy" ON tags FOR DELETE TO authenticated USING (true);

-- ========================================
-- QUEST_PROJECTS TABLE (if exists)
-- ========================================
DROP POLICY IF EXISTS "quest_projects_select_policy" ON quest_projects;
DROP POLICY IF EXISTS "quest_projects_insert_policy" ON quest_projects;
DROP POLICY IF EXISTS "quest_projects_update_policy" ON quest_projects;
DROP POLICY IF EXISTS "quest_projects_delete_policy" ON quest_projects;

CREATE POLICY "quest_projects_select_policy" ON quest_projects FOR SELECT TO public USING (true);
CREATE POLICY "quest_projects_insert_policy" ON quest_projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quest_projects_update_policy" ON quest_projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "quest_projects_delete_policy" ON quest_projects FOR DELETE TO authenticated USING (true);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check all policies
-- INSERT policies should show {public} for contact_messages
-- All other write policies should show {authenticated}
-- SELECT policies can be {public} for data that's shown on the portfolio
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check that RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE '%backup%'
ORDER BY tablename;

-- ========================================
-- EXPECTED RESULTS
-- ========================================
-- SELECT policies: {public} (anyone can view portfolio content)
-- INSERT/UPDATE/DELETE policies: {authenticated} (only admin can edit)
-- EXCEPTION: contact_messages INSERT is {public} (visitors can submit forms)
--
-- This means:
-- ✅ Public visitors can view your portfolio
-- ✅ Public visitors can submit contact forms
-- ✅ Only authenticated Supabase users can edit data
-- ✅ RLS is enabled (rowsecurity: true)
-- ✅ Proper database-level security
-- ========================================
