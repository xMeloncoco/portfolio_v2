# Portfolio Database Schema Documentation

This document provides comprehensive documentation for the database schema and management system for the portfolio site.

## Overview

The database system tracks:
- **Projects** - Top-level containers for work (like campaigns)
- **Quests** - Tasks and goals (can belong to projects or be independent)
- **Pages** - Content (blogs, devlogs, notes, project pages)
- **Issues** - Bugs and improvements with tracking
- **DevlogIssues** - History of issue work across devlogs

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐
│  Projects   │◄────┤   Quests    │
│             │     │             │
│ parent_id ──┼──┐  │ project_id  │
└─────────────┘  │  │ parent_id ──┼──┐
      ▲          │  └─────────────┘  │
      └──────────┘         ▲         │
                           └─────────┘

┌─────────────┐     ┌─────────────────┐
│    Pages    │◄────┤ PageConnections │
│             │     │                 │
│   (slug)    │     │ connected_to_*  │──► Projects/Quests
└─────────────┘     └─────────────────┘

┌─────────────┐     ┌─────────────────┐
│   Issues    │◄────┤  DevlogIssues   │
│             │     │                 │
│ attached_*  │──►  │   devlog_id   ──┼──► Pages (devlogs)
└─────────────┘     └─────────────────┘
```

### Tables

#### 1. Projects
Top-level project containers with optional parent/child hierarchy.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| parent_id | UUID | Optional parent project (for hierarchy) |
| title | TEXT | Project title |
| description | TEXT | Project description |
| slug | TEXT | URL-friendly identifier (unique) |
| status | ENUM | 'planning', 'active', 'completed', 'on_hold', 'archived' |
| visibility | ENUM | 'public' or 'private' |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

#### 2. Quests
Tasks and goals that can belong to projects or exist independently.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Optional parent project |
| parent_quest_id | UUID | Optional parent quest (for subquests) |
| name | TEXT | Quest title |
| quest_type | ENUM | 'main', 'side', 'future' |
| visibility | ENUM | 'public' or 'private' |
| short_description | TEXT | Brief description |
| long_description | TEXT | Full description |
| status | ENUM | See Quest Status Values below |
| started_date | DATE | When quest started |
| finished_date | DATE | When quest completed |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Quest Status Values:**
- `gathering_info` - "Gathering Resources"
- `creating_plan` - "Crafting Battle Plan"
- `in_progress` - "In Progress"
- `debugging` - "Stuck in Battle"
- `testing` - "Testing Potions"
- `polishing` - "Polishing Artifact"
- `finished` - "Quest Complete!"
- `on_hold` - "Waiting for Mana"
- `dropped` - "Quest Abandoned"
- `future` - "Future Quest"

#### 3. Pages
All content types (blogs, devlogs, notes, project pages).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Page title |
| page_type | ENUM | 'blog', 'devlog', 'notes', 'project' |
| content | TEXT | HTML/Markdown content |
| slug | TEXT | URL-friendly identifier (unique) |
| visibility | ENUM | 'public' or 'private' |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

#### 4. Page Connections (Junction Table)
Polymorphic connections between pages and projects/quests.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| page_id | UUID | Reference to pages.id |
| connected_to_type | ENUM | 'project' or 'quest' |
| connected_to_id | UUID | UUID of project or quest |
| created_at | TIMESTAMP | When connection was made |

**Important:** Devlogs should connect to EITHER a quest OR a project (exclusive).

#### 5. Issues
Bug tracking and improvement requests.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| attached_to_type | ENUM | 'project' or 'quest' |
| attached_to_id | UUID | UUID of project or quest |
| issue_type | ENUM | 'bug' or 'improvement' |
| severity | ENUM | 'critical', 'major', 'minor' (required for bugs) |
| title | TEXT | Issue title |
| description | TEXT | Issue description |
| status | ENUM | See Issue Status Values below |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Issue Status Values (sorted by display priority):**
1. `in_progress` - Currently working on
2. `blocked` - Can't continue
3. `postponed` - Delayed for later
4. `open` - Not started yet
5. `done` - Completed ✓
6. `cancelled` - Won't fix/do ✗

**Note:** `done` and `cancelled` are both considered "complete" statuses.

#### 6. DevlogIssues (Junction Table)
Tracks issue work history across devlogs.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| devlog_id | UUID | Reference to pages.id (devlog) |
| issue_id | UUID | Reference to issues.id |
| status_change | ENUM | Status set in this session (nullable) |
| work_notes | TEXT | Notes about work done |
| created_at | TIMESTAMP | When work was logged |
| updated_at | TIMESTAMP | Last update time |

## Setup Instructions

### 1. Run SQL Migration

Execute the Phase 3 migration in your Supabase SQL Editor:

```sql
-- Run this file in Supabase SQL Editor
-- File: supabase-phase3-setup.sql
```

**Important:** Run this AFTER `supabase-setup.sql` (Phase 1) and `supabase-phase2-setup.sql` (Phase 2).

### 2. Import Services

```javascript
// Import specific services
import { projectsService, issuesService } from './services'

// Or import specific functions
import {
  createProject,
  getProjectViewData,
  searchPortfolio
} from './services'

// Or import types
import {
  ISSUE_STATUS_LABELS,
  PROJECT_STATUS_LABELS
} from './services'
```

### 3. Environment Variables

Ensure your `.env` file has:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Service Layer Architecture

### Service Files

| File | Description |
|------|-------------|
| `projectsService.js` | CRUD operations for projects |
| `questsService.js` | CRUD operations for quests |
| `issuesService.js` | Bug and improvement tracking |
| `pageConnectionsService.js` | Page-to-entity connections |
| `devlogIssuesService.js` | Issue work history in devlogs |
| `portfolioQueries.js` | Complex business logic queries |
| `index.js` | Central export for all services |

### Type Definitions

Located in `src/types/database.js`:

- JSDoc type definitions for all entities
- Status/type enums and constants
- Helper functions (sorting, grouping)
- Display labels and configurations

## Business Logic Implementation

### Cascading Display Rules

#### Project Page View
Shows all related content including cascaded from quests:

```javascript
import { getProjectViewData } from './services'

const { data } = await getProjectViewData(projectId)

// Returns:
{
  project: { /* project details */ },
  quests: [ /* all quests */ ],
  issues: {
    all: [ /* all issues */ ],
    direct: [ /* issues attached to project */ ],
    from_quests: [ /* issues from project's quests */ ]
  },
  pages: {
    devlogs: [ /* devlogs from project + quests */ ],
    blogs: [ /* connected blogs */ ],
    notes: [ /* connected notes */ ],
    project_pages: [ /* project documentation */ ]
  },
  child_projects: [ /* sub-projects */ ],
  statistics: { /* project stats */ }
}
```

#### Quest Page View
Shows quest details, subquests, and related content:

```javascript
import { getQuestViewData } from './services'

const { data } = await getQuestViewData(questId)

// Returns:
{
  quest: { /* quest with progress */ },
  child_quests: [ /* subquests */ ],
  issues: [ /* attached issues */ ],
  pages: {
    devlogs: [ /* quest devlogs */ ],
    blogs: [],
    notes: []
  }
}
```

#### Devlog Page View
Shows issue work history and sections:

```javascript
import { getDevlogViewData } from './services'

const { data } = await getDevlogViewData(devlogId)

// Returns:
{
  devlog: { /* devlog page details */ },
  attached_to: {
    type: 'project' | 'quest',
    id: 'uuid',
    details: { /* project or quest info */ }
  },
  issue_sections: {
    completed_in_devlog: [ /* done/cancelled here */ ],
    in_progress: [ /* currently working on */ ],
    newly_added: [ /* created in this session */ ],
    still_outstanding: [ /* not touched */ ]
  }
}
```

### Issue Management

#### Creating a Bug

```javascript
import { createIssue } from './services'

const { data, error } = await createIssue({
  attached_to_type: 'project',
  attached_to_id: 'project-uuid',
  issue_type: 'bug',
  severity: 'major', // Required for bugs
  title: 'Button not working',
  description: 'Submit button fails on mobile',
  status: 'open'
})
```

#### Creating an Improvement

```javascript
import { createIssue } from './services'

const { data, error } = await createIssue({
  attached_to_type: 'quest',
  attached_to_id: 'quest-uuid',
  issue_type: 'improvement',
  title: 'Add dark mode',
  description: 'User requested feature',
  status: 'open'
  // No severity for improvements
})
```

#### Tracking Issue in Devlog

```javascript
import { linkIssueToDevlog } from './services'

await linkIssueToDevlog(devlogId, issueId, {
  status_change: 'in_progress',
  work_notes: 'Investigated root cause, found memory leak in component lifecycle'
})

// Later, complete the issue
await linkIssueToDevlog(devlogId, anotherIssueId, {
  status_change: 'done',
  work_notes: 'Fixed by adding proper cleanup in useEffect'
})
```

### Search Functionality

```javascript
import { searchPortfolio } from './services'

const { data } = await searchPortfolio('authentication', {
  types: ['projects', 'quests', 'issues'],
  limit: 5
})

// Returns:
{
  projects: [ /* matching projects */ ],
  quests: [ /* matching quests */ ],
  issues: [ /* matching issues */ ]
}
```

### Dashboard Data

```javascript
import { getDashboardData } from './services'

const { data } = await getDashboardData()

// Returns:
{
  counts: {
    projects: 10,
    quests: 25,
    issues: 50,
    active_issues: 12
  },
  recent: {
    projects: [ /* 5 recent */ ],
    quests: [ /* 5 recent */ ]
  },
  active_issues: [ /* 10 active */ ],
  issue_breakdown: {
    by_status: { open: 8, in_progress: 4, ... },
    by_type: { bug: 30, improvement: 20 },
    by_severity: { critical: 2, major: 15, minor: 13 }
  }
}
```

## Severity Guidelines

### Bug Severity Levels

| Level | Description | Examples |
|-------|-------------|----------|
| **Critical** | App is broken, data loss | Crash on load, security vulnerability |
| **Major** | Feature broken, no workaround | Form submission fails, API errors |
| **Minor** | Visual/cosmetic issues | Misaligned text, wrong color |

### Issue Type Guidelines

- **Bugs**: Something that's broken and needs fixing
- **Improvements**: Enhancements to existing functionality
- **Features**: Should be **Future Quests**, NOT issues

## Helper Functions

### Sorting Issues

```javascript
import { sortIssuesByStatus } from './services'

const sortedIssues = sortIssuesByStatus(issues)
// Returns issues sorted by status priority
```

### Grouping Issues

```javascript
import { groupIssuesByCompletion } from './services'

const { active, complete } = groupIssuesByCompletion(issues)
// active: non-complete issues sorted by status
// complete: done/cancelled issues
```

### Status Labels

```javascript
import { ISSUE_STATUS_LABELS, PROJECT_STATUS_LABELS } from './services'

ISSUE_STATUS_LABELS.in_progress // "In Progress"
PROJECT_STATUS_LABELS.active // "Active Quest"
```

## Example Workflows

### Creating a New Project with Quests

```javascript
import {
  createProject,
  createQuest,
  connectPage
} from './services'

// 1. Create project
const { data: project } = await createProject({
  title: 'Portfolio Website v3',
  description: 'Complete rewrite with new features',
  status: 'planning',
  visibility: 'public'
}, ['tag-uuid-1', 'tag-uuid-2'])

// 2. Create main quest
const { data: mainQuest } = await createQuest({
  title: 'Design System Implementation',
  quest_type: 'main',
  status: 'gathering_info',
  project_id: project.id
}, ['react-tag-uuid'])

// 3. Connect existing devlog
await connectPage(devlogPageId, 'quest', mainQuest.id)
```

### Logging Work in a Devlog Session

```javascript
import {
  createIssue,
  linkIssueToDevlog,
  updateIssueStatus
} from './services'

// During devlog session...

// 1. Found a new bug
const { data: newBug } = await createIssue({
  attached_to_type: 'quest',
  attached_to_id: questId,
  issue_type: 'bug',
  severity: 'minor',
  title: 'Icon misaligned on mobile',
  status: 'open'
})

// 2. Link to devlog with notes
await linkIssueToDevlog(devlogId, newBug.id, {
  status_change: 'open',
  work_notes: 'Discovered while testing responsive layout'
})

// 3. Work on existing issue
await linkIssueToDevlog(devlogId, existingIssueId, {
  status_change: 'in_progress',
  work_notes: 'Started implementing the fix, need to test edge cases'
})

// 4. Complete another issue
await linkIssueToDevlog(devlogId, completedIssueId, {
  status_change: 'done',
  work_notes: 'Fixed by updating the component logic, tested thoroughly'
})
await updateIssueStatus(completedIssueId, 'done')
```

## Migration from Existing System

If you have existing data in the Phase 2 tables, you may need to:

1. **Migrate page_quests to page_connections:**
```sql
INSERT INTO page_connections (page_id, connected_to_type, connected_to_id)
SELECT page_id, 'quest', quest_id FROM page_quests;
```

2. **Create projects from existing quests:**
```sql
-- Identify main quests that should become projects
INSERT INTO projects (title, description, slug, status)
SELECT name, long_description, LOWER(REPLACE(name, ' ', '-')),
       CASE status WHEN 'finished' THEN 'completed' ELSE 'active' END
FROM quests WHERE quest_type = 'main' AND parent_quest_id IS NULL;
```

3. **Update quests with project references:**
```sql
-- Link quests to newly created projects
UPDATE quests q SET project_id = p.id
FROM projects p WHERE p.title = q.name;
```

## Performance Considerations

### Indexes Created

The migration creates indexes for:
- `projects(slug)` - Fast slug lookups
- `quests(project_id)` - Fast project quest queries
- `quests(parent_quest_id)` - Fast subquest queries
- `issues(attached_to_type, attached_to_id)` - Fast issue lookups
- `issues(status)` - Fast status filtering
- `page_connections(page_id)` - Fast connection lookups
- `devlog_issues(devlog_id)` - Fast devlog issue queries

### Query Optimization Tips

1. Use the provided view functions instead of raw queries
2. Enable cascading only when needed (`includeCascaded: false`)
3. Filter by status/type when possible to reduce data
4. Use pagination for large result sets

## Future Enhancements

- Real-time subscriptions for issue updates
- Batch operations for bulk imports
- Advanced filtering and sorting options
- Data export/backup functionality
- Analytics and reporting dashboard
- Integration with external issue trackers

## Troubleshooting

### Common Issues

1. **"Bug requires severity" error**
   - Ensure you provide severity when issue_type is 'bug'

2. **"Connection already exists" warning**
   - Page is already connected to that project/quest

3. **Missing cascaded data**
   - Check if project_id is set on quests
   - Verify page_connections exist

4. **Slug conflicts**
   - Slugs auto-increment if duplicate found
   - Manually set unique slugs when needed

## Support

For issues or questions:
- Check the services' JSDoc comments
- Review SQL migration comments
- Examine the type definitions in `src/types/database.js`
