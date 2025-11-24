-- ========================================
-- MIGRATE PROJECTS FROM PAGES TO PROJECTS TABLE
-- ========================================
-- This migrates all page_type='project' records from pages to projects table
-- and updates the architecture to separate concerns:
--   - projects table: Real projects
--   - pages table: Only blogs and notes
--   - Devlogs: Stay in pages (linked to projects via page_connections)
-- ========================================

-- ========================================
-- STEP 1: CREATE PROJECTS TABLE AND JUNCTION TABLES
-- ========================================

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed', 'on_hold', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  external_link TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create project_tags junction table
CREATE TABLE IF NOT EXISTS public.project_tags (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_project_tags_project_id ON public.project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_tag_id ON public.project_tags(tag_id);

-- Add RLS policies for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read on public projects"
  ON public.projects
  FOR SELECT
  TO anon, authenticated
  USING (visibility = 'public');

CREATE POLICY IF NOT EXISTS "Allow authenticated full access to projects"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add RLS policies for project_tags
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read on project_tags"
  ON public.project_tags
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated manage project_tags"
  ON public.project_tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- STEP 2: BACKUP CURRENT DATA
-- ========================================

-- Create a backup of pages that are projects
CREATE TABLE IF NOT EXISTS pages_projects_backup AS
SELECT * FROM pages WHERE page_type = 'project';

-- Verify backup
SELECT COUNT(*) as backed_up_projects FROM pages_projects_backup;

-- ========================================
-- STEP 3: MIGRATE DATA FROM PAGES TO PROJECTS
-- ========================================

-- Insert projects from pages into projects table
INSERT INTO public.projects (
  id,
  title,
  description,
  slug,
  status,
  visibility,
  created_at,
  updated_at
)
SELECT
  id,
  title,
  content as description,  -- content becomes description
  -- Generate slug from title if not exists
  COALESCE(
    NULLIF(TRIM(LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'))), ''),
    id::text
  ) as slug,
  -- Map project_status to projects.status
  COALESCE(project_status, 'active') as status,
  visibility,
  created_at,
  updated_at
FROM pages
WHERE page_type = 'project'
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  visibility = EXCLUDED.visibility,
  updated_at = EXCLUDED.updated_at;

-- Verify migration
SELECT COUNT(*) as migrated_projects FROM projects;

-- ========================================
-- STEP 4: MIGRATE TAGS FROM PAGE_TAGS TO PROJECT_TAGS
-- ========================================

-- Copy tags for project pages to project_tags
INSERT INTO public.project_tags (project_id, tag_id)
SELECT
  pt.page_id as project_id,
  pt.tag_id
FROM page_tags pt
INNER JOIN pages p ON pt.page_id = p.id
WHERE p.page_type = 'project'
ON CONFLICT (project_id, tag_id) DO NOTHING;

-- Verify tag migration
SELECT COUNT(*) as migrated_project_tags FROM project_tags;

-- ========================================
-- STEP 5: UPDATE PAGE_CONNECTIONS
-- ========================================
-- Update any page_connections that reference projects
-- (Note: This assumes you want to keep devlogs linked to projects)

-- No changes needed - page_connections can stay as-is
-- Devlogs in pages can link to projects via page_connections

-- ========================================
-- STEP 6: REMOVE PROJECTS FROM PAGES TABLE
-- ========================================

-- Option A: Delete project pages (DESTRUCTIVE - only if you're sure!)
-- DELETE FROM pages WHERE page_type = 'project';

-- Option B: Mark them as archived/migrated (SAFER)
UPDATE pages
SET
  page_type = 'archived_project',
  visibility = 'private'
WHERE page_type = 'project';

-- ========================================
-- STEP 7: UPDATE PAGE_TYPE ENUM (Optional)
-- ========================================
-- If you want to prevent new projects being created in pages

-- Check current page_type values
SELECT DISTINCT page_type FROM pages;

-- You could add a constraint to prevent 'project' type
-- ALTER TABLE pages ADD CONSTRAINT page_type_check
--   CHECK (page_type IN ('blog', 'devlog', 'notes'));

-- ========================================
-- STEP 8: MIGRATE EXTERNAL_LINK (if exists in pages)
-- ========================================

-- NOTE: External link column already created in STEP 1

-- Migrate external_link from pages
UPDATE public.projects p
SET external_link = pg.external_link
FROM pages pg
WHERE p.id = pg.id
  AND pg.page_type IN ('project', 'archived_project')
  AND pg.external_link IS NOT NULL;

-- ========================================
-- STEP 9: MIGRATE START/END DATES (if exists in pages)
-- ========================================

-- NOTE: Date columns already created in STEP 1

-- Migrate dates from pages
UPDATE public.projects p
SET
  start_date = pg.project_start_date,
  end_date = pg.project_end_date
FROM pages pg
WHERE p.id = pg.id
  AND pg.page_type IN ('project', 'archived_project');

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Compare counts
SELECT
  (SELECT COUNT(*) FROM pages_projects_backup) as original_projects,
  (SELECT COUNT(*) FROM projects) as migrated_projects,
  (SELECT COUNT(*) FROM pages WHERE page_type = 'project') as remaining_in_pages;

-- Show sample migrated projects
SELECT
  p.id,
  p.title,
  p.slug,
  p.status,
  COUNT(pt.tag_id) as tag_count
FROM projects p
LEFT JOIN project_tags pt ON p.id = pt.project_id
GROUP BY p.id, p.title, p.slug, p.status
LIMIT 5;

-- Show any remaining project pages
SELECT id, title, page_type
FROM pages
WHERE page_type LIKE '%project%'
LIMIT 5;

-- ========================================
-- ROLLBACK (if needed)
-- ========================================

-- To rollback this migration:
-- 1. Delete migrated projects
-- DELETE FROM projects WHERE id IN (SELECT id FROM pages_projects_backup);
-- DELETE FROM project_tags WHERE project_id IN (SELECT id FROM pages_projects_backup);
--
-- 2. Restore pages
-- UPDATE pages SET page_type = 'project', visibility = p.visibility
-- FROM pages_projects_backup p
-- WHERE pages.id = p.id;

-- ========================================
-- CLEANUP (only after verifying everything works!)
-- ========================================

-- After verifying the migration worked:
-- 1. Drop the backup table
-- DROP TABLE IF EXISTS pages_projects_backup;
--
-- 2. Delete archived project pages
-- DELETE FROM pages WHERE page_type = 'archived_project';

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- Review the verification queries above to ensure the migration was successful.
-- Projects can now be managed at /admin/projects
-- DO NOT run cleanup until you verify everything works!
