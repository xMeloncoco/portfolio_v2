# Database Migration Notes

This document outlines the database changes needed after simplifying the project structure.

## Tables to Remove

The following tables are no longer used and should be dropped from the database:

### Issues System Tables
- `issues` - Main issues table
- `devlog_issues` - Junction table linking devlogs to issues

### Devlog System Tables
- `devlog_subquests` - Junction table linking devlogs to subquests
- `devlog_tags` - Junction table linking devlogs to tags (if exists)
- `devlog_quests` - Junction table linking devlogs to quests (if exists)

Note: Pages with `page_type = 'devlog'` should be migrated to either `'blog'` or `'notes'` or deleted.

## Migration Steps

1. **Backup your database** before making any changes
2. Remove any pages with `page_type = 'devlog'` or convert them to `'blog'` or `'notes'`
3. Drop the tables listed above using SQL:

```sql
-- Drop issues system tables
DROP TABLE IF EXISTS devlog_issues;
DROP TABLE IF EXISTS issues;

-- Drop devlog junction tables
DROP TABLE IF EXISTS devlog_subquests;
DROP TABLE IF EXISTS devlog_tags;
DROP TABLE IF EXISTS devlog_quests;
```

4. Verify that no other tables reference the dropped tables

## PageType Enum Update

If you're using PostgreSQL with enum types, update the PageType enum:

```sql
-- This will depend on your specific database setup
-- You may need to create a new enum and migrate data
-- Example:
ALTER TYPE page_type DROP VALUE 'devlog'; -- This may not work in all PostgreSQL versions
```

Alternatively, if using constraints, update the check constraint on the `pages` table to only allow 'blog' and 'notes'.
