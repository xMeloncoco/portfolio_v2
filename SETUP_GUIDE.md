# Portfolio Database Setup Guide

Quick setup guide for the portfolio database schema.

## Prerequisites

1. Supabase project (create one at https://supabase.com)
2. Node.js and npm installed
3. Portfolio v2 project cloned

## Step 1: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in: Supabase Dashboard > Settings > API

## Step 2: Run Database Migrations

Execute these SQL files in order in your Supabase SQL Editor:

1. **Phase 1** - Core admin setup:
```bash
# File: supabase-setup.sql
```

2. **Phase 2** - Pages, quests, inventory:
```bash
# File: supabase-phase2-setup.sql
```

3. **Phase 3** - Projects, issues, connections:
```bash
# File: supabase-phase3-setup.sql
```

## Step 3: Verify Setup

Test the connection:
```javascript
import { supabase } from './config/supabase'

const { data, error } = await supabase
  .from('projects')
  .select('*')
  .limit(1)

console.log(data, error)
```

## Step 4: Create Your First Project

```javascript
import { createProject } from './services'

const { data: project } = await createProject({
  title: 'My First Project',
  description: 'Testing the database setup',
  status: 'active',
  visibility: 'public'
})

console.log('Created project:', project)
```

## Step 5: Attach a Quest

```javascript
import { createQuest } from './services'

const { data: quest } = await createQuest({
  title: 'Initial Quest',
  quest_type: 'main',
  status: 'in_progress',
  project_id: project.id
})

console.log('Created quest:', quest)
```

## File Structure

```
src/
├── config/
│   └── supabase.js         # Supabase client
├── services/
│   ├── projectsService.js  # Project CRUD
│   ├── questsService.js    # Quest CRUD
│   ├── issuesService.js    # Issue tracking
│   ├── pageConnectionsService.js
│   ├── devlogIssuesService.js
│   ├── portfolioQueries.js # Complex queries
│   └── index.js            # Central exports
├── types/
│   └── database.js         # Type definitions
```

## Quick Reference

### Create Project
```javascript
const { data } = await projectsService.createProject({
  title: 'Project Name',
  description: 'Description',
  status: 'active',
  visibility: 'public'
}, [tagIds])
```

### Create Issue (Bug)
```javascript
const { data } = await issuesService.createIssue({
  attached_to_type: 'project',
  attached_to_id: projectId,
  issue_type: 'bug',
  severity: 'major',
  title: 'Bug Title',
  status: 'open'
})
```

### Get Project Dashboard
```javascript
const { data } = await portfolioQueries.getProjectViewData(projectId)
```

### Search Portfolio
```javascript
const { data } = await portfolioQueries.searchPortfolio('keyword')
```

## Next Steps

1. Read `DATABASE_SCHEMA.md` for complete documentation
2. Explore the service files for available methods
3. Check `src/types/database.js` for type definitions
4. Build your admin UI using the services

## Support

- Check JSDoc comments in service files
- Read SQL migration comments
- Review DATABASE_SCHEMA.md for business logic
