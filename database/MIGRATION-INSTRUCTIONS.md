# Database Migration Instructions

## Overview

This migration fixes the quest-to-project linking issue and improves database performance by:
1. ✅ Adding missing `project_id` foreign key to `quests` table
2. ✅ Adding indexes for all unindexed foreign keys (6 indexes)
3. ✅ Removing duplicate RLS policies (performance improvement)
4. ✅ Removing unused indexes (6 unused indexes)
5. ✅ Adding useful composite indexes for common queries

## Prerequisites

- Access to Supabase SQL Editor
- Database backup (recommended)

## Migration Steps

### Option 1: Via Supabase Dashboard (Recommended)

1. **Login to Supabase**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Navigate to "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Migration**
   - Copy the entire contents of `database/add-quest-project-relationship.sql`
   - Paste into the SQL editor
   - Click "Run" or press `Ctrl/Cmd + Enter`

4. **Verify Success**
   - You should see success messages in the output:
     ```
     SUCCESS: project_id column added to quests table
     SUCCESS: Foreign key constraint created
     Migration completed successfully!
     ```

5. **Check Results**
   - The query will also show a preview of quests with projects (empty initially)

### Option 2: Via Command Line (Advanced)

```bash
# Using psql
psql -h <your-supabase-host> \
     -U postgres \
     -d postgres \
     -f database/add-quest-project-relationship.sql

# Using Supabase CLI
supabase db push
```

## What Changes?

### New Database Schema

**Before:**
```sql
quests:
  - id (uuid)
  - title (text)
  - quest_type (text)
  - status (text)
  - description (text)
  - visibility (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)
  ❌ NO project_id!
```

**After:**
```sql
quests:
  - id (uuid)
  - title (text)
  - quest_type (text)
  - status (text)
  - description (text)
  - visibility (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)
  ✅ project_id (uuid) -- NEW COLUMN!
```

### New Indexes Added

1. `idx_quests_project_id` - For quest-to-project lookups
2. `idx_devlog_items_page_id` - For devlog item queries
3. `idx_inventory_item_tags_tag_id` - For inventory tag filtering
4. `idx_page_quests_quest_id` - For page-quest relationships
5. `idx_page_tags_tag_id` - For page tag queries
6. `idx_projects_parent_id` - For hierarchical project queries
7. `idx_quest_tags_tag_id` - For quest tag filtering
8. `idx_quests_project_status` - Composite index for filtering
9. `idx_issues_attached_status` - For issue queries
10. `idx_quests_visibility_updated` - For recent public quests

### Indexes Removed (Unused)

- `idx_issues_status`
- `idx_issues_type`
- `idx_devlog_issues_devlog_id`
- `idx_contact_messages_category`
- `idx_quests_status`
- `idx_quests_updated_at`

### RLS Policies Changed

**Removed duplicate policies** (keeping the more specific ones):
- `Allow all operations on devlog_items`
- `Allow all operations on page_tags`
- `Allow all operations on pages`
- `Allow all operations on tags`
- `Allow public update on contact_messages`

## Rollback Plan

If you need to rollback this migration:

```sql
-- Remove the project_id column
ALTER TABLE public.quests DROP COLUMN IF EXISTS project_id;

-- Drop new indexes
DROP INDEX IF EXISTS idx_quests_project_id;
DROP INDEX IF EXISTS idx_devlog_items_page_id;
-- ... etc

-- Re-create removed policies (if needed)
-- See your database backup for exact policy definitions
```

## Testing After Migration

1. **Test Quest-to-Project Linking**
   ```bash
   # In your app:
   # 1. Go to quest form
   # 2. Select a project from dropdown
   # 3. Save quest
   # 4. Verify project_id is saved
   ```

2. **Verify Database State**
   ```sql
   -- Check the new column exists
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'quests' AND column_name = 'project_id';

   -- Check the foreign key
   SELECT constraint_name, constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'quests' AND constraint_type = 'FOREIGN KEY';

   -- Test the relationship
   SELECT q.title, p.title as project_title
   FROM quests q
   LEFT JOIN projects p ON q.project_id = p.id
   LIMIT 10;
   ```

3. **Test Frontend**
   - Create a new quest
   - Link it to a project
   - Save and reload the page
   - Verify the project selection persists

## Performance Improvements

After this migration, you should see:
- ✅ **Faster quest queries** with project filtering
- ✅ **Better index usage** for foreign key joins
- ✅ **Reduced policy overhead** from removing duplicates
- ✅ **Less disk space** from removing unused indexes

## Support

If you encounter any errors:
1. Check the Supabase logs for detailed error messages
2. Verify you have sufficient permissions
3. Check if RLS is enabled on affected tables
4. Review the verification query output

## Next Steps

After successful migration:
1. ✅ Your quest-to-project linking will work
2. ✅ Issue-to-project linking will work (already fixed in code)
3. ✅ No more "Could not find relationship" errors
4. ✅ Performance improvements from better indexes
