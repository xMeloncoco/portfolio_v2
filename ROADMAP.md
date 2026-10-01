# Portfolio V2 – Roadmap

_Last updated: 2026-10-01_

## Direction

- **Quests** are the active projects (work in progress). There are no to-do lists anymore.
- **Projects** are only for finished work. Each one has a status: active/inactive, plus draft/concept.
- **Blog & Notes** is being removed.
- **Themes** are dropped. Any styling changes get hardcoded.

## Done

- Phase 1: Login, protected admin routes, navigation
- Phase 3: Projects & Quests
- Phase 4: Inventory & Achievements
- Phase 8: Character Stats
- Extras: Contact form + Inbox, Supabase Auth, construction mode

## To do

### 1. Remove Blog & Notes
- Delete `/blog`, `/page/:id` and the `/admin/pages/*` routes, plus their pages (`Blog`, `PageDetail`, `Pages`, `PageForm`, `PageView`).
- Remove `pagesService`, `pageConnectionsService`, and any page queries in `portfolioQueries`.
- Remove the Blog & Notes entries from the admin and public navigation.
- Add a DB migration that drops `pages`, `page_connections` and the related tags and RLS (back up data first).

### 2. Simplify Quests (Quests = projects in progress)
- Remove the to-do and sub-quest features from Quests.
- Remove the link between Quests and Projects (`project_id`), or decide to keep it as "this quest became this project".
- Clean up the quest forms, views and service so they match.

### 3. Rework Projects (finished work only)
- Add an `is_active` field (active/inactive).
- Add a `status` field (`draft` / `concept` / `published`).
- Show only active, published projects on public pages.
- **Open decision:** manage projects through the admin panel with templates, or hardcode them.

### 4. Remove the theme system remnants
- Remove the leftover theme mentions (`src/styles/themes`, dashboard "Theme" item).
- Merge the theme variables into one hardcoded stylesheet.

### 5. Fix pixelated icons
- Cause: the icons are 64×64 PNGs, but the code shows them at sizes like 14, 18, 20, 24, 28 and 36 px. Those don't divide 64 evenly, so with `crisp-edges` the pixels get uneven. Sizes 80 and 100 px upscale the images, which makes them blurry.
- Fix: show the icons only at 16, 32, 64 or 128 px and use `image-rendering: pixelated`, or swap in higher-resolution PNGs or SVG icons.
- Mainly affects the admin side (sidebar, buttons, lists).

### 6. Email
- Send an email notification when a new contact message arrives (Supabase Edge Function + Resend/SendGrid).
- Optional: confirmation email to the visitor, reply from the inbox, spam protection (captcha, rate limiting).

### 7. Skill tree
- Design the data model: skills, categories, levels, and which skills unlock others.
- Build an admin page to manage skills (replaces the `Skills.jsx` placeholder).
- Build a public, visual skill tree page.

### 8. Housekeeping
- Update the admin dashboard text: remove the "Phase 1 complete" and "coming in phase X" lines.
- Replace the default Vite `README.md` with real project docs.
- Merge or delete the old setup and fix `.md` and `.sql` files.
- Remove `bcryptjs` and `generate-password-hash.js`, which aren't needed since moving to Supabase Auth.
