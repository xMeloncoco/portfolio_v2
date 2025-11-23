# Troubleshooting Quest-to-Project Linking

## Issue Summary

The quest-to-project linking was failing because of a **critical bug** in `questsService.js`:

```javascript
// ❌ WRONG - This failed when project_id was null
if (questData.project_id) {
  cleanQuestData.project_id = questData.project_id
}

// ✅ CORRECT - This works even when project_id is null
if ('project_id' in questData) {
  cleanQuestData.project_id = questData.project_id || null
}
```

**The problem**: When you selected "No Project" or left it empty, `project_id` would be `null`, making the condition `false`, so the field was never included in the database insert.

---

## Fix Applied ✅

**File Changed**: `src/services/questsService.js` (line 224-228)

The service now properly handles:
- ✅ Linking to a project (UUID value)
- ✅ Unlinking from a project (null value)
- ✅ Creating quest without project (null value)

---

## Testing Steps

### 1. **Test Creating a Quest WITH a Project**

1. Open your app and go to the Quest form
2. Fill in quest details
3. Select a project from the "Link to Project" dropdown
4. Click "Save" or "Create Quest"
5. **Verify**: The quest should save successfully

**Database Check**:
```sql
SELECT id, title, project_id
FROM public.quests
ORDER BY created_at DESC
LIMIT 5;
```
You should see the `project_id` populated with a UUID.

---

### 2. **Test Creating a Quest WITHOUT a Project**

1. Create a new quest
2. Leave "Link to Project" as "No Project"
3. Save the quest
4. **Verify**: The quest should save with `project_id = null`

---

### 3. **Test Editing a Quest to ADD a Project**

1. Edit an existing quest that has no project
2. Select a project from dropdown
3. Save
4. **Verify**: Reload the page - project should persist

---

### 4. **Test Editing a Quest to REMOVE a Project**

1. Edit a quest that has a project linked
2. Change dropdown to "No Project"
3. Save
4. **Verify**: Reload the page - project should be cleared

---

## If It STILL Doesn't Work

There may be an **RLS (Row Level Security) policy** blocking updates to the `project_id` field.

### Step 1: Check RLS Policies

Run this in Supabase SQL Editor:

```sql
-- File: database/check-quests-rls.sql
SELECT
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'quests';
```

### Step 2: Look for These Issues

**Red Flags**:
- ❌ No UPDATE policy for `authenticated` or your admin role
- ❌ UPDATE policy with `WITH CHECK` that doesn't allow all fields
- ❌ Policies that explicitly restrict certain columns

### Step 3: Fix RLS Policies

If you find RLS issues, run:

```bash
# File: database/fix-quests-rls-for-project-id.sql
```

This will:
- ✅ Allow authenticated users to UPDATE all fields (including project_id)
- ✅ Allow public read access to public quests
- ✅ Remove overly restrictive policies

---

## Testing in Browser Console

You can also test directly in the browser:

```javascript
// Open browser console on your app
// Import your service
import { updateQuest } from './services/questsService'

// Test updating a quest with project_id
const result = await updateQuest('YOUR_QUEST_ID', {
  project_id: 'YOUR_PROJECT_ID'
})

console.log('Update result:', result)
```

**Expected**: `result.data` should contain the updated quest with `project_id` set.

---

## Common Errors and Fixes

### Error: "No projects available"

**Cause**: No projects exist in database

**Fix**: Create at least one project first via the Projects page

---

### Error: "Could not find a relationship between 'projects' and 'quests'"

**Cause**: This was the original schema issue - should be fixed now

**Fix**: Ensure the migration was run (`database/add-quest-project-relationship.sql`)

**Verify**:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quests' AND column_name = 'project_id';
```

Should return: `project_id | uuid`

---

### Error: Permission denied or RLS violation

**Cause**: RLS policies blocking the update

**Fix**: Run `database/fix-quests-rls-for-project-id.sql`

**Verify**:
```sql
-- Test if you can update
UPDATE public.quests
SET project_id = (SELECT id FROM public.projects LIMIT 1)
WHERE id = (SELECT id FROM public.quests LIMIT 1);
```

Should succeed without errors.

---

### Error: Field still shows null after save

**Possible Causes**:
1. ❌ Frontend code not pulling latest changes
2. ❌ Browser cache issue
3. ❌ API not returning updated data

**Fix**:
```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Verify data in database
SELECT * FROM public.quests WHERE id = 'YOUR_QUEST_ID';
```

---

## Debugging Checklist

- [ ] Migration ran successfully (`project_id` column exists)
- [ ] Service code updated (using `'in'` operator)
- [ ] Frontend code updated (project selector visible)
- [ ] At least one project exists in database
- [ ] RLS policies allow UPDATE on quests table
- [ ] Browser cache cleared
- [ ] No console errors in browser DevTools
- [ ] Database query shows `project_id` is populated

---

## Quick Test Query

Run this to verify everything is connected:

```sql
-- This should show quests with their linked projects
SELECT
    q.id,
    q.title AS quest_title,
    q.project_id,
    p.title AS project_title,
    p.id AS project_id_verify
FROM public.quests q
LEFT JOIN public.projects p ON q.project_id = p.id
ORDER BY q.created_at DESC
LIMIT 10;
```

**Expected**: If a quest has `project_id` set, you should see the `project_title` populated.

---

## Still Having Issues?

1. **Check browser console** for JavaScript errors
2. **Check Supabase logs** for database errors
3. **Run the RLS check script** to verify permissions
4. **Verify the migration** ran completely
5. **Check network tab** in DevTools to see the actual API request/response

If all else fails, please provide:
- Browser console errors
- Network request/response from DevTools
- Output of the RLS check query
- Output of the verification query
