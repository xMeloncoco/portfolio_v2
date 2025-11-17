-- Data Upload SQL for Portfolio Database
-- Run this in Supabase SQL Editor
-- This will insert all projects, quests, sub-quests, issues, and tags

-- Clean up existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM devlog_issues;
-- DELETE FROM devlog_items;
-- DELETE FROM inventory_item_tags;
-- DELETE FROM page_quests;
-- DELETE FROM page_tags;
-- DELETE FROM quest_tags;
-- DELETE FROM sub_quests;
-- DELETE FROM issues;
-- DELETE FROM quests;
-- DELETE FROM projects;
-- DELETE FROM tags;

-- ============================================================================
-- STEP 1: Insert Projects
-- ============================================================================

INSERT INTO projects (id, title, description, status, visibility) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Portfolio Website', NULL, 'in_progress', 'public'),
  ('00000000-0000-0000-0000-000000000002', 'Personal Tamagotchi', NULL, 'active', 'private'),
  ('00000000-0000-0000-0000-000000000003', 'Project Floor', 'A project together with my sister to create a system to improve healthcare administration processes.', 'active', 'private'),
  ('00000000-0000-0000-0000-000000000004', 'AI Storyteller Application', NULL, 'in_progress', 'public');

-- ============================================================================
-- STEP 2: Insert Tags
-- ============================================================================

INSERT INTO tags (id, name, color) VALUES
  ('10000000-0000-0000-0000-000000000001', 'art', '#d4af37'),
  ('10000000-0000-0000-0000-000000000002', 'game', '#d4af37'),
  ('10000000-0000-0000-0000-000000000003', 'automation', '#d4af37'),
  ('10000000-0000-0000-0000-000000000004', 'AI', '#d4af37'),
  ('10000000-0000-0000-0000-000000000005', 'chat', '#d4af37'),
  ('10000000-0000-0000-0000-000000000006', 'storytelling', '#d4af37');

-- ============================================================================
-- STEP 3: Insert Quests (Main and Future Quests)
-- ============================================================================

INSERT INTO quests (id, title, quest_type, status, description, visibility) VALUES
  -- Portfolio Website Quests
  ('20000000-0000-0000-0000-000000000001', 'Portfolio website MVP', 'main', 'in_progress', NULL, 'public'),
  ('20000000-0000-0000-0000-000000000002', 'Portfolio website polish', 'future', 'not_started', NULL, 'public'),
  ('20000000-0000-0000-0000-000000000003', 'Portfolio website expanded', 'future', 'not_started', NULL, 'public'),
  ('20000000-0000-0000-0000-000000000004', 'hidden feature portfolio website', 'future', 'not_started', NULL, 'public'),

  -- Standalone Future Quests
  ('20000000-0000-0000-0000-000000000005', 'Pixelart', 'future', 'not_started', NULL, 'private'),
  ('20000000-0000-0000-0000-000000000006', 'Tents and trees application', 'future', 'not_started', NULL, 'public'),
  ('20000000-0000-0000-0000-000000000007', 'Boardgame simulator application', 'future', 'not_started', NULL, 'public'),
  ('20000000-0000-0000-0000-000000000008', 'tamagotchi make app', 'future', 'not_started', NULL, 'public'),
  ('20000000-0000-0000-0000-000000000009', '[b] meetings/events on portfolio', 'future', 'not_started', NULL, 'private'),
  ('20000000-0000-0000-0000-000000000010', 'Tower defense resource management game', 'future', 'not_started', NULL, 'private'),
  ('20000000-0000-0000-0000-000000000011', 'core world game', 'future', 'not_started', NULL, 'private'),

  -- AI Storyteller Quests
  ('20000000-0000-0000-0000-000000000012', 'AI Storyteller Application version 1', 'main', 'in_progress', NULL, 'public');

-- ============================================================================
-- STEP 4: Link Quests to Projects (page_quests)
-- ============================================================================

INSERT INTO page_quests (page_id, quest_id) VALUES
  -- Portfolio Website Project
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'), -- Portfolio website MVP
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'), -- Portfolio website polish
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003'), -- Portfolio website expanded
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004'), -- hidden feature portfolio website

  -- Personal Tamagotchi Project
  ('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000008'), -- tamagotchi make app

  -- AI Storyteller Project
  ('00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000012'); -- AI Storyteller Application version 1

-- ============================================================================
-- STEP 5: Link Tags to Quests (quest_tags)
-- ============================================================================

INSERT INTO quest_tags (quest_id, tag_id) VALUES
  -- Pixelart - art tag
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001'),

  -- Game tags
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002'), -- Tents and trees
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002'), -- Boardgame simulator
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002'), -- tamagotchi
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002'), -- Tower defense
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002'), -- core world game

  -- AI Storyteller - AI, chat, storytelling tags
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004'), -- AI
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005'), -- chat
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000006'); -- storytelling

-- ============================================================================
-- STEP 6: Insert Sub-Quests
-- ============================================================================

INSERT INTO sub_quests (quest_id, title, is_completed, sort_order) VALUES
  -- Sub-quests for "Portfolio website MVP"
  ('20000000-0000-0000-0000-000000000001', 'Creating Issues system', false, 1),
  ('20000000-0000-0000-0000-000000000001', 'improving devlog pages', false, 2),
  ('20000000-0000-0000-0000-000000000001', 'improving quest pages', false, 3),
  ('20000000-0000-0000-0000-000000000001', 'improving front page character stats', false, 4),
  ('20000000-0000-0000-0000-000000000001', 'Improving project pages', false, 5),
  ('20000000-0000-0000-0000-000000000001', 'Adding test data', false, 6),

  -- Sub-quests for "core world game"
  ('20000000-0000-0000-0000-000000000011', 'Gather lore etc.', false, 1),

  -- Sub-quests for "AI Storyteller Application version 1"
  ('20000000-0000-0000-0000-000000000012', 'Ensure logging shows a lot of information', false, 1),
  ('20000000-0000-0000-0000-000000000012', 'Work out character page/dynamics', false, 2),
  ('20000000-0000-0000-0000-000000000012', 'Make notes on different versions', false, 3),
  ('20000000-0000-0000-0000-000000000012', 'A way to see the database information from a playthrough or story', false, 4);

-- ============================================================================
-- STEP 7: Insert Issues and Improvements
-- ============================================================================

INSERT INTO issues (attached_to_type, attached_to_id, issue_type, severity, title, description, status) VALUES
  -- Issues for "Portfolio website MVP" Quest
  ('quest', '20000000-0000-0000-0000-000000000001', 'issues', 'minor', '[B] Icons at adding tags', NULL, 'open'),
  ('quest', '20000000-0000-0000-0000-000000000001', 'issues', 'major', '[B] Removing tags ability', NULL, 'open'),
  ('quest', '20000000-0000-0000-0000-000000000001', 'issues', 'major', '[B] moving items up or down a list', NULL, 'open'),
  ('quest', '20000000-0000-0000-0000-000000000001', 'issues', 'minor', '[B] Pages edit and delete button not outlined correctly', NULL, 'open'),
  ('quest', '20000000-0000-0000-0000-000000000001', 'issues', 'minor', '[B]â€œDrag items to reorder how they appear on the frontendâ€ is too dark', NULL, 'open'),
  ('quest', '20000000-0000-0000-0000-000000000001', 'issues', 'major', '[b] linked quests is shown as checklist', NULL, 'open'),

  -- Improvements for "Portfolio Website" Project
  ('project', '00000000-0000-0000-0000-000000000001', 'improvements', NULL, '[B] Putting Tags underneath input bar', NULL, 'open'),
  ('project', '00000000-0000-0000-0000-000000000001', 'improvements', NULL, '[B] Showing available tags on typing', NULL, 'open'),
  ('project', '00000000-0000-0000-0000-000000000001', 'improvements', NULL, '[B] add option to choose own color at tags', NULL, 'open'),
  ('project', '00000000-0000-0000-0000-000000000001', 'improvements', NULL, '[B] when pressing on the category of a page, also direct to that page.', NULL, 'open'),
  ('project', '00000000-0000-0000-0000-000000000001', 'improvements', NULL, '[B] option to add icons to inventory', NULL, 'open'),
  ('project', '00000000-0000-0000-0000-000000000001', 'improvements', NULL, '[F] Revamp progress bar quests', 'have progress bar of quests take into considerations issues as well as sub', 'open'),

  -- Issues for "AI Storyteller Application version 1" Quest
  ('quest', '20000000-0000-0000-0000-000000000012', 'issues', 'major', 'Story template needs start location', NULL, 'open'),
  ('quest', '20000000-0000-0000-0000-000000000012', 'issues', 'critical', 'Incorrectly shows characters not currently in scene', NULL, 'open'),
  ('quest', '20000000-0000-0000-0000-000000000012', 'issues', 'minor', 'Degraded status', 'Degraded shows on the top of the application, but it does not show why. make it clickable and show why', 'open'),
  ('quest', '20000000-0000-0000-0000-000000000012', 'issues', 'minor', 'New playthrough, then back issue', 'When you made a new playthrough, when you press back to see all the playthroughs of that story, its not listed yet. you have to go back once more, then go to the playthroughs to see it listed', 'open'),
  ('quest', '20000000-0000-0000-0000-000000000012', 'issues', 'critical', 'Past messages are not shown', 'Make sure it shows past messages. Need to think of a limit.', 'open'),
  ('quest', '20000000-0000-0000-0000-000000000012', 'issues', 'critical', 'Error in system info', 'Database: error: Textual SQL expression ''SELECT 1'' should be explicitly declared as text(''SELECT 1'')', 'open'),
  ('quest', '20000000-0000-0000-0000-000000000012', 'issues', 'critical', 'It is not replying to user', 'no ai in place??', 'open');

-- ============================================================================
-- Verify the data
-- ============================================================================

-- Check counts
SELECT 'Projects' as entity, COUNT(*) as count FROM projects
UNION ALL
SELECT 'Tags', COUNT(*) FROM tags
UNION ALL
SELECT 'Quests', COUNT(*) FROM quests
UNION ALL
SELECT 'Sub-quests', COUNT(*) FROM sub_quests
UNION ALL
SELECT 'Issues', COUNT(*) FROM issues
UNION ALL
SELECT 'Quest-Project Links', COUNT(*) FROM page_quests
UNION ALL
SELECT 'Quest-Tag Links', COUNT(*) FROM quest_tags;

-- View inserted data with relationships
SELECT
  q.title as quest_title,
  q.quest_type,
  q.status,
  p.title as project_title,
  COUNT(DISTINCT sq.id) as sub_quest_count,
  COUNT(DISTINCT i.id) as issue_count
FROM quests q
LEFT JOIN page_quests pq ON q.id = pq.quest_id
LEFT JOIN projects p ON pq.page_id = p.id
LEFT JOIN sub_quests sq ON q.id = sq.quest_id
LEFT JOIN issues i ON i.attached_to_type = 'quest' AND i.attached_to_id = q.id
GROUP BY q.id, q.title, q.quest_type, q.status, p.title
ORDER BY q.quest_type, q.title;
