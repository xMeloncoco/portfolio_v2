-- ========================================
-- PORTFOLIO V2 - PHASE 2 DATABASE SETUP
-- ========================================
-- This file contains all SQL needed for Phase 2
-- Run this in your Supabase SQL Editor AFTER phase-1 setup
-- ========================================

-- ========================================
-- TABLE: tags
-- Reusable tags for pages, quests, and future features
-- ========================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#d4af37', -- Default gold color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default tags (you can add more later)
INSERT INTO tags (name, color) VALUES
  ('React', '#61dafb'),
  ('JavaScript', '#f7df1e'),
  ('CSS', '#264de4'),
  ('HTML', '#e34c26'),
  ('Supabase', '#3ecf8e'),
  ('Portfolio', '#d4af37'),
  ('Learning', '#9b59b6'),
  ('Bug Fix', '#e74c3c'),
  ('Feature', '#2ecc71'),
  ('Refactor', '#3498db')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- TABLE: pages
-- Stores all page types (blogs, devlogs, notes, projects)
-- ========================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info (all page types)
  title TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'notes', -- 'blog', 'devlog', 'notes', 'project'
  content TEXT, -- HTML/Markdown content
  visibility TEXT NOT NULL DEFAULT 'private', -- 'public' or 'private'

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Project-specific fields (only for project type)
  project_status TEXT, -- 'planning', 'in_progress', 'completed', 'on_hold', 'cancelled'
  project_start_date DATE,
  project_end_date DATE,

  -- Constraints
  CONSTRAINT valid_page_type CHECK (page_type IN ('blog', 'devlog', 'notes', 'project')),
  CONSTRAINT valid_visibility CHECK (visibility IN ('public', 'private')),
  CONSTRAINT valid_project_status CHECK (
    project_status IS NULL OR
    project_status IN ('planning', 'in_progress', 'completed', 'on_hold', 'cancelled')
  )
);

-- ========================================
-- TABLE: page_tags
-- Junction table for many-to-many relationship between pages and tags
-- ========================================
CREATE TABLE IF NOT EXISTS page_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure no duplicate page-tag combinations
  UNIQUE(page_id, tag_id)
);

-- ========================================
-- TABLE: quests
-- Main quests, side quests, and future quests
-- ========================================
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  quest_type TEXT NOT NULL DEFAULT 'side', -- 'main', 'side', 'future'
  visibility TEXT NOT NULL DEFAULT 'private', -- 'public' or 'private'

  -- Descriptions
  short_description TEXT, -- For frontpage/cards
  long_description TEXT, -- Full description

  -- Status
  status TEXT NOT NULL DEFAULT 'gathering_info',
  -- Possible statuses: gathering_info, creating_plan, in_progress, debugging,
  -- testing, polishing, finished, on_hold, dropped, future

  -- Dates
  started_date DATE,
  finished_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Optional link to project page
  project_page_id UUID REFERENCES pages(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_quest_type CHECK (quest_type IN ('main', 'side', 'future')),
  CONSTRAINT valid_quest_visibility CHECK (visibility IN ('public', 'private')),
  CONSTRAINT valid_quest_status CHECK (
    status IN (
      'gathering_info', 'creating_plan', 'in_progress', 'debugging',
      'testing', 'polishing', 'finished', 'on_hold', 'dropped', 'future'
    )
  )
);

-- ========================================
-- TABLE: quest_tags
-- Junction table for many-to-many relationship between quests and tags
-- ========================================
CREATE TABLE IF NOT EXISTS quest_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure no duplicate quest-tag combinations
  UNIQUE(quest_id, tag_id)
);

-- ========================================
-- TABLE: sub_quests
-- Checklist items for quests
-- ========================================
CREATE TABLE IF NOT EXISTS sub_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0, -- For ordering sub-quests
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLE: page_quests
-- Links pages to quests (many-to-many)
-- ========================================
CREATE TABLE IF NOT EXISTS page_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure no duplicate page-quest combinations
  UNIQUE(page_id, quest_id)
);

-- ========================================
-- TABLE: devlog_items
-- To-do items for devlog pages
-- ========================================
CREATE TABLE IF NOT EXISTS devlog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'done', 'added'
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint for valid status
  CONSTRAINT valid_devlog_status CHECK (status IN ('todo', 'done', 'added'))
);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE devlog_items ENABLE ROW LEVEL SECURITY;

-- Tags: Public read access (anyone can see tags)
CREATE POLICY "Allow public read access to tags"
  ON tags FOR SELECT USING (true);

-- Tags: Allow insert/update/delete for now (will restrict later)
CREATE POLICY "Allow all operations on tags"
  ON tags FOR ALL USING (true);

-- Pages: Public read for public pages, all access for admin
CREATE POLICY "Allow public read access to public pages"
  ON pages FOR SELECT USING (visibility = 'public');

CREATE POLICY "Allow all operations on pages"
  ON pages FOR ALL USING (true);

-- Page Tags: Public read
CREATE POLICY "Allow public read access to page_tags"
  ON page_tags FOR SELECT USING (true);

CREATE POLICY "Allow all operations on page_tags"
  ON page_tags FOR ALL USING (true);

-- Quests: Public read for public quests
CREATE POLICY "Allow public read access to public quests"
  ON quests FOR SELECT USING (visibility = 'public');

CREATE POLICY "Allow all operations on quests"
  ON quests FOR ALL USING (true);

-- Quest Tags: Public read
CREATE POLICY "Allow public read access to quest_tags"
  ON quest_tags FOR SELECT USING (true);

CREATE POLICY "Allow all operations on quest_tags"
  ON quest_tags FOR ALL USING (true);

-- Sub Quests: Public read (through quest relationship)
CREATE POLICY "Allow public read access to sub_quests"
  ON sub_quests FOR SELECT USING (true);

CREATE POLICY "Allow all operations on sub_quests"
  ON sub_quests FOR ALL USING (true);

-- Page Quests: Public read
CREATE POLICY "Allow public read access to page_quests"
  ON page_quests FOR SELECT USING (true);

CREATE POLICY "Allow all operations on page_quests"
  ON page_quests FOR ALL USING (true);

-- Devlog Items: Public read (through page relationship)
CREATE POLICY "Allow public read access to devlog_items"
  ON devlog_items FOR SELECT USING (true);

CREATE POLICY "Allow all operations on devlog_items"
  ON devlog_items FOR ALL USING (true);

-- ========================================
-- FUNCTIONS: Auto-update timestamps
-- ========================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_quests_updated_at
  BEFORE UPDATE ON sub_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devlog_items_updated_at
  BEFORE UPDATE ON devlog_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INDEXES: Performance optimization
-- ========================================

-- Index for faster sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_quests_updated_at ON quests(updated_at DESC);

-- Index for filtering by type and visibility
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_visibility ON pages(visibility);
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_visibility ON quests(visibility);

-- ========================================
-- NOTES FOR DEVELOPER
-- ========================================
--
-- QUEST STATUS MAPPING (official → fun display names):
-- gathering_info → "Gathering Resources"
-- creating_plan → "Crafting Battle Plan"
-- in_progress → "In Progress"
-- debugging → "Stuck in Battle"
-- testing → "Testing Potions"
-- polishing → "Polishing Artifact"
-- finished → "Quest Complete!"
-- on_hold → "Waiting for Mana"
-- dropped → "Quest Abandoned"
-- future → "Future Quest"
--
-- PAGE TYPES:
-- blog → Blog posts and articles
-- devlog → Development logs with to-do lists
-- notes → Quick notes and ideas
-- project → Full project pages with status tracking
--
-- TESTING:
-- SELECT * FROM pages;
-- SELECT * FROM quests;
-- SELECT * FROM tags;
-- ========================================
