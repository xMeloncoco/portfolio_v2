# Fix Contact Form RLS Error - Step by Step

If you're getting: **"new row violates row-level security policy for table contact_messages"**

Follow these steps:

---

## Option 1: Quick SQL Fix (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Complete Fix
1. Open the file `database/COMPLETE-RLS-FIX.sql`
2. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
3. **Paste into SQL Editor** (Ctrl+V)
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify It Worked
You should see results showing 4 policies:
- `contact_messages_insert_policy` (roles: {public})
- `contact_messages_select_policy` (roles: {authenticated})
- `contact_messages_update_policy` (roles: {authenticated})
- `contact_messages_delete_policy` (roles: {authenticated})

### Step 4: Test the Contact Form
Go to your website and try submitting a message. It should work!

---

## Option 2: Fix via Supabase UI (Manual)

If SQL doesn't work or you want to do it manually:

### Step 1: Go to Table Editor
1. Open Supabase Dashboard
2. Click **Table Editor** in left sidebar
3. Find and click on `contact_messages` table

### Step 2: Open RLS Settings
1. Look for the shield icon or "RLS" indicator
2. Click on it or click the **⚙️ gear icon** → **Edit table**
3. Find **Row Level Security** section

### Step 3: Delete ALL Existing Policies
1. You should see existing policies listed
2. Click the **trash icon** next to each policy
3. Delete ALL policies (don't worry, we'll recreate them)

### Step 4: Create INSERT Policy (Public Access)
1. Click **"New Policy"** or **"Add Policy"**
2. Select **"Create a policy from scratch"**
3. Fill in:
   - **Policy name:** `contact_messages_insert_policy`
   - **Allowed operation:** `INSERT` (check only this box)
   - **Target roles:** Select **"public"** or **"anon, authenticated"** (both)
   - **USING expression:** Leave empty or put `true`
   - **WITH CHECK expression:** Put `true`
4. Click **Save** or **Create Policy**

### Step 5: Create SELECT Policy (Admin Only)
1. Click **"New Policy"** again
2. Fill in:
   - **Policy name:** `contact_messages_select_policy`
   - **Allowed operation:** `SELECT` (check only this box)
   - **Target roles:** Select **"authenticated"**
   - **USING expression:** Put `true`
   - **WITH CHECK expression:** Leave empty
3. Click **Save**

### Step 6: Create UPDATE Policy (Admin Only)
1. Click **"New Policy"** again
2. Fill in:
   - **Policy name:** `contact_messages_update_policy`
   - **Allowed operation:** `UPDATE` (check only this box)
   - **Target roles:** Select **"authenticated"**
   - **USING expression:** Put `true`
   - **WITH CHECK expression:** Put `true`
3. Click **Save**

### Step 7: Create DELETE Policy (Admin Only)
1. Click **"New Policy"** again
2. Fill in:
   - **Policy name:** `contact_messages_delete_policy`
   - **Allowed operation:** `DELETE` (check only this box)
   - **Target roles:** Select **"authenticated"**
   - **USING expression:** Put `true`
   - **WITH CHECK expression:** Leave empty
3. Click **Save**

### Step 8: Verify RLS is Enabled
1. Make sure there's a toggle or checkbox for **"Enable RLS"**
2. It should be **ON/Enabled**
3. If not, turn it ON

### Step 9: Test
Go to your contact form and try submitting. It should work now!

---

## Option 3: Disable RLS Temporarily (NOT RECOMMENDED)

⚠️ **Only use this for testing - NOT for production!**

If you just want to test if the form works:

```sql
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
```

Then try the form. If it works, the issue is definitely RLS.

**Re-enable it immediately:**
```sql
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
```

Then use Option 1 or 2 to fix the policies properly.

---

## Troubleshooting

### Still getting the error?

1. **Check your Supabase client configuration**
   - Look in `src/config/supabase.js`
   - Make sure you're using the correct `anon` key

2. **Clear browser cache**
   - The Supabase client might be cached
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

3. **Check browser console**
   - Open DevTools (F12)
   - Look for any authentication errors
   - Share the exact error message

4. **Verify the table exists**
   ```sql
   SELECT * FROM contact_messages LIMIT 1;
   ```
   If this fails, the table doesn't exist.

5. **Check Supabase client logs**
   - In the Supabase Dashboard, go to **Logs**
   - Look for recent errors related to `contact_messages`

---

## Understanding the Fix

**What we're doing:**

- **INSERT policy with role `public`:** Allows ANYONE (visitors) to submit messages
- **SELECT/UPDATE/DELETE with role `authenticated`:** Only logged-in admins can view/manage

**Why `TO public` instead of `TO anon`:**

The `anon` role is specific to unauthenticated users, but depending on your Supabase client configuration, requests might not be tagged as `anon`. Using `public` (or listing both `anon, authenticated`) ensures all users can submit, which is what we want for a contact form.

**Is this safe?**

✅ Yes! Contact forms should be publicly accessible. The sensitive operations (viewing, editing, deleting) are still protected by requiring authentication.

---

## After the Fix Works

Once the contact form works, you can:

1. **Test the admin inbox**
   - Log in to `/admin/login`
   - Go to `/admin/inbox`
   - You should see submitted messages

2. **Test message management**
   - Try marking messages as read
   - Try deleting a message
   - These should work when logged in as admin

3. **Verify security**
   - Log out
   - Try accessing `/admin/inbox` while logged out
   - You should be redirected to login (security working!)

---

## Need More Help?

If you're still stuck:

1. Run this query and share the results:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'contact_messages';
   ```

2. Check browser console (F12) for errors

3. Check Supabase Dashboard → Logs for errors

4. Share the exact error message you're seeing
