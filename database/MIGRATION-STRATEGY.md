# Migration Strategy: Separate Projects from Pages

## Problem

You currently have **two conflicting project systems**:

1. **Projects as Pages** (Current/Old)
   - `pages` table with `page_type = 'project'`
   - Uses `page_tags` for tagging
   - Has project-specific fields: `project_status`, `project_start_date`, etc.

2. **Dedicated Projects Table** (New/Unused)
   - Separate `projects` table (currently EMPTY)
   - Uses `project_tags` for tagging
   - Clean schema focused on projects

**The Issue**: Your quest linking code points to the `projects` table, but your actual projects are in the `pages` table!

---

## Recommended Architecture

### Clean Separation of Concerns

```
┌─────────────────┐
│   PROJECTS      │  ← Real projects (standalone entities)
│   - Title       │
│   - Description │
│   - Status      │
│   - Dates       │
└────────┬────────┘
         │
         │ has many
         ▼
┌─────────────────┐
│    QUESTS       │  ← Tasks/features within projects
│   - Title       │
│   - Type        │
│   - Status      │
│   - project_id  │  ← Links to projects
└─────────────────┘

┌─────────────────┐
│     PAGES       │  ← Documentation/content
│   - Title       │
│   - Type        │  ← Only 'blog', 'devlog', 'notes'
│   - Content     │
└────────┬────────┘
         │
         │ can link to (via page_connections)
         ▼
┌─────────────────┐
│   PROJECTS      │
│   or QUESTS     │
└─────────────────┘
```

---

## Migration Steps

### Phase 1: Migrate Data (Safe)

**File**: `database/migrate-projects-from-pages.sql`

This script:
1. ✅ Backs up existing project pages
2. ✅ Copies data from `pages` to `projects` table
3. ✅ Migrates tags from `page_tags` to `project_tags`
4. ✅ Marks old project pages as archived (doesn't delete)
5. ✅ Preserves all data with rollback capability

**Run in Supabase SQL Editor**

### Phase 2: Update Frontend Code

After data migration, update these files:

#### 1. Remove Project Type from Pages Form
**File**: `src/pages/PageForm.jsx`

```javascript
// OLD - Remove 'project' from PAGE_TYPES
const PAGE_TYPES = [
  { value: 'project', label: 'Project', ... },  // ❌ REMOVE
  { value: 'devlog', label: 'Devlog', ... },
  { value: 'blog', label: 'Blog', ... },
  { value: 'notes', label: 'Notes', ... }
]

// NEW - Only blog/devlog/notes
const PAGE_TYPES = [
  { value: 'devlog', label: 'Devlog', ... },
  { value: 'blog', label: 'Blog', ... },
  { value: 'notes', label: 'Notes', ... }
]
```

#### 2. Create Dedicated ProjectForm
**New File**: `src/pages/ProjectForm.jsx`

Similar to `QuestForm.jsx` but for projects:
- Title, description, slug
- Status, visibility
- Start/end dates
- External link
- Tag selector

#### 3. Update Routes
**File**: `src/App.jsx` (or wherever routes are defined)

```javascript
// Add project routes
<Route path="/admin/projects" element={<Projects />} />
<Route path="/admin/projects/new" element={<ProjectForm />} />
<Route path="/admin/projects/:id/edit" element={<ProjectForm />} />
```

#### 4. Update Services

**Files to check**:
- `src/services/pagesService.js` - Remove project-specific logic
- `src/services/projectsService.js` - Already exists and should work!

### Phase 3: Update Public Pages

**Files**:
- `src/pages/public/Projects.jsx` - Change to query `projects` table instead of `pages` table

```javascript
// OLD
const { data, error } = await getAllPages({ visibility: 'public' })
const projectPages = data.filter((p) => p.page_type === 'project')

// NEW
const { data, error } = await getAllProjects({ visibility: 'public' })
```

---

## Testing Checklist

After migration:

### Database Level
- [ ] All projects copied from `pages` to `projects`
- [ ] All tags migrated to `project_tags`
- [ ] Quest `project_id` links work
- [ ] No data loss

### Frontend Level
- [ ] Can create new projects in `projects` table
- [ ] Can edit existing projects
- [ ] Quest form shows projects in dropdown
- [ ] Can link quests to projects and it persists
- [ ] Public projects page shows migrated projects

### Devlogs Still Work
- [ ] Can create devlogs (in `pages` table)
- [ ] Can link devlogs to projects (via `page_connections`)
- [ ] Devlog-to-quest linking works

---

## Rollback Plan

If something goes wrong:

```sql
-- 1. Delete migrated data
DELETE FROM projects WHERE id IN (SELECT id FROM pages_projects_backup);
DELETE FROM project_tags WHERE project_id IN (SELECT id FROM pages_projects_backup);

-- 2. Restore pages
UPDATE pages
SET page_type = 'project', visibility = backup.visibility
FROM pages_projects_backup backup
WHERE pages.id = backup.id;

-- 3. Drop backup
DROP TABLE pages_projects_backup;
```

---

## Alternative: Quick Fix (Keep Current Architecture)

If you don't want to migrate right now, you could temporarily make quests link to `pages` instead:

### Option A: Link quests to pages with type='project'

**Change**:
- `quests.project_id` → references `pages.id` (where `page_type = 'project'`)
- Update `QuestForm.jsx` to query `getAllPages({ page_type: 'project' })`

**SQL**:
```sql
-- Change foreign key to point to pages instead
ALTER TABLE quests
DROP CONSTRAINT IF EXISTS quests_project_id_fkey;

ALTER TABLE quests
ADD CONSTRAINT quests_project_id_fkey
FOREIGN KEY (project_id) REFERENCES pages(id) ON DELETE SET NULL;
```

**But this is messy** - you'd have mixed concerns (pages as projects).

---

## Recommendation

**Do the full migration** to dedicated `projects` table because:

1. ✅ **Cleaner architecture** - Each table has one purpose
2. ✅ **Better performance** - Smaller tables, better indexes
3. ✅ **Easier to understand** - `projects` are projects, `pages` are pages
4. ✅ **More flexible** - Can add project-specific features without cluttering `pages`
5. ✅ **Already coded** - The `projectsService.js` and `projects` table already exist!

The migration script is **safe** (backs up data) and **reversible** (rollback plan included).

---

## Timeline

**Estimated Time**: 2-3 hours total

1. **30 min** - Run migration script, verify data
2. **1 hour** - Update frontend code (remove project from pages form, create project form)
3. **30 min** - Update routes and navigation
4. **30 min** - Testing and verification

---

## Next Steps

1. **Review migration script**: `database/migrate-projects-from-pages.sql`
2. **Run migration** in Supabase SQL Editor
3. **Verify data** migrated correctly
4. **Update frontend code** to use `projects` table
5. **Test everything** thoroughly
6. **Clean up** old project pages (after testing)

Let me know if you want me to proceed with creating the `ProjectForm.jsx` and updating the other frontend files!
