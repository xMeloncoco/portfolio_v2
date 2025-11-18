# 🏰 Portfolio V2 - Phase 1 Setup Instructions

## 📋 What We Built

Phase 1 is now complete! Here's what's been implemented:

### ✅ Completed Features

1. **Login System** - Secure password-only authentication
2. **Admin Navigation** - Sidebar menu with all sections
3. **Icon Component** - Custom icon system with 70+ icons
4. **Protected Routes** - Secure admin pages
5. **Responsive Design** - Works on desktop, tablet, and mobile
6. **Logout Functionality** - Proper session management
7. **Placeholder Pages** - All navigation items have pages ready

---

## 🚀 Getting Started

### Step 1: Set Up Supabase Database

You need to run the SQL setup in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-setup.sql` (in the project root)
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute

**What this does:**
- Creates the `admin_config` table
- Sets up Row Level Security (RLS) policies
- Adds a default admin password

---

### Step 2: Set Up Supabase Storage

You need to create the storage bucket for profile pictures:

1. Still in your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/supabase-storage-setup.sql`
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute

**What this does:**
- Creates the `profile-pictures` storage bucket
- Sets up storage policies for public read access
- Allows authenticated users to upload/update/delete images
- Configures 5MB file size limit and allowed image types

**Verify it worked:**
- Go to **Storage** in your Supabase dashboard
- You should see a bucket named `profile-pictures`

---

### Step 3: Fix RLS Policies for Character Settings

After creating the storage bucket, you need to fix the Row Level Security policies:

1. Still in your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/fix-character-settings-rls.sql`
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute

**What this does:**
- Removes the overly restrictive update policy on character_settings
- Allows updates to character settings (needed to save profile picture URLs)
- Security is still maintained through your password-protected admin panel

**Why this is needed:**
Without this fix, you'll get "Cannot coerce the result to a single JSON object" error when trying to save profile pictures or update any character settings.

---

### Step 4: Set Up Environment Variables

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these:**
- Go to your Supabase project dashboard
- Navigate to **Settings** → **API**
- Copy the **Project URL** and **anon public** key

---

### Step 5: Install Dependencies

Run this command in the project root:

```bash
npm install
```

---

### Step 6: Start the Development Server

```bash
npm run dev
```

The app will start at `http://localhost:5173` (or another port if 5173 is busy)

---

## 🔐 Default Login Credentials

**Default Password:** `admin123`

⚠️ **IMPORTANT:** This is a placeholder password. You should change it immediately!

### How to Change the Admin Password

1. Go to [bcrypt hash generator](https://bcrypt-generator.com/)
2. Enter your new password
3. Set **Rounds** to 10
4. Click **Generate Hash**
5. Copy the generated hash
6. Go to Supabase → **Table Editor** → **admin_config**
7. Edit the `password_hash` field and paste your new hash
8. Save

---

## 🧪 Testing Phase 1

### Test Checklist

1. **Login Page:**
   - [ ] Visit `http://localhost:5173/admin/login`
   - [ ] Enter password: `admin123`
   - [ ] Click "Enter"
   - [ ] Should redirect to admin dashboard

2. **Navigation:**
   - [ ] Click each menu item in the sidebar
   - [ ] Verify all pages load correctly
   - [ ] Check that the active page is highlighted

3. **Logout:**
   - [ ] Click the "Logout" button at the bottom of sidebar
   - [ ] Should redirect to login page
   - [ ] Try accessing `/admin` without logging in
   - [ ] Should redirect back to login

4. **Mobile Responsiveness:**
   - [ ] Resize browser to mobile size
   - [ ] Click hamburger menu icon
   - [ ] Sidebar should slide in from left
   - [ ] Click links to navigate
   - [ ] Sidebar should close after clicking

5. **Icons:**
   - [ ] Check that all icons display correctly
   - [ ] Verify no broken images

---

## 📁 Project Structure

Here's what was created in Phase 1:

```
portfolio_v2/
├── src/
│   ├── components/
│   │   ├── Icon.jsx              # Custom icon component
│   │   ├── Icon.css              # Icon styles
│   │   └── ProtectedRoute.jsx    # Route protection
│   │
│   ├── layouts/
│   │   ├── AdminLayout.jsx       # Admin layout with sidebar
│   │   └── AdminLayout.css       # Layout styles
│   │
│   ├── pages/
│   │   ├── Login.jsx             # Login page
│   │   ├── Login.css             # Login styles
│   │   ├── AdminDashboard.jsx    # Dashboard/overview
│   │   ├── CharacterStats.jsx    # Character stats (placeholder)
│   │   ├── Pages.jsx             # Pages management (placeholder)
│   │   ├── Quests.jsx            # Quests management (placeholder)
│   │   ├── Inventory.jsx         # Inventory (placeholder)
│   │   ├── Skills.jsx            # Skills (placeholder)
│   │   ├── ThemeSettings.jsx     # Theme settings (placeholder)
│   │   └── PlaceholderPage.css   # Shared placeholder styles
│   │
│   ├── utils/
│   │   ├── auth.js               # Authentication logic
│   │   └── logger.js             # Logging utility
│   │
│   ├── config/
│   │   └── supabase.js           # Supabase client
│   │
│   ├── styles/
│   │   ├── theme-base.css        # Base theme structure
│   │   └── themes/
│   │       ├── theme-mystic-blue-gold.css  # Active theme
│   │       └── theme-dark-leather.css       # Alternative theme
│   │
│   ├── assets/
│   │   └── icons/
│   │       └── set1/              # 70+ custom icons
│   │
│   ├── App.jsx                    # Main app with routing
│   ├── App.css                    # App styles
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles
│
├── supabase-setup.sql             # Database setup SQL
├── SETUP_INSTRUCTIONS.md          # This file
├── package.json                   # Dependencies
└── vite.config.js                 # Vite configuration
```

---

## 🎨 Theme System

### How Themes Work

The theme system is modular and easy to change:

1. **Base Template** (`theme-base.css`):
   - Defines the CSS variable structure
   - Global styles and utilities
   - DO NOT modify unless adding new variables

2. **Theme Files** (`themes/theme-*.css`):
   - Sets actual color values
   - Each theme is a separate file

3. **Active Theme** (`main.jsx`):
   - Line 9: `import './styles/themes/theme-mystic-blue-gold.css'`
   - Change this line to switch themes

### Available Themes

- **Mystic Blue & Gold** (Active) - Fantasy RPG style
- **Dark Leather** - Alternative dark theme

### Creating a New Theme

1. Copy `theme-mystic-blue-gold.css`
2. Rename to `theme-your-name.css`
3. Change the color values
4. Update the import in `main.jsx`

---

## 🐛 Debugging

### Console Logs

The app logs everything to the browser console:

1. Press **F12** to open Developer Tools
2. Click the **Console** tab
3. You'll see logs for:
   - Authentication attempts
   - Route navigation
   - Component rendering
   - Errors and warnings

### Common Issues

**Issue: Login doesn't work**
- Check console for errors
- Verify Supabase credentials in `.env`
- Verify `admin_config` table exists in Supabase
- Check that you're using the correct password

**Issue: Icons not showing**
- Check that `/src/assets/icons/set1/` folder has PNG files
- Check browser console for 404 errors
- Verify the icon name matches the filename (without .png)

**Issue: "Missing Supabase environment variables"**
- Make sure `.env` file exists in project root
- Check that variable names start with `VITE_`
- Restart the dev server after creating `.env`

**Issue: Page is blank**
- Check browser console for JavaScript errors
- Verify all npm packages installed correctly
- Try deleting `node_modules` and running `npm install` again

---

## 📦 Dependencies Installed

Phase 1 uses these packages:

- **react** & **react-dom** - React framework
- **react-router-dom** - Routing and navigation
- **@supabase/supabase-js** - Supabase client
- **bcryptjs** - Password hashing
- **react-hook-form** - Form handling (ready for Phase 2)
- **vite** - Build tool and dev server

---

## ✨ What's Next?

Phase 1 is complete! The foundation is ready for Phase 2.

**Phase 2 Preview:**
- Tag Manager component
- Pages database and CRUD operations
- Pages list view with sorting
- Devlog to-do list features
- Create/edit/delete pages functionality

---

## 🎯 Tips for Development

1. **Use console logs liberally** - The logger utility helps track everything
2. **Check the browser console** - Most issues show up there first
3. **Test on mobile** - Resize your browser to mobile size
4. **Keep Supabase dashboard open** - Monitor database changes in real-time
5. **Read the comments** - Every file has detailed comments explaining the code

---

## 📞 Need Help?

If you encounter issues:

1. Check the browser console first
2. Verify your `.env` file is correct
3. Make sure Supabase setup SQL was run successfully
4. Check that `npm install` completed without errors

---

## 🎉 Phase 1 Complete!

Everything is ready for you to start building Phase 2 features. The login system works, navigation is set up, and all routes are protected. Great foundation!

**Happy coding!** 🚀
