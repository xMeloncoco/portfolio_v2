-- ========================================
-- PHASE 4: DEVLOG SUBQUESTS TRACKING
-- ========================================
-- Adds ability to track subquest progress in devlogs

-- ========================================
-- TABLE: devlog_subquests
-- Junction table linking devlogs to subquests they worked on
-- ========================================
CREATE TABLE IF NOT EXISTS devlog_subquests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devlog_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  subquest_id UUID NOT NULL REFERENCES sub_quests(id) ON DELETE CASCADE,

  -- Work tracking
  was_completed BOOLEAN NOT NULL DEFAULT false, -- Whether this subquest was completed in this devlog session
  work_notes TEXT, -- Notes about the work done on this subquest

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate subquest entries in same devlog
  UNIQUE(devlog_id, subquest_id)
);

-- Indexes for devlog-subquest queries
CREATE INDEX IF NOT EXISTS idx_devlog_subquests_devlog_id ON devlog_subquests(devlog_id);
CREATE INDEX IF NOT EXISTS idx_devlog_subquests_subquest_id ON devlog_subquests(subquest_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE devlog_subquests ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin context)
CREATE POLICY "Allow all operations for authenticated users"
  ON devlog_subquests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get subquests worked on in a devlog
CREATE OR REPLACE FUNCTION get_devlog_subquests(p_devlog_id UUID)
RETURNS TABLE (
  subquest_id UUID,
  subquest_title TEXT,
  quest_id UUID,
  quest_title TEXT,
  was_completed BOOLEAN,
  work_notes TEXT,
  devlog_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sq.id as subquest_id,
    sq.title as subquest_title,
    q.id as quest_id,
    q.title as quest_title,
    ds.was_completed,
    ds.work_notes,
    ds.created_at as devlog_created_at
  FROM devlog_subquests ds
  JOIN sub_quests sq ON ds.subquest_id = sq.id
  JOIN quests q ON sq.quest_id = q.id
  WHERE ds.devlog_id = p_devlog_id
  ORDER BY q.title, sq.sort_order;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE devlog_subquests IS 'Tracks which subquests were worked on in which devlog sessions';
COMMENT ON COLUMN devlog_subquests.was_completed IS 'Whether this subquest was marked complete during this devlog session';
COMMENT ON COLUMN devlog_subquests.work_notes IS 'Optional notes about what was done on this subquest';
