# Contact Form Database Setup Guide

## ⚠️ IMPORTANT: Fix the "Could not find table" Error

If you're seeing this error:
```
Could not find the table 'public.contact_messages' in the schema cache
```

This means **the database table doesn't exist yet**. You need to run the migration first!

---

## 📋 Step-by-Step Setup

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com
2. Sign in to your account
3. Select your portfolio project

### Step 2: Open SQL Editor

1. In the left sidebar, click on **"SQL Editor"**
2. You should see an empty editor where you can write SQL

### Step 3: Run the Migration

1. Open the file: `database/supabase-contact-messages.sql` on your computer
2. **Copy ALL the contents** of that file (Ctrl+A, Ctrl+C)
3. **Paste it** into the Supabase SQL Editor (Ctrl+V)
4. Click the **"Run"** button (or press Ctrl+Enter)

### Step 4: Verify Success

You should see a success message like:
```
✅ Contact messages table created successfully!
📧 Contact form can now save messages to the database
📥 Admin inbox can view and manage messages
```

If you see any errors, check:
- Did you copy the ENTIRE file?
- Are you in the correct project?
- Do you have the necessary permissions?

### Step 5: Test the Contact Form

1. Go to your portfolio website
2. Click the "Contact Me" button
3. Fill out the form
4. Click "Send Message"
5. You should see a success notification!

### Step 6: Check the Inbox

1. Log in to your admin panel (`/admin/login`)
2. Click "Inbox" in the sidebar
3. You should see your test message!

---

## 🗑️ Managing Messages from Database

### Option 1: Use the Admin Inbox (Recommended)

The easiest way to manage messages is through the admin inbox at `/admin/inbox`:
- View all messages
- Filter by status or category
- Mark as read/replied
- Delete individual messages

### Option 2: Use Supabase Dashboard

1. Go to Supabase Dashboard
2. Click "Table Editor" in the left sidebar
3. Find the `contact_messages` table
4. You can view, edit, or delete messages directly

### Option 3: Use SQL Queries

For bulk operations, use the SQL helper file:

1. Open `database/contact-messages-operations.sql`
2. Find the operation you want (e.g., "DELETE SPECIFIC MESSAGE")
3. Copy the SQL query
4. Paste it into Supabase SQL Editor
5. Replace the placeholder values (like `MESSAGE_ID_HERE`)
6. Run the query

#### Common Operations:

**Delete a specific message:**
```sql
DELETE FROM contact_messages
WHERE id = 'paste-message-id-here';
```

**Delete all test messages:**
```sql
DELETE FROM contact_messages
WHERE email LIKE '%test%@%';
```

**Delete all messages (careful!):**
```sql
DELETE FROM contact_messages;
```

**View all messages:**
```sql
SELECT * FROM contact_messages
ORDER BY created_at DESC;
```

---

## 🔍 Troubleshooting

### Error: "Could not find table"
**Solution:** Run the migration (Step 3 above)

### Error: "permission denied"
**Solution:** Make sure you're logged in as the project owner in Supabase

### Error: "relation already exists"
**Solution:** The table already exists! You don't need to run the migration again.

### Messages not showing in inbox
**Solution:**
1. Check if you're logged in as admin
2. Verify the message was actually created (check Supabase Table Editor)
3. Try refreshing the inbox page

### Can't delete messages
**Solution:**
1. Make sure you're logged in as admin
2. Check the browser console for errors
3. Verify RLS policies are set up correctly (they should be if you ran the migration)

---

## 📊 Understanding the Table Structure

The `contact_messages` table has these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier for each message |
| `email` | TEXT | Sender's email address |
| `name` | TEXT | Sender's name |
| `category` | TEXT | Message category (new_quest, invite_to_party, etc.) |
| `subject` | TEXT | Message subject line |
| `message` | TEXT | Full message content |
| `status` | TEXT | unread, read, or replied |
| `created_at` | TIMESTAMPTZ | When the message was sent |
| `updated_at` | TIMESTAMPTZ | When the message was last modified |

---

## 🔒 Security (Row Level Security)

The migration automatically sets up these security rules:

- **Anonymous users** (visitors) can only **INSERT** (send messages)
- **Authenticated users** (you, when logged in as admin) can:
  - **SELECT** (view all messages)
  - **UPDATE** (change message status)
  - **DELETE** (remove messages)

This means visitors can't see other people's messages, but you can manage everything when logged in!

---

## 💡 Tips

1. **Regular Cleanup**: Delete old or spam messages regularly to keep your inbox clean
2. **Export Data**: Before deleting many messages, consider exporting them first (use SQL query)
3. **Backup**: Supabase has automatic backups, but you can also export important messages manually
4. **Test First**: When using bulk delete operations, test with a small subset first
5. **Check Email**: Look for patterns in spam to block certain domains if needed

---

## 📝 Next Steps

Once the database is set up and working:

1. ✅ Test the contact form thoroughly
2. ✅ Set up email notifications (optional, future enhancement)
3. ✅ Monitor for spam and adjust categories if needed
4. ✅ Regularly check and respond to messages

---

**Need Help?**

If you're still having issues:
1. Check the browser console for detailed error messages
2. Verify you're on the correct Supabase project
3. Make sure you copied the entire SQL migration file
4. Check that you have admin access to the project

The contact form is fully functional once the database is set up! 🎉
