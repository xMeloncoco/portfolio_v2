# Database Migrations

This directory contains migration scripts to separate Projects and Devlogs from the Pages table into their own dedicated tables.

## ⚠️ IMPORTANT: Run Migrations in Order

These migrations **must** be run in the exact order listed below. Each migration depends on the previous ones.

## Migration Order

### 1. Run Projects Migration First

**File:** `migrate-projects-from-pages.sql`

This migration:
- Creates the `projects` table
- Creates the `project_tags` junction table
- Migrates all `page_type='project'` from pages to projects
- Preserves all tags and relationships

**How to run:**
1. Open Supabase SQL Editor
2. Copy the entire contents of `migrate-projects-from-pages.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Review the verification queries output

### 2. Run Devlogs Migration Second

**File:** `migrate-devlogs-from-pages.sql`

This migration:
- Creates the `devlogs` table
- Creates the `devlog_tags` and `devlog_quests` junction tables
- Migrates all `page_type='devlog'` from pages to devlogs
- Preserves all tags

**How to run:**
1. Open Supabase SQL Editor
2. Copy the entire contents of `migrate-devlogs-from-pages.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Review the verification queries output

**Note:** Devlogs will initially have `project_id = NULL`. You can link them to projects through the admin UI at `/admin/devlogs`.

## After Running Migrations

Once both migrations complete successfully:

1. **Navigate to the new admin pages:**
   - `/admin/projects` - Manage projects
   - `/admin/devlogs` - Manage devlogs

2. **Link devlogs to projects:**
   - Edit each devlog and select its parent project from the dropdown

3. **Link quests to projects:**
   - Edit each quest and select its parent project from the dropdown

4. **Verify everything works:**
   - Create a new project
   - Create a new devlog linked to that project
   - Create a new quest linked to that project
   - Check that all relationships work

## Database Schema Changes

### New Tables Created

- `projects` - Standalone projects table
- `project_tags` - Junction table for project-tag relationships
- `devlogs` - Development logs table
- `devlog_tags` - Junction table for devlog-tag relationships
- `devlog_quests` - Junction table for devlog-quest relationships

### Modified Tables

- `pages` - Project and devlog entries are marked as `archived_project` and `archived_devlog`
- `quests` - Now has `project_id` foreign key to link to projects

## Rollback

If you need to rollback the migrations, see the ROLLBACK sections in each migration file. However, **test thoroughly before rolling back** as this will restore the old data structure.

## Cleanup (Optional)

After verifying everything works for at least a week, you can run the CLEANUP sections in each migration file to remove backup tables and archived entries.

## Troubleshooting

### Error: "relation 'project_tags' does not exist"
- **Cause:** You tried to access projects before running the migrations
- **Solution:** Run `migrate-projects-from-pages.sql` first

### Error: "relation 'page_connections' does not exist"
- **Cause:** Old version of migration script
- **Solution:** Pull the latest migration scripts from the repository

### No projects showing in dropdowns
- **Cause:** Migrations not run yet, or projects table is empty
- **Solution:** Run migrations, then check `/admin/projects` to see if projects were migrated

### Tags not working
- **Cause:** Wrong prop name in form components (fixed in latest version)
- **Solution:** Pull latest code changes

## Support

If you encounter issues, check the Supabase SQL Editor error messages and verify:
1. Both migration scripts ran successfully
2. All verification queries show expected counts
3. The admin UI is using the latest code version
