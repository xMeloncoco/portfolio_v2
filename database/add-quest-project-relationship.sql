-- ========================================
-- ADD QUEST-TO-PROJECT RELATIONSHIP
-- ========================================
-- This migration adds the missing project_id foreign key to quests table
-- and fixes multiple database performance issues identified by linter
-- ========================================

-- ========================================
-- 1. ADD QUEST-TO-PROJECT FOREIGN KEY
-- ========================================

-- Add project_id column to quests table
ALTER TABLE public.quests
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add index for the foreign key (improves query performance)
CREATE INDEX idx_quests_project_id ON public.quests(project_id);

-- Add comment for documentation
COMMENT ON COLUMN public.quests.project_id IS 'Foreign key linking quest to a parent project';

-- ========================================
-- 2. ADD MISSING FOREIGN KEY INDEXES
-- ========================================
-- These are flagged by the linter as "unindexed foreign keys"

-- devlog_items.page_id index
CREATE INDEX IF NOT EXISTS idx_devlog_items_page_id ON public.devlog_items(page_id);

-- inventory_item_tags.tag_id index
CREATE INDEX IF NOT EXISTS idx_inventory_item_tags_tag_id ON public.inventory_item_tags(tag_id);

-- page_quests.quest_id index
CREATE INDEX IF NOT EXISTS idx_page_quests_quest_id ON public.page_quests(quest_id);

-- page_tags.tag_id index
CREATE INDEX IF NOT EXISTS idx_page_tags_tag_id ON public.page_tags(tag_id);

-- projects.parent_id index
CREATE INDEX IF NOT EXISTS idx_projects_parent_id ON public.projects(parent_id);

-- quest_tags.tag_id index
CREATE INDEX IF NOT EXISTS idx_quest_tags_tag_id ON public.quest_tags(tag_id);

-- ========================================
-- 3. FIX MULTIPLE PERMISSIVE POLICIES
-- ========================================
-- Remove duplicate/overlapping RLS policies that cause performance issues

-- contact_messages: Remove "Allow public update" (keeping "Allow authenticated update")
DROP POLICY IF EXISTS "Allow public update on contact_messages" ON public.contact_messages;

-- devlog_items: Remove "Allow all operations" (keeping specific public read)
DROP POLICY IF EXISTS "Allow all operations on devlog_items" ON public.devlog_items;

-- page_tags: Remove "Allow all operations" (keeping specific public read)
DROP POLICY IF EXISTS "Allow all operations on page_tags" ON public.page_tags;

-- pages: Remove "Allow all operations" (keeping specific public read)
DROP POLICY IF EXISTS "Allow all operations on pages" ON public.pages;

-- tags: Remove "Allow all operations" (keeping specific public read)
DROP POLICY IF EXISTS "Allow all operations on tags" ON public.tags;

-- ========================================
-- 4. REMOVE UNUSED INDEXES
-- ========================================
-- These indexes have never been used and waste space/performance

DROP INDEX IF EXISTS public.idx_issues_status;
DROP INDEX IF EXISTS public.idx_issues_type;
DROP INDEX IF EXISTS public.idx_devlog_issues_devlog_id;
DROP INDEX IF EXISTS public.idx_contact_messages_category;
DROP INDEX IF EXISTS public.idx_quests_status;
DROP INDEX IF EXISTS public.idx_quests_updated_at;

-- ========================================
-- 5. ADD USEFUL INDEXES
-- ========================================
-- Replace the unused ones with more useful composite indexes

-- Compound index for filtering quests by project and status
CREATE INDEX idx_quests_project_status ON public.quests(project_id, status) WHERE project_id IS NOT NULL;

-- Compound index for issues by attachment and status
CREATE INDEX idx_issues_attached_status ON public.issues(attached_to_type, attached_to_id, status);

-- Index for recent quests (more useful than just updated_at)
CREATE INDEX idx_quests_visibility_updated ON public.quests(visibility, updated_at DESC);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify the project_id column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'quests'
        AND column_name = 'project_id'
    ) THEN
        RAISE NOTICE 'SUCCESS: project_id column added to quests table';
    ELSE
        RAISE EXCEPTION 'FAILED: project_id column not found in quests table';
    END IF;
END $$;

-- Verify the foreign key constraint exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
        AND table_name = 'quests'
        AND constraint_name LIKE '%project%'
    ) THEN
        RAISE NOTICE 'SUCCESS: Foreign key constraint created';
    ELSE
        RAISE EXCEPTION 'FAILED: Foreign key constraint not found';
    END IF;
END $$;

-- Show all quests with their linked projects (should return empty initially)
SELECT
    q.id,
    q.title AS quest_title,
    p.title AS project_title
FROM public.quests q
LEFT JOIN public.projects p ON q.project_id = p.id
LIMIT 5;

RAISE NOTICE 'Migration completed successfully!';
