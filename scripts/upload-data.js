import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// CSV data
const csvData = `Title/name,Type,Description,Status,linked to,public/private,tags,Issue level
Portfolio website MVP,Main quest,,Work in progress,Project: Portfolio Website,Public,,N/A
Portfolio website polish,future quest,,open,Project: Portfolio Website,Public,,N/A
Portfolio website expanded,future quest,,open,Project: Portfolio Website,Public,,N/A
hidden feature portfolio website,future quest,,open,Project: Portfolio Website,Public,,N/A
Portfolio Website,Project,,work in progress,n/a,Public,,N/A
Creating Issues system,sub quest,,Not checked,Quest: Portfolio website mvp,n/a,n/a,N/A
improving devlog pages,sub quest,,Not checked,Quest: Portfolio website mvp,n/a,n/a,N/A
improving quest pages,sub quest,,Not checked,Quest: Portfolio website mvp,n/a,n/a,N/A
improving front page character stats,sub quest,,Not checked,Quest: Portfolio website mvp,n/a,n/a,N/A
Improving project pages,sub quest,,Not checked,Quest: Portfolio website mvp,n/a,n/a,N/A
Adding test data,sub quest,,Not checked,Quest: Portfolio website mvp,n/a,n/a,N/A
[B] Icons at adding tags,Issues,,Open,Quest: Portfolio website mvp,Public,,Minor
[B] Removing tags ability,Issues,,Open,Quest: Portfolio website mvp,Public,,Major
[B] Putting Tags underneath input bar,Improvements,,Open,Project: Portfolio Website,Public,,N/A
[B] Showing available tags on typing,Improvements,,Open,Project: Portfolio Website,Public,,N/A
[B] add option to choose own color at tags,Improvements,,Open,Project: Portfolio Website,Public,,N/A
[B] moving items up or down a list,Issues,,Open,Quest: Portfolio website mvp,Public,,Major
[B] Pages edit and delete button not outlined correctly,Issues,,Open,Quest: Portfolio website mvp,Public,,Minor
[B] when pressing on the category of a page, also direct to that page.,Improvements,,Open,Project: Portfolio Website,Public,,N/A
[B] option to add icons to inventory,Improvements,,Open,Project: Portfolio Website,Public,,N/A
[B]â€œDrag items to reorder how they appear on the frontendâ€ is too dark,Issues,,Open,Quest: Portfolio website mvp,Public,,Minor
[F] Revamp progress bar quests,Improvements, have progress bar of quests take into considerations issues as well as sub,Open,Project: Portfolio Website,Public,,N/A
Pixelart,future quest,,Open,,Private,art,N/A
Tents and trees application,future quest,,Open,,Public,game,N/A
Boardgame simulator application,future quest,,Open,,Public,game,N/A
tamagotchi make app,future quest,,Open,Project: personal tamagochi,Public,game,N/A
Personal Tamagotchi,Project,,open,n/a,private,game,N/A
Project Floor,Project,A project together with my sister to create a system to improve healthcare administration processes.,open,n/a,private,automation,N/A
[b] meetings/events on portfolio,future quest,,open,Project: Portfolio,private,,N/A
Tower defense resource management game,future quest,,open,,private,game,N/A
core world game,future quest,,open,,private,game,N/A
Gather lore etc.,sub quest,,open,Quest: core world game,private,n/a,N/A
AI Storyteller Application,Project,,in progress,n/a,public,"AI, chat, storytelling",N/A
AI Storyteller Application version 1,Main quest,,in progress,Project: AI storyteller Application,public,"AI, chat, storytelling",N/A
Ensure logging shows a lot of information,sub quest,,not checked,Quest: AI storyteller applicaton version 1,public,n/a,N/A
Work out character page/dynamics,sub quest,,not checked,Quest: AI storyteller applicaton version 1,public,n/a,N/A
Make notes on different versions,sub quest,,not checked,Quest: AI storyteller applicaton version 1,public,n/a,N/A
[b] linked quests is shown as checklist,Issues,,not checked,Quest: Portfolio website mvp,public,,Major
Story template needs start location,Issues,,not checked,Quest: AI storyteller applicaton version 1,public,,Major
Incorrectly shows characters not currently in scene,Issues,,not checked,Quest: AI storyteller applicaton version 1,public,,Critical
Degraded status,Issues,"Degraded shows on the top of the application, but it does not show why. make it clickable and show why",not checked,Quest: AI storyteller applicaton version 1,public,,Minor
New playthrough, then back issue,Issues,"When you made a new playthrough, when you press back to see all the playthroughs of that story, its not listed yet. you have to go back once more, then go to the playthroughs to see it listed",not checked,Quest: AI storyteller applicaton version 1,public,,Minor
Past messages are not shown,Issues,Make sure it shows past messages. Need to think of a limit. ,not checked,Quest: AI storyteller applicaton version 1,public,,Critical
Error in system info,Issues,Database: error: Textual SQL expression 'SELECT 1' should be explicitly declared as text('SELECT 1'),not checked,Quest: AI storyteller applicaton version 1,public,,Critical
It is not replying to user,Issues, no ai in place??,not checked,Quest: AI storyteller applicaton version 1,public,,Critical
A way to see the database information from a playthrough or story,sub quest,,open,Quest: AI storyteller applicaton version 1,public,,`;

// Parse CSV
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Normalize status
function normalizeStatus(status, type) {
  const statusLower = status.toLowerCase().trim();

  if (type === 'Project') {
    // Map to project statuses
    if (statusLower.includes('progress')) return 'in_progress';
    if (statusLower === 'open') return 'active';
    return 'planning';
  }

  if (type.includes('quest')) {
    // Map to quest statuses
    if (statusLower.includes('progress')) return 'in_progress';
    if (statusLower === 'open') return 'not_started';
    if (statusLower === 'not checked') return 'not_started';
    return 'not_started';
  }

  // For issues
  if (statusLower.includes('progress')) return 'in_progress';
  if (statusLower === 'not checked') return 'open';
  return 'open';
}

// Normalize quest type
function normalizeQuestType(type) {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('main')) return 'main';
  if (typeLower.includes('future')) return 'future';
  if (typeLower.includes('sub')) return 'sub';
  return 'side';
}

// Normalize visibility
function normalizeVisibility(visibility) {
  const visLower = visibility.toLowerCase().trim();
  if (visLower === 'public') return 'public';
  if (visLower === 'private') return 'private';
  return 'private'; // Default to private
}

// Parse tags
function parseTags(tagsStr) {
  if (!tagsStr || tagsStr.toLowerCase() === 'n/a') return [];
  return tagsStr.split(',').map(t => t.trim()).filter(t => t);
}

// Parse linked to
function parseLinkedTo(linkedTo) {
  if (!linkedTo || linkedTo.toLowerCase() === 'n/a') return null;

  const match = linkedTo.match(/(Project|Quest):\s*(.+)/i);
  if (match) {
    return {
      type: match[1].toLowerCase(),
      name: match[2].trim()
    };
  }
  return null;
}

async function uploadData() {
  console.log('🚀 Starting data upload...\n');

  const rows = parseCSV(csvData);
  console.log(`📊 Parsed ${rows.length} rows\n`);

  // Storage for IDs
  const projectIds = new Map();
  const questIds = new Map();
  const tagIds = new Map();

  // Separate data by type
  const projects = rows.filter(r => r.Type === 'Project');
  const mainQuests = rows.filter(r => r.Type === 'Main quest');
  const futureQuests = rows.filter(r => r.Type === 'future quest');
  const subQuests = rows.filter(r => r.Type === 'sub quest');
  const issues = rows.filter(r => r.Type === 'Issues' || r.Type === 'Improvements');

  console.log(`📦 Found:`);
  console.log(`   - ${projects.length} projects`);
  console.log(`   - ${mainQuests.length} main quests`);
  console.log(`   - ${futureQuests.length} future quests`);
  console.log(`   - ${subQuests.length} sub quests`);
  console.log(`   - ${issues.length} issues/improvements\n`);

  // Step 1: Insert Projects
  console.log('1️⃣  Inserting projects...');
  for (const row of projects) {
    const projectData = {
      title: row['Title/name'],
      description: row.Description || null,
      status: normalizeStatus(row.Status, 'Project'),
      visibility: normalizeVisibility(row['public/private'])
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Error inserting project "${row['Title/name']}":`, error.message);
    } else {
      projectIds.set(row['Title/name'].toLowerCase(), data.id);
      console.log(`   ✅ ${row['Title/name']}`);
    }
  }
  console.log();

  // Step 2: Insert Main and Future Quests
  console.log('2️⃣  Inserting quests...');
  const allQuests = [...mainQuests, ...futureQuests];

  for (const row of allQuests) {
    const questData = {
      title: row['Title/name'],
      quest_type: normalizeQuestType(row.Type),
      status: normalizeStatus(row.Status, row.Type),
      description: row.Description || null,
      visibility: normalizeVisibility(row['public/private'])
    };

    const { data, error } = await supabase
      .from('quests')
      .insert(questData)
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Error inserting quest "${row['Title/name']}":`, error.message);
    } else {
      questIds.set(row['Title/name'].toLowerCase(), data.id);
      console.log(`   ✅ ${row['Title/name']}`);

      // Handle project linkage
      const linked = parseLinkedTo(row['linked to']);
      if (linked && linked.type === 'project') {
        const projectId = projectIds.get(linked.name.toLowerCase());
        if (projectId) {
          const { error: linkError } = await supabase
            .from('page_quests')
            .insert({ quest_id: data.id, page_id: projectId });

          if (linkError) {
            console.error(`   ⚠️  Error linking to project:`, linkError.message);
          }
        }
      }

      // Handle tags
      const tags = parseTags(row.tags);
      for (const tagName of tags) {
        let tagId = tagIds.get(tagName.toLowerCase());

        if (!tagId) {
          // Create tag if it doesn't exist
          const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select()
            .single();

          if (!tagError && tagData) {
            tagId = tagData.id;
            tagIds.set(tagName.toLowerCase(), tagId);
          }
        }

        if (tagId) {
          await supabase
            .from('quest_tags')
            .insert({ quest_id: data.id, tag_id: tagId });
        }
      }
    }
  }
  console.log();

  // Step 3: Insert Sub Quests
  console.log('3️⃣  Inserting sub quests...');
  for (const row of subQuests) {
    const linked = parseLinkedTo(row['linked to']);

    if (!linked || linked.type !== 'quest') {
      console.warn(`   ⚠️  Skipping "${row['Title/name']}" - no quest linkage`);
      continue;
    }

    const questId = questIds.get(linked.name.toLowerCase());
    if (!questId) {
      console.warn(`   ⚠️  Skipping "${row['Title/name']}" - quest not found: ${linked.name}`);
      continue;
    }

    const subQuestData = {
      quest_id: questId,
      title: row['Title/name'],
      is_completed: row.Status.toLowerCase().includes('checked') || row.Status.toLowerCase() === 'done'
    };

    const { error } = await supabase
      .from('sub_quests')
      .insert(subQuestData);

    if (error) {
      console.error(`   ❌ Error inserting sub quest "${row['Title/name']}":`, error.message);
    } else {
      console.log(`   ✅ ${row['Title/name']}`);
    }
  }
  console.log();

  // Step 4: Insert Issues
  console.log('4️⃣  Inserting issues...');
  for (const row of issues) {
    const linked = parseLinkedTo(row['linked to']);

    if (!linked) {
      console.warn(`   ⚠️  Skipping "${row['Title/name']}" - no linkage`);
      continue;
    }

    let attachedToId;
    let attachedToType;

    if (linked.type === 'project') {
      attachedToId = projectIds.get(linked.name.toLowerCase());
      attachedToType = 'project';
    } else if (linked.type === 'quest') {
      attachedToId = questIds.get(linked.name.toLowerCase());
      attachedToType = 'quest';
    }

    if (!attachedToId) {
      console.warn(`   ⚠️  Skipping "${row['Title/name']}" - parent not found: ${linked.name}`);
      continue;
    }

    const severity = row['Issue level'];
    const issueData = {
      attached_to_type: attachedToType,
      attached_to_id: attachedToId,
      issue_type: row.Type.toLowerCase(),
      severity: (severity && severity !== 'N/A') ? severity.toLowerCase() : null,
      title: row['Title/name'],
      description: row.Description || null,
      status: normalizeStatus(row.Status, 'issue')
    };

    const { error } = await supabase
      .from('issues')
      .insert(issueData);

    if (error) {
      console.error(`   ❌ Error inserting issue "${row['Title/name']}":`, error.message);
    } else {
      console.log(`   ✅ ${row['Title/name']}`);
    }
  }
  console.log();

  console.log('✨ Data upload complete!');
  console.log(`\n📈 Summary:`);
  console.log(`   - Projects: ${projectIds.size}`);
  console.log(`   - Quests: ${questIds.size}`);
  console.log(`   - Tags: ${tagIds.size}`);
}

// Run the upload
uploadData().catch(console.error);
