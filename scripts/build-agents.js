#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Build a Neon connection string from individual env vars
 */
function getNeonConnectionString() {
  const host = process.env.NEON_DB_HOST;
  const port = process.env.NEON_DB_PORT || '5432';
  const user = process.env.NEON_DB_USER;
  const password = process.env.NEON_DB_PASSWORD;
  const dbName = process.env.NEON_DB_NAME || 'neondb';

  if (!host || !user || !password) {
    return null;
  }

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?sslmode=require`;
}

/**
 * Sync metadata from database to YAML files that are missing updated_at field
 * Adds updated_at timestamp to existing agents without modifying other content
 */
async function syncMetadataFromDatabase(agents, supabase) {
  const agentsDir = path.join(__dirname, '../agents');
  let syncedCount = 0;

  for (const agent of agents) {
    try {
      const agentId = agent.agent.id;
      const configPath = path.join(agentsDir, agentId, 'config.yaml');

      // Skip if agent already has updated_at
      if (agent.updated_at) {
        continue;
      }

      // Fetch updated_at from database
      const { data: dbAgent, error: fetchError } = await supabase
        .from('agents')
        .select('updated_at')
        .eq('agent_id', agentId)
        .single();

      if (fetchError || !dbAgent || !dbAgent.updated_at) {
        continue;
      }

      // Add updated_at to the config
      const updatedConfig = {
        updated_at: dbAgent.updated_at,
        ...agent
      };

      // Write updated config.yaml
      await fs.writeFile(configPath, yaml.dump(updatedConfig, { lineWidth: -1 }));
      syncedCount++;
    } catch (err) {
      // Silent error handling
    }
  }
}

/**
 * Sync all agent_builder-created agents from database
 * - Creates new agents in filesystem if they don't exist
 * - Updates existing agents if DB is newer
 */
async function syncAgentBuilderAgents(agents, supabase) {
  const connectionString = getNeonConnectionString();
  if (!connectionString) {
    console.log('⚠️ Neon connection not available, skipping YAML update check');
    return;
  }

  const sql = neon(connectionString);
  const agentsDir = path.join(__dirname, '../agents');
  let updatedCount = 0;

  console.log('🔄 Syncing agent_builder agents from database...');

  // Get all agent_builder agents from database
  const { data: agentBuilderAgents, error: fetchError } = await supabase
    .from('agents')
    .select('agent_id, updated_at')
    .eq('last_modified_by', 'agent_builder');

  if (fetchError || !agentBuilderAgents || agentBuilderAgents.length === 0) {
    console.log('✅ No agent_builder agents found in database');
    return;
  }

  console.log(`📋 Found ${agentBuilderAgents.length} agent_builder agent(s) in database`);

  for (const dbAgent of agentBuilderAgents) {
    try {
      const agentId = dbAgent.agent_id;
      const configPath = path.join(agentsDir, agentId, 'config.yaml');
      
      // Check if agent exists in local filesystem
      const existingAgent = agents.find(a => a.agent.id === agentId);
      const agentExists = existingAgent !== undefined;
      
      // Determine if we need to update/create
      let shouldSync = false;
      
      if (!agentExists) {
        // Agent doesn't exist in folder - backup from database
        console.log(`  📦 New agent_builder agent: ${agentId} (not in folder, backing up)`);
        shouldSync = true;
      } else {
        // Agent exists - check if DB is newer
        const yamlModTime = existingAgent.updated_at ? new Date(existingAgent.updated_at) : null;
        const dbModTime = new Date(dbAgent.updated_at);
        
        if (!yamlModTime || dbModTime > yamlModTime) {
          console.log(`  🔄 Updating ${agentId} from database (DB: ${dbModTime.toISOString()}, YAML: ${yamlModTime ? yamlModTime.toISOString() : 'none'})`);
          shouldSync = true;
        }
      }
      
      if (shouldSync) {
        // Create agent folder if it doesn't exist
        const agentFolder = path.join(agentsDir, agentId);
        await fs.mkdir(agentFolder, { recursive: true });

        // Fetch full agent data
        const { data: agentData, error: dataError } = await supabase
          .from('agents')
          .select('*')
          .eq('agent_id', agentId)
          .single();

        if (dataError || !agentData) {
          console.error(`    ❌ Error fetching data for ${agentId}`);
          continue;
        }

        // Build updated config.yaml
        const config = {
          updated_at: agentData.updated_at,
          agent: {
            id: agentData.agent_id,
            name: agentData.name,
            emoji: agentData.emoji || '🤖',
            category: agentData.category.toLowerCase(),
            description: agentData.description,
            specialization: agentData.specialization || undefined,
            tagline: agentData.tagline || undefined,
            avatar: agentData.avatar_url || undefined,
            pinned: agentData.pinned || false,
            enabled: agentData.is_enabled,
            admin_only: agentData.admin_only || false,
            uses_conversation_state: agentData.uses_conversation_state || false,
            initial_message: agentData.initial_message || undefined,
            sidebar_greeting: agentData.sidebar_greeting || undefined,
            capabilities: agentData.capabilities || [],
            recent_actions: agentData.recent_actions || []
          },
          n8n: {
            webhook_url: agentData.webhook_url || ''
          },
          ui_use: agentData.ui_config || {},
          interface: agentData.interface_config || {},
          suggestions: agentData.suggestions || [],
          personality: agentData.personality || {},
          platforms: agentData.platforms || {},
          domain_config: agentData.domain_config || {},
          skills: agentData.skills || []
        };

        // Update config.yaml
        await fs.writeFile(configPath, yaml.dump(config, { lineWidth: -1 }));
        console.log(`    ✅ Updated config.yaml`);

        // Update system_prompt from Neon
        try {
          const systemPrompts = await sql`
            SELECT prompt_content 
            FROM system_prompts 
            WHERE agent_id = ${agentId}
            LIMIT 1
          `;

          if (systemPrompts.length > 0 && systemPrompts[0].prompt_content) {
            const promptPath = path.join(agentsDir, agentId, 'system_prompt.md');
            await fs.writeFile(promptPath, systemPrompts[0].prompt_content);
            console.log(`    ✅ Updated system_prompt.md`);
          }
        } catch (err) {
          console.log(`    ⚠️ No system prompt to update`);
        }

        // Update skills from Neon
        try {
          const skills = await sql`
            SELECT skill_name, skill_content 
            FROM agent_skills 
            WHERE agent_id = ${agentId}
          `;

          if (skills.length > 0) {
            const skillsFolder = path.join(agentsDir, agentId, 'skills');
            await fs.mkdir(skillsFolder, { recursive: true });

            // Clear existing skills folder
            const existingFiles = await fs.readdir(skillsFolder);
            for (const file of existingFiles) {
              if (file.endsWith('.md')) {
                await fs.unlink(path.join(skillsFolder, file));
              }
            }

            // Write updated skills
            for (const skill of skills) {
              const skillFileName = skill.skill_name.toLowerCase().replace(/\s+/g, '_') + '.md';
              const skillPath = path.join(skillsFolder, skillFileName);
              await fs.writeFile(skillPath, skill.skill_content || '');
            }
            console.log(`    ✅ Updated ${skills.length} skill(s)`);
          }
        } catch (err) {
          console.log(`    ⚠️ No skills to update`);
        }

        updatedCount++;
        console.log(`  ✅ Updated ${agentId} from database`);
      }
    } catch (err) {
      console.error(`  ❌ Error checking ${agent.agent.id}:`, err.message);
    }
  }

  if (updatedCount > 0) {
    console.log(`✅ Synced ${updatedCount} agent_builder agent(s) from database`);
  } else {
    console.log(`✅ All agent_builder agents are up to date`);
  }
}

/**
 * Backup agent_builder-created agents to filesystem
 * Downloads agent config, system prompt, and skills from databases
 */
async function backupAgentBuilderAgents(orphanedAgents, supabase) {
  const connectionString = getNeonConnectionString();
  if (!connectionString) {
    console.log('⚠️ Neon connection not available, skipping agent backup');
    return [];
  }

  const sql = neon(connectionString);
  const agentsDir = path.join(__dirname, '../agents');
  const backedUpAgents = [];

  console.log('💾 Backing up agent_builder-created agents...');

  for (const orphan of orphanedAgents) {
    try {
      // Fetch full agent data from Supabase
      const { data: agentData, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_id', orphan.agent_id)
        .single();

      if (fetchError || !agentData) {
        console.error(`  ❌ Error fetching ${orphan.agent_id}:`, fetchError?.message);
        continue;
      }

      // Only backup if created by agent_builder
      if (agentData.last_modified_by !== 'agent_builder') {
        continue;
      }

      console.log(`  📦 Backing up: ${orphan.agent_id}`);

      // Create agent folder
      const agentFolder = path.join(agentsDir, orphan.agent_id);
      await fs.mkdir(agentFolder, { recursive: true });

      // Build config.yaml from database data
      const config = {
        updated_at: agentData.updated_at,
        agent: {
          id: agentData.agent_id,
          name: agentData.name,
          emoji: agentData.emoji || '🤖',
          category: agentData.category.toLowerCase(),
          description: agentData.description,
          specialization: agentData.specialization || undefined,
          tagline: agentData.tagline || undefined,
          avatar: agentData.avatar_url || undefined,
          pinned: agentData.pinned || false,
          enabled: agentData.is_enabled,
          admin_only: agentData.admin_only || false,
          uses_conversation_state: agentData.uses_conversation_state || false,
          initial_message: agentData.initial_message || undefined,
          sidebar_greeting: agentData.sidebar_greeting || undefined,
          capabilities: agentData.capabilities || [],
          recent_actions: agentData.recent_actions || []
        },
        n8n: {
          webhook_url: agentData.webhook_url || ''
        },
        ui_use: agentData.ui_config || {},
        interface: agentData.interface_config || {},
        suggestions: agentData.suggestions || [],
        personality: agentData.personality || {},
        platforms: agentData.platforms || {},
        domain_config: agentData.domain_config || {},
        skills: agentData.skills || []
      };

      // Write config.yaml
      const configPath = path.join(agentFolder, 'config.yaml');
      await fs.writeFile(configPath, yaml.dump(config, { lineWidth: -1 }));
      console.log(`    ✅ Created config.yaml`);

      // Download system_prompt from Neon
      try {
        const systemPrompts = await sql`
          SELECT prompt_content 
          FROM system_prompts 
          WHERE agent_id = ${orphan.agent_id}
          LIMIT 1
        `;

        if (systemPrompts.length > 0 && systemPrompts[0].prompt_content) {
          const promptPath = path.join(agentFolder, 'system_prompt.md');
          await fs.writeFile(promptPath, systemPrompts[0].prompt_content);
          console.log(`    ✅ Downloaded system_prompt.md`);
        }
      } catch (err) {
        console.log(`    ⚠️ No system prompt found`);
      }

      // Download skills from Neon
      try {
        const skills = await sql`
          SELECT skill_name, skill_content 
          FROM agent_skills 
          WHERE agent_id = ${orphan.agent_id}
        `;

        if (skills.length > 0) {
          const skillsFolder = path.join(agentFolder, 'skills');
          await fs.mkdir(skillsFolder, { recursive: true });

          for (const skill of skills) {
            const skillFileName = skill.skill_name.toLowerCase().replace(/\s+/g, '_') + '.md';
            const skillPath = path.join(skillsFolder, skillFileName);
            await fs.writeFile(skillPath, skill.skill_content || '');
          }
          console.log(`    ✅ Downloaded ${skills.length} skill(s)`);
        }
      } catch (err) {
        console.log(`    ⚠️ No skills found`);
      }

      backedUpAgents.push(orphan.agent_id);
      console.log(`  ✅ Backed up: ${orphan.agent_id}`);

    } catch (err) {
      console.error(`  ❌ Error backing up ${orphan.agent_id}:`, err.message);
    }
  }

  if (backedUpAgents.length > 0) {
    console.log(`✅ Backed up ${backedUpAgents.length} agent_builder-created agent(s)`);
  }

  return backedUpAgents;
}

/**
 * Upsert complete agent configurations to agents table
 * This is the "Bible of Agents" - stores ALL configuration data
 */
async function syncCompleteAgentConfigurations(agents) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase credentials not found, skipping agents sync');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📚 Syncing complete agent configurations to agents table...');

  const configRecords = agents.map((agent, index) => ({
    agent_id: agent.agent.id,
    name: agent.agent.name,
    emoji: agent.agent.emoji || '🤖',
    category: agent.agent.category?.toUpperCase() || 'GENERAL',
    description: agent.agent.description || '',
    specialization: agent.agent.specialization || null,
    tagline: agent.agent.tagline || null,
    avatar_url: agent.agent.avatar || null,
    pinned: agent.agent.pinned === true,
    display_order: agent.agent.pinned ? index : index + 100,
    is_enabled: agent.agent.enabled === true,
    admin_only: agent.agent.admin_only === true,
    is_default: agent.agent.id === 'personal_assistant',
    initial_message: agent.agent.initial_message || null,
    sidebar_greeting: agent.agent.sidebar_greeting || null,
    capabilities: agent.agent.capabilities || [],
    recent_actions: agent.agent.recent_actions || [],
    skills: agent.skills || [],
    ui_config: agent.ui_use || agent.ui || {},
    interface_config: agent.interface || {},
    suggestions: agent.suggestions || [],
    personality: agent.personality || {},
    webhook_url: agent.n8n?.webhook_url || '',
    uses_conversation_state: agent.agent.uses_conversation_state === true,
    platforms: agent.platforms || {},
    domain_config: agent.domain_config || {},
    raw_config: agent,
    last_modified_by: 'admin'
  }));

  for (const record of configRecords) {
    try {
      const { error } = await supabase
        .from('agents')
        .upsert(record, {
          onConflict: 'agent_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Error syncing ${record.agent_id} to agents:`, error.message);
      } else {
        console.log(`  ✅ ${record.agent_id}`);
      }
    } catch (err) {
      console.error(`❌ Error syncing ${record.agent_id}:`, err.message);
    }
  }

  // Note: Orphaned agent cleanup removed - syncAgentBuilderAgents now handles
  // all agent_builder agents by syncing them to filesystem before this step

  console.log(`✅ Synced ${configRecords.length} agents with complete configurations`);
}

/**
 * Upsert agents to Supabase personal_assistant_config table
 * Only upserts records with config_type = 'assistants'
 * Syncs: code, display_name, emoji, description, category, is_enabled
 */
async function upsertAgentsToSupabase(agents) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase credentials not found, skipping database sync');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // ============================================
  // SYNC TO personal_assistant_config TABLE
  // ============================================
  const configRecords = agents.map(agent => ({
    config_type: 'assistants',
    code: agent.agent.id,
    display_name: agent.agent.name,
    emoji: agent.agent.emoji || '🤖',
    description: agent.agent.description || null,
    category: agent.agent.category || 'General',
    is_enabled: agent.agent.enabled === true
  }));

  for (const record of configRecords) {
    try {
      const { error } = await supabase
        .from('personal_assistant_config')
        .upsert(record, {
          onConflict: 'config_type,code',
          ignoreDuplicates: false
        });
      if (error) {
        console.error(`❌ Error syncing ${record.code} to personal_assistant_config:`, error.message);
      }
    } catch (err) {
      console.error(`❌ Error syncing ${record.code}:`, err.message);
    }
  }

  console.log(`✅ Synced ${configRecords.length} agents to database`);

  // ============================================
  // CLEANUP: Remove agents from DB that are not in YAML configs
  // ============================================
  const yamlAgentIds = configRecords.map(r => r.code);
  
  try {
    const { data: dbAgents, error: fetchError } = await supabase
      .from('personal_assistant_config')
      .select('code');
    
    if (fetchError) {
      console.error('❌ Error fetching agents for cleanup:', fetchError.message);
    } else if (dbAgents) {
      const orphanedAgents = dbAgents.filter(
        dbAgent => !yamlAgentIds.includes(dbAgent.code)
      );
      
      if (orphanedAgents.length > 0) {
        console.log('🧹 Cleaning up orphaned agents from database...');
        for (const orphan of orphanedAgents) {
          const { error: deleteError } = await supabase
            .from('personal_assistant_config')
            .delete()
            .eq('code', orphan.code);
          
          if (deleteError) {
            console.error(`  ❌ Error deleting ${orphan.code}:`, deleteError.message);
          } else {
            console.log(`  🗑️  Deleted: ${orphan.code}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}

/**
 * Compile system prompts (base + agent-specific) and upsert to Neon
 * Reads: agents/shared/base_system_prompt.md (base)
 * Reads: agents/<agent_id>/system_prompt.md (per-agent)
 * Writes compiled prompt to: agent_system_prompts.system_prompt via @neondatabase/serverless
 */
async function syncSystemPromptsToNeon(agents) {
  const connectionString = getNeonConnectionString();

  if (!connectionString) {
    console.log('⚠️ Neon DB credentials not found, skipping system prompt sync');
    return;
  }

  const sql = neon(connectionString);
  const agentsDir = path.join(__dirname, '../agents');

  // Read the base system prompt
  let basePrompt;
  try {
    basePrompt = await fs.readFile(
      path.join(agentsDir, 'shared', 'base_system_prompt.md'),
      'utf8'
    );
    console.log(`📄 Loaded base system prompt (${basePrompt.length} chars)`);
  } catch (err) {
    console.error('❌ Could not read agents/shared/base_system_prompt.md:', err.message);
    return;
  }

  console.log('🧠 Compiling and syncing system prompts to Neon...');

  let successCount = 0;

  for (const agent of agents) {
    const agentId = agent.agent.id;

    // Read agent-specific prompt (optional — some agents may only use the base)
    let agentPrompt = null;
    try {
      agentPrompt = await fs.readFile(
        path.join(agentsDir, agentId, 'system_prompt.md'),
        'utf8'
      );
    } catch {
      // No agent-specific prompt — that's fine
    }

    // Compile: base + agent-specific (with a clear separator)
    const compiledPrompt = agentPrompt
      ? `${basePrompt}\n\n---\n\n${agentPrompt}`
      : basePrompt;

    try {
      await sql`
        INSERT INTO agent_system_prompts (agent_id, system_prompt)
        VALUES (${agentId}, ${compiledPrompt})
        ON CONFLICT (agent_id) DO UPDATE SET
          system_prompt = EXCLUDED.system_prompt,
          updated_at = NOW()
      `;

      const suffix = agentPrompt
        ? `(base + agent prompt, ${compiledPrompt.length} chars)`
        : `(base only, ${compiledPrompt.length} chars)`;
      console.log(`  ✅ ${agentId} ${suffix}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ ${agentId}: ${err.message}`);
    }
  }

  // Clean up orphaned prompts (agents removed from YAML but still in DB)
  const yamlAgentIds = agents.map(a => a.agent.id);
  try {
    const deleted = await sql`
      DELETE FROM agent_system_prompts
      WHERE agent_id != ALL(${yamlAgentIds}::varchar[])
      RETURNING agent_id
    `;
    if (deleted.length > 0) {
      console.log(`  🗑️  Cleaned up ${deleted.length} orphaned system prompt(s): ${deleted.map(r => r.agent_id).join(', ')}`);
    }
  } catch (err) {
    console.error('  ❌ Error cleaning up orphaned prompts:', err.message);
  }

  console.log(`✅ Synced ${successCount} system prompts to Neon`);
}

/**
 * Read skills from config.yaml and update system_prompt.md with skills table
 * Reads: agents/<agent_id>/config.yaml (skills section)
 * Updates: agents/<agent_id>/system_prompt.md (injects/updates SKILLS section)
 */
async function syncSkillsToSystemPrompts(agents) {
  const agentsDir = path.join(__dirname, '../agents');
  console.log('📚 Syncing skills to system prompts...');

  let successCount = 0;
  let skippedCount = 0;

  for (const agent of agents) {
    const agentId = agent.agent.id;
    const skills = agent.skills || [];

    // Skip if no skills defined
    if (skills.length === 0) {
      skippedCount++;
      continue;
    }

    const systemPromptPath = path.join(agentsDir, agentId, 'system_prompt.md');

    try {
      // Read existing system prompt
      let systemPrompt = await fs.readFile(systemPromptPath, 'utf8');

      // Generate skills table
      const skillsSection = `=======================================================================
## SKILLS

The agent has skills containing best practices for each area of responsibility. Before executing a task, consult the relevant skill file and follow its instructions. Multiple skills may apply to a single task.

| Skill_name | Use When |
|-------|----------|
${skills.map(skill => `| ${skill.name} | ${skill.description} |`).join('\n')}
`;

      // Check if SKILLS section already exists and matches the one we want to add
      const existingSkillsMatch = systemPrompt.match(/\n={7,}\n## SKILLS\n[\s\S]*?(?=\n={7,}\n##|$)/);
      
      if (existingSkillsMatch) {
        // SKILLS section exists - check if it matches what we want to add
        const existingSkills = existingSkillsMatch[0].trim();
        const newSkills = skillsSection.trim();
        
        if (existingSkills === newSkills) {
          // SKILLS section is already correct, skip this agent
          console.log(`  ⏭️  ${agentId} (skills already up to date)`);
          skippedCount++;
          continue;
        }
      }
      
      // Remove ALL existing SKILLS sections (handles duplicates)
      // Split by section headers, filter out SKILLS sections, then rebuild
      const sectionSeparator = /\n={7,}\n## /;
      const parts = systemPrompt.split(sectionSeparator);
      
      // First part is everything before the first section (title, description)
      let cleanedPrompt = parts[0];
      
      // Process remaining parts (each starts with a section name)
      for (let i = 1; i < parts.length; i++) {
        // Check if this section is a SKILLS section
        if (!parts[i].startsWith('SKILLS\n')) {
          // Not a SKILLS section, keep it
          cleanedPrompt += '\n=======================================================================\n## ' + parts[i];
        }
        // If it is a SKILLS section, skip it (don't add it back)
      }
      
      // Remove trailing whitespace
      cleanedPrompt = cleanedPrompt.trimEnd();
      
      // Append the new SKILLS section at the end
      systemPrompt = cleanedPrompt + '\n\n' + skillsSection;

      // Write updated system prompt
      await fs.writeFile(systemPromptPath, systemPrompt, 'utf8');
      console.log(`  ✅ ${agentId} (${skills.length} skills)`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ ${agentId}: ${err.message}`);
    }
  }

  if (skippedCount > 0) {
    console.log(`  ⏭️  Skipped ${skippedCount} agents with no skills`);
  }
  console.log(`✅ Updated ${successCount} system prompts with skills`);
}

/**
 * Upload agent skills to Neon database
 * Reads: agents/<agent_id>/config.yaml (skills section)
 * Writes: agent_skills table in Neon
 */
async function syncSkillsToNeon(agents) {
  const connectionString = getNeonConnectionString();

  if (!connectionString) {
    console.log('⚠️ Neon DB credentials not found, skipping skills sync to database');
    return;
  }

  const sql = neon(connectionString);
  const agentsDir = path.join(__dirname, '../agents');
  console.log('💾 Syncing skills to Neon database...');

  let successCount = 0;
  let totalSkills = 0;

  for (const agent of agents) {
    const agentId = agent.agent.id;
    const skills = agent.skills || [];

    if (skills.length === 0) {
      continue;
    }

    for (const skill of skills) {
      try {
        // Skip special skills that are uploaded separately
        if (skill.file === 'base_system_prompt.md' || skill.file === 'agent_template.yaml') {
          continue;
        }

        // Read skill content from markdown file
        let skillContent = skill.description; // Fallback to description
        
        if (skill.file) {
          // Try agent-specific skills folder first
          let skillFilePath = path.join(agentsDir, agentId, 'skills', skill.file);
          
          try {
            skillContent = await fs.readFile(skillFilePath, 'utf8');
          } catch (err) {
            // Try shared skills folder
            skillFilePath = path.join(agentsDir, 'shared', 'skills', skill.file);
            try {
              skillContent = await fs.readFile(skillFilePath, 'utf8');
            } catch (sharedErr) {
              console.warn(`  ⚠️  Skill file not found: ${skill.file} for ${agentId}, using description as content`);
            }
          }
        }

        await sql`
          INSERT INTO agent_skills (agent_id, skill_name, brief, skill_content, is_global)
          VALUES (
            ${agentId},
            ${skill.name},
            ${skill.description},
            ${skillContent},
            false
          )
          ON CONFLICT (skill_name, agent_id) DO UPDATE SET
            brief = EXCLUDED.brief,
            skill_content = EXCLUDED.skill_content,
            updated_at = NOW()
        `;
        totalSkills++;
      } catch (err) {
        console.error(`  ❌ Error syncing skill "${skill.name}" for ${agentId}:`, err.message);
      }
    }

    console.log(`  ✅ ${agentId} (${skills.length} skills)`);
    successCount++;
  }

  // ============================================
  // SPECIAL: Upload base_system_prompt.md as a skill for agent_builder
  // ============================================
  try {
    const basePromptPath = path.join(agentsDir, 'shared', 'base_system_prompt.md');
    const basePromptContent = await fs.readFile(basePromptPath, 'utf8');
    
    await sql`
      INSERT INTO agent_skills (agent_id, skill_name, brief, skill_content, is_global)
      VALUES (
        'agent_builder',
        'Base System Prompt Reference',
        'Reference for base system prompt content that is automatically added to ALL agents. When creating agent system prompts, avoid duplicating or overwriting anything already mentioned in this base prompt (core principles, response format, security, tone, error handling).',
        ${basePromptContent},
        false
      )
      ON CONFLICT (skill_name, agent_id) DO UPDATE SET
        brief = EXCLUDED.brief,
        skill_content = EXCLUDED.skill_content,
        updated_at = NOW()
    `;
    
    console.log(`  ✅ agent_builder (base_system_prompt.md uploaded as skill)`);
    totalSkills++;
  } catch (err) {
    console.error(`  ❌ Error uploading base_system_prompt.md for agent_builder:`, err.message);
  }

  // ============================================
  // SPECIAL: Upload agent_template.yaml as a skill for agent_builder
  // ============================================
  try {
    const templatePath = path.join(agentsDir, 'shared', 'agent_template.yaml');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    
    // Convert YAML to markdown format for better readability
    const templateMarkdown = `# Agent Configuration Template

This is the standard template for all agent config.yaml files. When creating a new agent's config.yaml, review this template and customize it based on user requirements.

## Template Structure

\`\`\`yaml
${templateContent}
\`\`\`

## Key Points

- **Required Fields**: id, emoji, name, category, description, capabilities
- **Optional Fields**: specialization, tagline, avatar, pinned, enabled, admin_only
- **Skills Section**: Define agent-specific skills with name, description, and file reference
- **UI Configuration**: page_type, pages, interface features
- **N8N Integration**: webhook_url pointing to the agent's N8N workflow
- **Personality**: tone, style, approach for agent behavior

When generating config.yaml, use this template as the base structure and fill in values based on the agent's purpose and inferred requirements.
`;
    
    await sql`
      INSERT INTO agent_skills (agent_id, skill_name, brief, skill_content, is_global)
      VALUES (
        'agent_builder',
        'Agent Configuration Template',
        'Standard template for agent config.yaml files. When creating config.yaml, review this template and customize all fields based on user requirements and inferred agent characteristics.',
        ${templateMarkdown},
        false
      )
      ON CONFLICT (skill_name, agent_id) DO UPDATE SET
        brief = EXCLUDED.brief,
        skill_content = EXCLUDED.skill_content,
        updated_at = NOW()
    `;
    
    console.log(`  ✅ agent_builder (agent_template.yaml uploaded as skill)`);
    totalSkills++;
  } catch (err) {
    console.error(`  ❌ Error uploading agent_template.yaml for agent_builder:`, err.message);
  }

  // Clean up orphaned skills (skills removed from config but still in DB)
  const agentIds = agents.map(a => a.agent.id);
  const allSkillNames = agents.flatMap(a => 
    (a.skills || []).map(s => ({ agent_id: a.agent.id, skill_name: s.name }))
  );
  
  // Add the special agent_builder skills to the list so they don't get cleaned up
  allSkillNames.push({ agent_id: 'agent_builder', skill_name: 'Base System Prompt Reference' });
  allSkillNames.push({ agent_id: 'agent_builder', skill_name: 'Agent Configuration Template' });

  try {
    // Get all skills from database
    const dbSkills = await sql`
      SELECT agent_id, skill_name FROM agent_skills
    `;

    // Find orphaned skills
    const orphanedSkills = dbSkills.filter(dbSkill => 
      !allSkillNames.some(s => 
        s.agent_id === dbSkill.agent_id && s.skill_name === dbSkill.skill_name
      )
    );

    if (orphanedSkills.length > 0) {
      console.log(`🧹 Cleaning up ${orphanedSkills.length} orphaned skills...`);
      for (const orphan of orphanedSkills) {
        await sql`
          DELETE FROM agent_skills
          WHERE agent_id = ${orphan.agent_id}
            AND skill_name = ${orphan.skill_name}
        `;
        console.log(`  🗑️  Deleted: ${orphan.agent_id} - ${orphan.skill_name}`);
      }
    }
  } catch (err) {
    console.error('  ❌ Error cleaning up orphaned skills:', err.message);
  }

  console.log(`✅ Synced ${totalSkills} skills from ${successCount} agents to Neon`);
}

/**
 * Build-time script to sync all YAML agent configurations to database
 * Parses YAML files and syncs to Supabase agents table and Neon database
 */
async function buildAgents() {
  try {
    const agentsDir = path.join(__dirname, '../agents');
    
    // Initialize Supabase client for update checks
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
    
    // Read all directories in the agents folder
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    const agentFolders = entries.filter(entry => 
      entry.isDirectory() && entry.name !== 'shared'
    );
    
    const agents = [];
    
    // Parse config.yaml from each agent folder
    for (const folder of agentFolders) {
      try {
        const configPath = path.join(agentsDir, folder.name, 'config.yaml');
        const content = await fs.readFile(configPath, 'utf8');
        const config = yaml.load(content);
        
        // Only include valid agent configs
        if (config && config.agent && config.agent.id) {
          agents.push(config);
        }
      } catch (error) {
        // Skip folders without config.yaml
      }
    }
    
    // Sync metadata from database for agents missing updated_at field
    if (supabase) {
      await syncMetadataFromDatabase(agents, supabase);
      
      // Re-parse agents after metadata sync
      agents.length = 0;
      for (const folder of agentFolders) {
        try {
          const configPath = path.join(agentsDir, folder.name, 'config.yaml');
          const content = await fs.readFile(configPath, 'utf8');
          const config = yaml.load(content);
          
          if (config && config.agent && config.agent.id) {
            agents.push(config);
          }
        } catch (error) {
          // Skip folders without config.yaml
        }
      }
      
      // Sync all agent_builder agents (new and existing)
      await syncAgentBuilderAgents(agents, supabase);
      
      // Re-parse agents after agent_builder sync (may have new agents)
      agents.length = 0;
      const updatedEntries = await fs.readdir(agentsDir, { withFileTypes: true });
      const updatedFolders = updatedEntries.filter(entry => 
        entry.isDirectory() && entry.name !== 'shared'
      );
      
      for (const folder of updatedFolders) {
        try {
          const configPath = path.join(agentsDir, folder.name, 'config.yaml');
          const content = await fs.readFile(configPath, 'utf8');
          const config = yaml.load(content);
          
          if (config && config.agent && config.agent.id) {
            agents.push(config);
          }
        } catch (error) {
          // Skip folders without config.yaml
        }
      }
    }
    
    // Sync complete agent configurations to database (Bible of Agents)
    await syncCompleteAgentConfigurations(agents);

    // Sync agents to Supabase database (legacy tables)
    await upsertAgentsToSupabase(agents);

    // Update system prompts with skills table
    await syncSkillsToSystemPrompts(agents);

    // Upload skills to Neon database
    await syncSkillsToNeon(agents);

    // Compile and sync system prompts to Neon
    await syncSystemPromptsToNeon(agents);

  } catch (error) {
    console.error('❌ Failed to build agents:', error);
    process.exit(1);
  }
}

buildAgents();
