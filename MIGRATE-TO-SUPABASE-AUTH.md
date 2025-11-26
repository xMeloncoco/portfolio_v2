# Migration Guide: Switch to Supabase Auth

## Overview

This guide walks you through migrating from custom localStorage authentication to proper Supabase Auth. This provides **real database-level security** while maintaining your simple password-only login UX.

## What Changed

### Before (Custom Auth)
- Password stored as bcrypt hash in `admin_config` table
- Session stored in localStorage
- React app checked localStorage for auth
- Database policies set to `public` (weak security)
- Anyone with Supabase anon key could bypass security

### After (Supabase Auth)
- Real Supabase Auth user with email/password
- Session managed by Supabase (httpOnly cookies)
- React app checks Supabase session
- Database policies set to `authenticated` (strong security)
- Even with anon key, attackers can't bypass authentication

### Your UX: Still Password-Only!
- Login form still only shows password field
- Behind the scenes, we use a fixed admin email from `.env`
- Users don't see or know about the email
- Same simple UX, proper security underneath

## Migration Steps

### Step 1: Create Supabase Auth User

1. Open your Supabase Dashboard
2. Go to **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Fill in:
   - **Email**: Your admin email (e.g., `admin@yourportfolio.com`)
   - **Password**: Your new admin password
   - ✅ Check **Auto Confirm User** (important!)
5. Click **Create user**

**Important:** Remember this password! You'll need it to log in.

### Step 2: Update Environment Variables

1. Open your `.env` file (or create it from `.env.example`)
2. Add the admin email:
   ```env
   VITE_ADMIN_EMAIL=admin@yourportfolio.com
   ```
3. Make sure your Supabase URL and anon key are still there:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Step 3: Update RLS Policies in Database

1. Open Supabase Dashboard → **SQL Editor**
2. Open the file: `database/SECURE-RLS-WITH-SUPABASE-AUTH.sql`
3. Copy the **entire contents**
4. Paste into Supabase SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Verify success - you should see:
   ```
   ✅ Policies showing {authenticated} for write operations
   ✅ Policies showing {public} for read operations
   ✅ All tables showing rowsecurity: true
   ```

### Step 4: Remove Old Authentication System (Optional Cleanup)

The old bcrypt password system is no longer needed. You can optionally clean it up:

1. **Remove admin_config table** (optional):
   ```sql
   -- Run in Supabase SQL Editor
   DROP TABLE IF EXISTS admin_config;
   ```

2. **Remove bcryptjs from package.json** (optional):
   ```bash
   npm uninstall bcryptjs
   ```

**Note:** These cleanup steps are optional. The new system doesn't use them, so they won't cause issues if left in place.

### Step 5: Restart Your Dev Server

1. Stop your dev server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

### Step 6: Test Authentication

1. **Clear localStorage** (important!):
   - Open Browser DevTools (F12)
   - Go to **Application** → **Storage** → **Local Storage**
   - Find your site
   - Delete `portfolio_admin_authenticated` if it exists
   - Refresh the page

2. **Test login**:
   - Go to `/admin` or `/admin/login`
   - Enter your **new password** (the one you set in Step 1)
   - Click **Enter**
   - You should be logged in and see the admin dashboard

3. **Test editing**:
   - Try editing a project, quest, or contact message
   - Changes should save successfully (no more RLS errors!)

4. **Test logout**:
   - Click the logout button
   - You should be redirected to login
   - Try accessing `/admin` without logging in
   - You should be redirected to login

5. **Test session persistence**:
   - Log in
   - Refresh the page
   - You should still be logged in
   - Close and reopen the browser
   - You should still be logged in (for ~7 days by default)

## What Files Were Changed

### Updated Files
- ✅ `src/utils/auth.js` - Now uses Supabase Auth instead of localStorage
- ✅ `src/components/ProtectedRoute.jsx` - Checks Supabase session with loading state
- ✅ `src/layouts/AdminLayout.jsx` - Updated logout to be async
- ✅ `.env.example` - Added `VITE_ADMIN_EMAIL`

### New Files
- ✅ `database/SECURE-RLS-WITH-SUPABASE-AUTH.sql` - Proper RLS policies
- ✅ `MIGRATE-TO-SUPABASE-AUTH.md` - This migration guide

### Login Component
- ✅ `src/pages/Login.jsx` - No changes needed! Still password-only UX

## Troubleshooting

### Login not working / "Incorrect password"

**Check:**
1. Did you create the Supabase Auth user in Step 1?
2. Is the password correct? (try resetting it in Supabase Dashboard)
3. Is the user confirmed? (should have ✅ in Supabase Dashboard)
4. Is `VITE_ADMIN_EMAIL` in your `.env` file?
5. Does the email in `.env` match the user you created?

**Fix:**
```bash
# Verify your .env file
cat .env | grep VITE_ADMIN_EMAIL

# Restart dev server
npm run dev
```

### "Admin email not configured" error

**Problem:** `VITE_ADMIN_EMAIL` is missing from `.env`

**Fix:**
1. Add it to `.env`:
   ```env
   VITE_ADMIN_EMAIL=admin@yourportfolio.com
   ```
2. Restart dev server

### Still getting RLS policy errors when editing

**Check:**
1. Did you run `SECURE-RLS-WITH-SUPABASE-AUTH.sql` in Supabase?
2. Did it complete without errors?
3. Are you logged in?

**Verify policies:**
```sql
-- Run in Supabase SQL Editor
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Write operations should show `{authenticated}`, not `{public}`.

### Can't access admin panel after migration

**Problem:** Old localStorage session interfering

**Fix:**
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Delete ALL items
4. Refresh page
5. Log in again with new password

### Session expires too quickly

By default, Supabase Auth sessions last ~7 days. You can configure this:

1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Scroll to **JWT Settings**
3. Adjust **JWT expiry** (default is 604800 seconds = 7 days)

### Need to reset password

**In Supabase Dashboard:**
1. Go to **Authentication** → **Users**
2. Find your admin user
3. Click the `...` menu → **Reset password**
4. Click **Send recovery email** OR **Generate link**
5. Use the link to set a new password

**OR** create a new admin user:
1. Delete the old user
2. Follow Step 1 again with a new password

## Security Improvements

### What you gain:

✅ **Real authentication** - Supabase manages sessions securely
✅ **Database security** - RLS policies enforce authenticated role
✅ **Can't bypass** - Even with anon key, attackers can't edit data
✅ **Session management** - Automatic refresh, expiry, revocation
✅ **Future-proof** - Can add more admin users, roles, permissions

### Attack scenarios now prevented:

❌ **Can't bypass React routing** - Database rejects unauthenticated requests
❌ **Can't use anon key directly** - Must have valid session
❌ **Can't forge sessions** - Signed JWTs, managed by Supabase
❌ **Can't brute force** - Supabase has rate limiting built-in

## Testing Checklist

After migration, test these scenarios:

- [ ] Can log in with new password
- [ ] Can't log in with wrong password
- [ ] Can access /admin after logging in
- [ ] Can't access /admin without logging in
- [ ] Can edit projects, quests, devlogs, contact messages
- [ ] Can delete items from admin panel
- [ ] Can log out successfully
- [ ] Session persists after page refresh
- [ ] Session persists after browser restart
- [ ] Redirected to login when accessing /admin without session
- [ ] Public visitors can still view portfolio (/)
- [ ] Public visitors can still submit contact form
- [ ] No console errors in browser DevTools

## Rollback Plan (If Something Goes Wrong)

If you need to revert to the old system temporarily:

1. **Revert code changes:**
   ```bash
   git checkout HEAD~1 src/utils/auth.js
   git checkout HEAD~1 src/components/ProtectedRoute.jsx
   git checkout HEAD~1 src/layouts/AdminLayout.jsx
   ```

2. **Revert database policies:**
   - Run `database/FIX-ALL-RLS-FOR-CUSTOM-AUTH.sql` in Supabase
   - This sets all policies back to `public`

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Clear localStorage and log in with old password**

## Next Steps

After successful migration:

1. **Update your documentation** - Note the new login process
2. **Save your admin credentials** - Store email and password securely
3. **Remove bcryptjs** - Clean up old dependencies (optional)
4. **Test in production** - Deploy and verify authentication works
5. **Consider MFA** - Supabase supports TOTP for extra security

## Questions or Issues?

If you run into problems:

1. Check browser console for errors (F12)
2. Check Supabase logs: Dashboard → **Logs** → **Auth**
3. Verify environment variables are loaded
4. Try clearing all cookies and localStorage
5. Verify Supabase Auth user exists and is confirmed

## Success! 🎉

Once you've completed all steps and tests pass, you now have:

- ✅ Proper database-level security
- ✅ Clean password-only UX
- ✅ Professional authentication system
- ✅ A portfolio that shows what you can do!

Great work not getting lazy! This is the right way to build. 💪
