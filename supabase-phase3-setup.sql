-- ========================================
-- PORTFOLIO V2 - PHASE 3 DATABASE SETUP
-- ========================================
-- This file adds the complete project/quest/issue tracking system
-- Run this in your Supabase SQL Editor AFTER phase-2 setup
-- ========================================

-- ========================================
-- TABLE: projects
-- Top-level container for portfolio projects
-- ========================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Optional parent/child hierarchy

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active',
  visibility TEXT NOT NULL DEFAULT 'private',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_project_status CHECK (
    status IN ('planning', 'active', 'completed', 'on_hold', 'archived')
  ),
  CONSTRAINT valid_project_visibility CHECK (visibility IN ('public', 'private'))
);

-- ========================================
-- TABLE: project_tags
-- Junction table for projects and tags
-- ========================================
CREATE TABLE IF NOT EXISTS project_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(project_id, tag_id)
);

-- ========================================
-- MODIFY: quests table
-- Add project_id and parent_quest_id for hierarchy
-- ========================================
ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_quest_id UUID REFERENCES quests(id) ON DELETE CASCADE;

-- Index for faster project-quest lookups
CREATE INDEX IF NOT EXISTS idx_quests_project_id ON quests(project_id);
CREATE INDEX IF NOT EXISTS idx_quests_parent_quest_id ON quests(parent_quest_id);

-- ========================================
-- MODIFY: pages table
-- Add slug column for URL routing
-- ========================================
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Update existing pages to have slugs based on ID (you can update these later)
UPDATE pages SET slug = LOWER(REPLACE(title, ' ', '-')) || '-' || SUBSTRING(id::text, 1, 8)
  WHERE slug IS NULL;

-- Make slug NOT NULL after populating
-- ALTER TABLE pages ALTER COLUMN slug SET NOT NULL;

-- Index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- ========================================
-- TABLE: page_connections
-- Polymorphic junction table connecting pages to projects or quests
-- ========================================
CREATE TABLE IF NOT EXISTS page_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  connected_to_type TEXT NOT NULL, -- 'project' or 'quest'
  connected_to_id UUID NOT NULL, -- Can reference either projects.id or quests.id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_connection_type CHECK (connected_to_type IN ('project', 'quest')),

  -- Prevent duplicate connections
  UNIQUE(page_id, connected_to_type, connected_to_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_page_connections_page_id ON page_connections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_connections_connected_to ON page_connections(connected_to_type, connected_to_id);

-- ========================================
-- TABLE: issues
-- Bug tracking and improvement requests
-- ========================================
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic attachment (must be attached to project OR quest)
  attached_to_type TEXT NOT NULL, -- 'project' or 'quest'
  attached_to_id UUID NOT NULL, -- Can reference either projects.id or quests.id

  -- Issue details
  issue_type TEXT NOT NULL, -- 'bug' or 'improvement'
  severity TEXT, -- 'critical', 'major', 'minor' (only for bugs)
  title TEXT NOT NULL,
  description TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'open',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_attached_to_type CHECK (attached_to_type IN ('project', 'quest')),
  CONSTRAINT valid_issue_type CHECK (issue_type IN ('bug', 'improvement')),
  CONSTRAINT valid_severity CHECK (
    severity IS NULL OR severity IN ('critical', 'major', 'minor')
  ),
  CONSTRAINT valid_issue_status CHECK (
    status IN ('open', 'in_progress', 'blocked', 'done', 'postponed', 'cancelled')
  ),
  -- Ensure bugs have severity and improvements don't require it
  CONSTRAINT bug_requires_severity CHECK (
    issue_type != 'bug' OR severity IS NOT NULL
  )
);

-- Indexes for faster issue queries
CREATE INDEX IF NOT EXISTS idx_issues_attached_to ON issues(attached_to_type, attached_to_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_issues_updated_at ON issues(updated_at DESC);

-- ========================================
-- TABLE: devlog_issues
-- Junction table tracking issue work in devlogs
-- ========================================
CREATE TABLE IF NOT EXISTS devlog_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devlog_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,

  -- Work tracking
  status_change TEXT, -- Status that was set in this devlog session (nullable)
  work_notes TEXT, -- What was done on this issue in this devlog

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status_change CHECK (
    status_change IS NULL OR
    status_change IN ('open', 'in_progress', 'blocked', 'done', 'postponed', 'cancelled')
  ),

  -- Prevent duplicate issue entries in same devlog
  UNIQUE(devlog_id, issue_id)
);

-- Indexes for devlog-issue queries
CREATE INDEX IF NOT EXISTS idx_devlog_issues_devlog_id ON devlog_issues(devlog_id);
CREATE INDEX IF NOT EXISTS idx_devlog_issues_issue_id ON devlog_issues(issue_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on new tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE devlog_issues ENABLE ROW LEVEL SECURITY;

-- Projects: Public read for public projects
CREATE POLICY "Allow public read access to public projects"
  ON projects FOR SELECT USING (visibility = 'public');

CREATE POLICY "Allow all operations on projects"
  ON projects FOR ALL USING (true);

-- Project Tags: Public read
CREATE POLICY "Allow public read access to project_tags"
  ON project_tags FOR SELECT USING (true);

CREATE POLICY "Allow all operations on project_tags"
  ON project_tags FOR ALL USING (true);

-- Page Connections: Public read
CREATE POLICY "Allow public read access to page_connections"
  ON page_connections FOR SELECT USING (true);

CREATE POLICY "Allow all operations on page_connections"
  ON page_connections FOR ALL USING (true);

-- Issues: Public read (will be filtered by parent project/quest visibility in app)
CREATE POLICY "Allow public read access to issues"
  ON issues FOR SELECT USING (true);

CREATE POLICY "Allow all operations on issues"
  ON issues FOR ALL USING (true);

-- Devlog Issues: Public read
CREATE POLICY "Allow public read access to devlog_issues"
  ON devlog_issues FOR SELECT USING (true);

CREATE POLICY "Allow all operations on devlog_issues"
  ON devlog_issues FOR ALL USING (true);

-- ========================================
-- TRIGGERS: Auto-update timestamps
-- ========================================

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devlog_issues_updated_at
  BEFORE UPDATE ON devlog_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- HELPER VIEWS FOR COMPLEX QUERIES
-- ========================================

-- View: All issues for a project (including cascaded from quests)
CREATE OR REPLACE VIEW project_all_issues AS
SELECT
  i.*,
  CASE
    WHEN i.attached_to_type = 'project' THEN i.attached_to_id
    ELSE q.project_id
  END as effective_project_id
FROM issues i
LEFT JOIN quests q ON i.attached_to_type = 'quest' AND i.attached_to_id = q.id
WHERE i.attached_to_type = 'project'
   OR (i.attached_to_type = 'quest' AND q.project_id IS NOT NULL);

-- View: All devlogs for a project (including cascaded from quests)
CREATE OR REPLACE VIEW project_all_devlogs AS
SELECT DISTINCT
  p.*,
  pc.connected_to_type,
  pc.connected_to_id,
  CASE
    WHEN pc.connected_to_type = 'project' THEN pc.connected_to_id
    ELSE q.project_id
  END as effective_project_id
FROM pages p
JOIN page_connections pc ON p.id = pc.page_id
LEFT JOIN quests q ON pc.connected_to_type = 'quest' AND pc.connected_to_id = q.id
WHERE p.page_type = 'devlog'
  AND (
    pc.connected_to_type = 'project'
    OR (pc.connected_to_type = 'quest' AND q.project_id IS NOT NULL)
  );

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get issue status sort order
CREATE OR REPLACE FUNCTION get_issue_status_order(status TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE status
    WHEN 'in_progress' THEN 1
    WHEN 'blocked' THEN 2
    WHEN 'postponed' THEN 3
    WHEN 'open' THEN 4
    WHEN 'done' THEN 5
    WHEN 'cancelled' THEN 6
    ELSE 7
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if issue status is "complete"
CREATE OR REPLACE FUNCTION is_issue_complete(status TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN status IN ('done', 'cancelled');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- SAMPLE DATA (Optional - uncomment to test)
-- ========================================
/*
-- Insert a sample project
INSERT INTO projects (title, description, slug, status, visibility)
VALUES (
  'Portfolio Website v2',
  'Complete rewrite of my portfolio using React and Supabase',
  'portfolio-v2',
  'active',
  'public'
);

-- Insert a sample quest attached to the project
INSERT INTO quests (name, quest_type, short_description, status, visibility, project_id)
SELECT
  'Implement Database Schema',
  'main',
  'Design and implement the complete database schema for tracking projects, quests, and issues',
  'in_progress',
  'public',
  id
FROM projects WHERE slug = 'portfolio-v2';

-- Insert a sample bug
INSERT INTO issues (attached_to_type, attached_to_id, issue_type, severity, title, description, status)
SELECT
  'project',
  id,
  'bug',
  'minor',
  'Gold text too bright on hover',
  'The gold accent color is too bright when hovering over links',
  'open'
FROM projects WHERE slug = 'portfolio-v2';

-- Insert a sample improvement
INSERT INTO issues (attached_to_type, attached_to_id, issue_type, title, description, status)
SELECT
  'project',
  id,
  'improvement',
  'Add dark mode toggle',
  'Allow users to switch between different color themes',
  'open'
FROM projects WHERE slug = 'portfolio-v2';
*/

-- ========================================
-- NOTES FOR DEVELOPER
-- ========================================
--
-- ISSUE STATUS SORT ORDER (for display):
-- 1. in_progress - Currently working on
-- 2. blocked - Can't continue
-- 3. postponed - Delayed for later
-- 4. open - Not started yet
-- 5. done - Completed
-- 6. cancelled - Won't fix/do
--
-- BUSINESS LOGIC REMINDERS:
-- - Features are NOT issues - create Future Quests instead
-- - Bugs MUST have severity (critical/major/minor)
-- - Improvements don't need severity
-- - Subquests (parent_quest_id IS NOT NULL) are todo lists, no devlogs
-- - Only top-level quests get devlogs attached
--
-- POLYMORPHIC RELATIONSHIPS:
-- - page_connections.connected_to_id can be projects.id or quests.id
-- - issues.attached_to_id can be projects.id or quests.id
-- - Check the *_to_type field to know which table to join
--
-- CASCADING DISPLAY:
-- - Project page shows all quests, devlogs, issues from itself AND its quests
-- - Use project_all_issues and project_all_devlogs views for this
--
-- TESTING QUERIES:
-- SELECT * FROM projects;
-- SELECT * FROM issues WHERE attached_to_type = 'project';
-- SELECT * FROM page_connections WHERE connected_to_type = 'quest';
-- SELECT * FROM project_all_issues WHERE effective_project_id = 'some-uuid';
-- ========================================
