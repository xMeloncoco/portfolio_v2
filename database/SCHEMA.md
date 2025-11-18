# Portfolio V2 - Database Schema Reference

**Last Updated:** 2025-11-18
**Database:** Supabase PostgreSQL

---

## Tables Overview

| Table | Purpose | Rows Expected |
|-------|---------|---------------|
| `admin_config` | Admin authentication | 1 (single admin) |
| `character_settings` | Editable character profile data | 1 (single character) |
| `pages` | Main content (projects, notes, etc.) | Many |
| `projects` | Hierarchical project structure | Many |
| `quests` | Main/side quests (tasks/goals) | Many |
| `sub_quests` | Steps within quests | Many |
| `inventory_items` | Portfolio items (achievements, tools) | Many |
| `tags` | Reusable tags for categorization | Many |
| `issues` | Bugs/todos attached to pages/quests | Many |
| `devlog_items` | Development log entries per page | Many |
| `devlog_issues` | Links devlog entries to issues | Many |
| `page_tags` | Links pages to tags | Many |
| `page_quests` | Links pages to quests | Many |
| `quest_tags` | Links quests to tags | Many |
| `inventory_item_tags` | Links inventory items to tags | Many |

---

## Core Tables

### `admin_config`
Admin authentication (single row).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| password_hash | text | NO | - |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

### `character_settings`
Character profile displayed on front page (single row, editable via admin).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| profile_picture_url | text | YES | - |
| display_name | text | NO | 'Miriam Schouten' |
| subtitle | text | YES | 'Software Tester / Vibe Coder' |
| description | text | YES | - |
| class | text | YES | 'Software Tester / Vibe Coder' |
| location | text | YES | 'Ermelo, Netherlands' |
| current_quest | text | YES | 'Finding my IT spark' |
| birthday | date | YES | '1995-03-14' |
| linkedin_url | text | YES | 'https://linkedin.com/in/yourprofile' |
| languages | jsonb | YES | [] |
| frameworks | jsonb | YES | [] |
| tools | jsonb | YES | [] |
| action_buttons | jsonb | YES | [] |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**JSONB Structures:**
- `languages`: `["JavaScript", "Python", ...]`
- `frameworks`: `["React", "Node.js", ...]`
- `tools`: `["Git", "Postman", ...]`
- `action_buttons`: `[{"label": "...", "url": "...", "icon": "..."}, ...]`

### `pages`
Main content pages (projects, notes, blog posts).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| title | text | NO | - |
| page_type | text | NO | 'notes' |
| content | text | YES | - |
| visibility | text | NO | 'private' |
| project_status | text | YES | - |
| project_start_date | date | YES | - |
| project_end_date | date | YES | - |
| external_link | text | YES | - |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**Values:**
- `page_type`: 'notes', 'project', 'blog', etc.
- `visibility`: 'public', 'private'
- `project_status`: 'planning', 'in_progress', 'completed', etc.

### `projects`
Hierarchical project structure (alternative to pages).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| parent_id | uuid | YES | - |
| title | text | NO | - |
| slug | text | YES | - |
| description | text | YES | - |
| status | text | YES | 'planning' |
| visibility | text | YES | 'private' |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**Foreign Keys:**
- `parent_id` → `projects.id` (self-referencing for hierarchy)

### `quests`
RPG-style tasks/goals.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| title | text | NO | - |
| quest_type | text | YES | 'side' |
| status | text | YES | 'not_started' |
| description | text | YES | - |
| visibility | text | YES | 'public' |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**Values:**
- `quest_type`: 'main', 'side', 'future'
- `status`: 'not_started', 'in_progress', 'debugging', 'on_hold', 'completed', 'abandoned'

### `sub_quests`
Steps/tasks within a quest.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| quest_id | uuid | NO | - |
| title | text | NO | - |
| is_completed | boolean | YES | false |
| sort_order | integer | YES | 0 |
| created_at | timestamptz | YES | now() |

**Foreign Keys:**
- `quest_id` → `quests.id`

### `inventory_items`
Portfolio items (achievements, certifications, tools).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| item_name | text | NO | - |
| title | text | NO | - |
| item_type | text | YES | 'inventory' |
| visibility | text | YES | 'public' |
| icon_name | text | YES | 'treasure-chest' |
| popup_content | text | YES | - |
| sort_order | integer | YES | 0 |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**Values:**
- `item_type`: 'inventory', 'achievement', etc.
- `visibility`: 'public', 'private'

### `tags`
Reusable tags for categorization.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | - |

### `issues`
Bugs and todos attached to pages/quests.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| attached_to_type | text | NO | - |
| attached_to_id | uuid | NO | - |
| issue_type | text | NO | - |
| severity | text | YES | - |
| title | text | NO | - |
| description | text | YES | - |
| status | text | NO | 'open' |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**Values:**
- `attached_to_type`: 'page', 'quest', etc.
- `issue_type`: 'bug', 'todo', 'enhancement', etc.
- `severity`: 'low', 'medium', 'high', 'critical'
- `status`: 'open', 'in_progress', 'resolved', 'closed'

### `devlog_items`
Development log entries for pages.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| page_id | uuid | NO | - |
| title | text | NO | - |
| status | text | NO | 'todo' |
| sort_order | integer | NO | 0 |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**Foreign Keys:**
- `page_id` → `pages.id`

### `devlog_issues`
Links devlog entries to issues.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| devlog_id | uuid | NO | - |
| issue_id | uuid | NO | - |
| status_change | text | YES | - |
| work_notes | text | YES | - |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**Foreign Keys:**
- `devlog_id` → `pages.id`
- `issue_id` → `issues.id`

---

## Junction Tables (Many-to-Many)

### `page_tags`
Links pages to tags.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| page_id | uuid | NO | - |
| tag_id | uuid | NO | - |
| created_at | timestamptz | YES | now() |

**Foreign Keys:**
- `page_id` → `pages.id`
- `tag_id` → `tags.id`

### `page_quests`
Links pages to quests.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| page_id | uuid | NO | - |
| quest_id | uuid | NO | - |

**Foreign Keys:**
- `page_id` → `pages.id`
- `quest_id` → `quests.id`

### `quest_tags`
Links quests to tags.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| quest_id | uuid | NO | - |
| tag_id | uuid | NO | - |

**Foreign Keys:**
- `quest_id` → `quests.id`
- `tag_id` → `tags.id`

### `inventory_item_tags`
Links inventory items to tags.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| item_id | uuid | NO | - |
| tag_id | uuid | NO | - |

**Foreign Keys:**
- `item_id` → `inventory_items.id`
- `tag_id` → `tags.id`

---

## Relationships Diagram

```
┌─────────────────┐
│ admin_config    │ (standalone, no relations)
└─────────────────┘

┌─────────────────┐
│ character_      │ (standalone, no relations)
│ settings        │
└─────────────────┘

┌─────────────────┐      ┌──────────────┐
│ pages           │◄─────┤ devlog_items │
└────────┬────────┘      └──────────────┘
         │
         │               ┌──────────────┐
         ├──────────────►│ page_tags    │◄────┐
         │               └──────────────┘     │
         │                                    │
         │               ┌──────────────┐     │    ┌──────┐
         ├──────────────►│ page_quests  │◄────┼────┤ tags │
         │               └──────────────┘     │    └───┬──┘
         │                                    │        │
         │               ┌──────────────┐     │        │
         └──────────────►│ devlog_      │     │        │
                         │ issues       │     │        │
                         └──────┬───────┘     │        │
                                │             │        │
                         ┌──────▼───────┐     │        │
                         │ issues       │     │        │
                         └──────────────┘     │        │
                                              │        │
┌─────────────────┐      ┌──────────────┐     │        │
│ quests          │◄─────┤ sub_quests   │     │        │
└────────┬────────┘      └──────────────┘     │        │
         │                                    │        │
         │               ┌──────────────┐     │        │
         └──────────────►│ quest_tags   │◄────┘        │
                         └──────────────┘              │
                                                       │
┌─────────────────┐      ┌──────────────┐              │
│ inventory_items │      │ inventory_   │              │
└────────┬────────┘      │ item_tags    │◄─────────────┘
         │               └──────────────┘
         └──────────────►

┌─────────────────┐
│ projects        │ (self-referencing via parent_id)
└────────┬────────┘
         │
         └──────────────► projects (hierarchy)
```

---

## Triggers & Functions

### Auto-Update Timestamps

**Function:** `update_updated_at_column()`
- Updates `updated_at` to current timestamp on row modification
- Applied to most tables via triggers

**Function:** `update_character_settings_updated_at()`
- Specific version for `character_settings` table
- Updates `updated_at` to current timestamp

---

## Notes

1. **UUIDs everywhere** - All primary keys use `gen_random_uuid()`
2. **Timestamps** - Most tables have `created_at` and `updated_at`
3. **Visibility control** - Many tables have `visibility` field ('public'/'private')
4. **Soft relationships** - `issues` uses polymorphic pattern (`attached_to_type` + `attached_to_id`)
5. **Hierarchical data** - `projects` supports parent-child via self-referencing `parent_id`
6. **Sort order** - Many tables include `sort_order` for custom ordering
7. **JSONB usage** - `character_settings` uses JSONB for flexible array storage

---

## Services That Use This Schema

| Service | Tables Used |
|---------|-------------|
| `pagesService.js` | pages, page_tags, page_quests |
| `questsService.js` | quests, sub_quests, quest_tags |
| `inventoryService.js` | inventory_items, inventory_item_tags |
| `characterStatsService.js` | quests, sub_quests, pages (for calculations) |
| `characterSettingsService.js` | character_settings |
| `tagsService.js` | tags (and all junction tables) |

---

## To Recreate This Database

If you need to rebuild from scratch:

1. Run the migration files in order:
   - `supabase-setup.sql` (base)
   - `supabase-phase2-setup.sql` (pages/projects)
   - `supabase-phase3-setup.sql` (quests)
   - `supabase-phase4-devlog-subquests.sql` (devlogs & sub-quests)
   - `supabase-phase8-character-settings.sql` (character settings)

2. Or use this reference to manually create tables as needed

---

**Generated from live database on 2025-11-18**
