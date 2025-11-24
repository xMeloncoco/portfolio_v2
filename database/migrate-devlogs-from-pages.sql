-- ========================================
-- CREATE DEVLOGS TABLE AND MIGRATE FROM PAGES
-- ========================================
-- This creates a dedicated devlogs table and migrates all page_type='devlog'
-- records from pages table, separating devlogs from simple blog/notes pages.
-- ========================================

-- ========================================
-- STEP 1: CREATE DEVLOGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.devlogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  session_date DATE,  -- When this devlog session occurred
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_devlogs_project_id ON public.devlogs(project_id);
CREATE INDEX IF NOT EXISTS idx_devlogs_session_date ON public.devlogs(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_devlogs_visibility_created ON public.devlogs(visibility, created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devlogs_updated_at
  BEFORE UPDATE ON public.devlogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 2: CREATE DEVLOG_TAGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.devlog_tags (
  devlog_id UUID REFERENCES public.devlogs(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (devlog_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_devlog_tags_devlog_id ON public.devlog_tags(devlog_id);
CREATE INDEX IF NOT EXISTS idx_devlog_tags_tag_id ON public.devlog_tags(tag_id);

-- ========================================
-- STEP 3: CREATE DEVLOG_QUESTS TABLE (for linking)
-- ========================================
-- Devlogs can be linked to multiple quests

CREATE TABLE IF NOT EXISTS public.devlog_quests (
  devlog_id UUID REFERENCES public.devlogs(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (devlog_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_devlog_quests_devlog_id ON public.devlog_quests(devlog_id);
CREATE INDEX IF NOT EXISTS idx_devlog_quests_quest_id ON public.devlog_quests(quest_id);

-- ========================================
-- STEP 4: BACKUP DEVLOG PAGES
-- ========================================

CREATE TABLE IF NOT EXISTS pages_devlogs_backup AS
SELECT * FROM pages WHERE page_type = 'devlog';

-- Verify backup
SELECT COUNT(*) as backed_up_devlogs FROM pages_devlogs_backup;

-- ========================================
-- STEP 5: MIGRATE DEVLOGS FROM PAGES
-- ========================================

-- Note: devlog_items and devlog_issues tables already reference pages.id
-- We need to migrate those FK references too

-- First, insert devlogs into new table
INSERT INTO public.devlogs (
  id,
  title,
  content,
  session_date,
  visibility,
  created_at,
  updated_at
)
SELECT
  id,
  title,
  content,
  created_at::date as session_date,  -- Use created_at as session date
  visibility,
  created_at,
  updated_at
FROM pages
WHERE page_type = 'devlog'
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  visibility = EXCLUDED.visibility,
  updated_at = EXCLUDED.updated_at;

-- Verify migration
SELECT COUNT(*) as migrated_devlogs FROM devlogs;

-- ========================================
-- STEP 6: LINK DEVLOGS TO PROJECTS
-- ========================================
-- NOTE: page_connections table doesn't exist in this database
-- Devlogs will be migrated with project_id = NULL
-- You can manually link devlogs to projects through the admin UI later

-- If you have a way to determine project relationships, update them here manually:
-- UPDATE public.devlogs SET project_id = 'project-uuid' WHERE id = 'devlog-uuid';

-- Verify current state (should show 0 initially)
SELECT
  COUNT(*) as devlogs_with_projects
FROM devlogs
WHERE project_id IS NOT NULL;

-- ========================================
-- STEP 7: MIGRATE TAGS
-- ========================================

INSERT INTO public.devlog_tags (devlog_id, tag_id)
SELECT
  pt.page_id as devlog_id,
  pt.tag_id
FROM page_tags pt
INNER JOIN pages p ON pt.page_id = p.id
WHERE p.page_type = 'devlog'
ON CONFLICT (devlog_id, tag_id) DO NOTHING;

-- Verify tag migration
SELECT COUNT(*) as migrated_devlog_tags FROM devlog_tags;

-- ========================================
-- STEP 8: MIGRATE QUEST LINKS
-- ========================================

INSERT INTO public.devlog_quests (devlog_id, quest_id, created_at)
SELECT
  pc.page_id as devlog_id,
  pc.connected_to_id as quest_id,
  pc.created_at
FROM page_connections pc
INNER JOIN pages p ON pc.page_id = p.id
WHERE p.page_type = 'devlog'
  AND pc.connected_to_type = 'quest'
ON CONFLICT (devlog_id, quest_id) DO NOTHING;

-- Verify quest links
SELECT COUNT(*) as devlog_quest_links FROM devlog_quests;

-- ========================================
-- STEP 9: UPDATE FOREIGN KEYS FOR EXISTING TABLES
-- ========================================
-- devlog_items and devlog_issues currently reference pages.id
-- We need to keep them working with the new devlogs table

-- Option A: Keep them referencing devlogs.id (they use same UUID)
-- No changes needed! The IDs are preserved during migration

-- Option B: If you want to enforce the constraint:
-- ALTER TABLE devlog_items DROP CONSTRAINT IF EXISTS devlog_items_page_id_fkey;
-- ALTER TABLE devlog_items ADD CONSTRAINT devlog_items_devlog_id_fkey
--   FOREIGN KEY (page_id) REFERENCES devlogs(id) ON DELETE CASCADE;

-- ALTER TABLE devlog_issues DROP CONSTRAINT IF EXISTS devlog_issues_devlog_id_fkey;
-- ALTER TABLE devlog_issues ADD CONSTRAINT devlog_issues_devlog_id_fkey
--   FOREIGN KEY (devlog_id) REFERENCES devlogs(id) ON DELETE CASCADE;

-- ========================================
-- STEP 10: MARK OLD DEVLOG PAGES AS ARCHIVED
-- ========================================

UPDATE pages
SET
  page_type = 'archived_devlog',
  visibility = 'private'
WHERE page_type = 'devlog';

-- ========================================
-- STEP 11: ADD RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE public.devlogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devlog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devlog_quests ENABLE ROW LEVEL SECURITY;

-- Public read access to public devlogs
CREATE POLICY "Allow public read on public devlogs"
  ON public.devlogs
  FOR SELECT
  TO anon, authenticated
  USING (visibility = 'public');

-- Authenticated users can do everything with devlogs
CREATE POLICY "Allow authenticated full access to devlogs"
  ON public.devlogs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tag policies
CREATE POLICY "Allow public read on devlog_tags"
  ON public.devlog_tags
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated manage devlog_tags"
  ON public.devlog_tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Quest link policies
CREATE POLICY "Allow public read on devlog_quests"
  ON public.devlog_quests
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated manage devlog_quests"
  ON public.devlog_quests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Summary
SELECT
  (SELECT COUNT(*) FROM pages_devlogs_backup) as original_devlogs,
  (SELECT COUNT(*) FROM devlogs) as migrated_devlogs,
  (SELECT COUNT(*) FROM devlog_tags) as devlog_tags,
  (SELECT COUNT(*) FROM devlog_quests) as quest_links,
  (SELECT COUNT(*) FROM devlogs WHERE project_id IS NOT NULL) as devlogs_with_projects;

-- Sample migrated devlogs
SELECT
  d.id,
  d.title,
  d.session_date,
  p.title as project_title,
  COUNT(DISTINCT dq.quest_id) as linked_quests,
  COUNT(DISTINCT dt.tag_id) as tags
FROM devlogs d
LEFT JOIN projects p ON d.project_id = p.id
LEFT JOIN devlog_quests dq ON d.id = dq.devlog_id
LEFT JOIN devlog_tags dt ON d.id = dt.devlog_id
GROUP BY d.id, d.title, d.session_date, p.title
ORDER BY d.session_date DESC
LIMIT 5;

-- Check devlog_items still work
SELECT COUNT(*) as devlog_items_count
FROM devlog_items
WHERE page_id IN (SELECT id FROM devlogs);

-- Check devlog_issues still work
SELECT COUNT(*) as devlog_issues_count
FROM devlog_issues
WHERE devlog_id IN (SELECT id FROM devlogs);

-- ========================================
-- ROLLBACK (if needed)
-- ========================================

-- To rollback:
-- DROP TABLE IF EXISTS devlog_quests CASCADE;
-- DROP TABLE IF EXISTS devlog_tags CASCADE;
-- DROP TABLE IF EXISTS devlogs CASCADE;
-- UPDATE pages SET page_type = 'devlog', visibility = backup.visibility
-- FROM pages_devlogs_backup backup
-- WHERE pages.id = backup.id;
-- DROP TABLE pages_devlogs_backup;

-- ========================================
-- CLEANUP (only after verification)
-- ========================================

-- After verifying everything works:
-- DROP TABLE IF EXISTS pages_devlogs_backup;
-- DELETE FROM pages WHERE page_type = 'archived_devlog';
-- DELETE FROM page_tags WHERE page_id IN (SELECT id FROM devlogs);
-- DELETE FROM page_connections WHERE page_id IN (SELECT id FROM devlogs);

RAISE NOTICE 'Devlog migration completed! Review verification queries above.';
