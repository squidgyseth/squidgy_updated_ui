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

  // ============================================
  // SYNC TO agents TABLE (for n8n/Personal Assistant)
  // ============================================
  console.log('📦 Syncing agents to agents table...');
  
  const agentRecords = agents.map((agent, index) => ({
    agent_id: agent.agent.id,
    name: agent.agent.name,
    description: agent.agent.description || null,
    category: agent.agent.category?.toUpperCase() || 'GENERAL',
    emoji: agent.agent.emoji || '🤖',
    specialization: agent.agent.specialization || null,
    tagline: agent.agent.tagline || null,
    webhook_url: agent.n8n?.webhook_url || null,
    avatar_url: agent.agent.avatar || null,
    is_enabled: agent.agent.enabled === true,
    admin_only: agent.agent.admin_only === true,
    is_default: agent.agent.id === 'personal_assistant',
    display_order: agent.agent.pinned ? index : index + 100
  }));

  for (const record of agentRecords) {
    try {
      const { data: existing } = await supabase
        .from('agents')
        .select('id')
        .eq('agent_id', record.agent_id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('agents')
          .update({
            name: record.name,
            description: record.description,
            category: record.category,
            emoji: record.emoji,
            specialization: record.specialization,
            tagline: record.tagline,
            webhook_url: record.webhook_url,
            avatar_url: record.avatar_url,
            is_enabled: record.is_enabled,
            admin_only: record.admin_only,
            is_default: record.is_default,
            display_order: record.display_order,
            updated_at: new Date().toISOString()
          })
          .eq('agent_id', record.agent_id);

        if (error) {
          console.error(`❌ Error updating ${record.agent_id} in agents table:`, error.message);
        } else {
          console.log(`  ✅ Updated: ${record.agent_id}`);
        }
      } else {
        const { error } = await supabase
          .from('agents')
          .insert(record);

        if (error) {
          console.error(`❌ Error inserting ${record.agent_id} in agents table:`, error.message);
        } else {
          console.log(`  ✅ Inserted: ${record.agent_id}`);
        }
      }
    } catch (err) {
      console.error(`❌ Error syncing ${record.agent_id} to agents table:`, err.message);
    }
  }

  console.log(`✅ Synced ${agentRecords.length} agents to database`);

  // ============================================
  // CLEANUP: Remove agents from DB that are not in YAML configs
  // ============================================
  const yamlAgentIds = agentRecords.map(r => r.agent_id);
  
  try {
    const { data: dbAgents, error: fetchError } = await supabase
      .from('agents')
      .select('agent_id');
    
    if (fetchError) {
      console.error('❌ Error fetching agents for cleanup:', fetchError.message);
    } else if (dbAgents) {
      const orphanedAgents = dbAgents.filter(
        dbAgent => !yamlAgentIds.includes(dbAgent.agent_id)
      );
      
      if (orphanedAgents.length > 0) {
        console.log('🧹 Cleaning up orphaned agents from database...');
        for (const orphan of orphanedAgents) {
          const { error: deleteError } = await supabase
            .from('agents')
            .delete()
            .eq('agent_id', orphan.agent_id);
          
          if (deleteError) {
            console.error(`  ❌ Error deleting ${orphan.agent_id}:`, deleteError.message);
          } else {
            console.log(`  🗑️  Deleted: ${orphan.agent_id}`);
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
 * Build-time script to pre-compile all YAML agents into optimized JSON
 * This eliminates runtime YAML parsing and reduces HTTP requests
 */
async function buildAgents() {
  try {
    const agentsDir = path.join(__dirname, '../agents');
    const outputFile = path.join(__dirname, '../client/data/agents.ts');
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    
    // Read all directories in the agents folder
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    const agentFolders = entries.filter(entry => 
      entry.isDirectory() && entry.name !== 'shared'
    );
    
    const agents = [];
    const agentMap = {};
    
    // Parse config.yaml from each agent folder
    for (const folder of agentFolders) {
      try {
        const configPath = path.join(agentsDir, folder.name, 'config.yaml');
        const content = await fs.readFile(configPath, 'utf8');
        const config = yaml.load(content);
        
        // Only include valid agent configs
        if (config && config.agent && config.agent.id) {
          agents.push(config);
          agentMap[config.agent.id] = config;
        }
      } catch (error) {
        // Skip folders without config.yaml
      }
    }
    
    // Sort agents by category and name
    agents.sort((a, b) => {
      if (a.agent.category !== b.agent.category) {
        return a.agent.category.localeCompare(b.agent.category);
      }
      // Pinned agents come first within their category
      if (a.agent.pinned !== b.agent.pinned) {
        return a.agent.pinned ? -1 : 1;
      }
      return a.agent.name.localeCompare(b.agent.name);
    });
    
    // Group by category
    const categories = {};
    agents.forEach(agent => {
      const category = agent.agent.category.toUpperCase();
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(agent);
    });
    
    // Generate TypeScript file with all data
    const tsContent = `// Auto-generated at build time - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}

export interface AgentConfig {
  agent: {
    id: string;
    name: string;
    emoji?: string;
    category: string;
    description: string;
    specialization?: string;
    tagline?: string;
    avatar?: string;
    pinned?: boolean;
    enabled?: boolean;
    admin_only?: boolean;
    uses_conversation_state?: boolean;
    initial_message?: string;
    sidebar_greeting?: string;
    capabilities?: string[];
    recent_actions?: string[];
  };
  n8n: {
    webhook_url: string;
  };
  ui?: {
    page_type: string;
    pages?: any[];
  };
  ui_use?: {
    pages: any[];
    default_page?: string;
    navigation_type?: string;
  };
  interface?: {
    type: string;
    features?: string[];
  };
  suggestions?: string[];
  personality?: {
    tone: string;
    style: string;
    approach: string;
  };
}

// All agents (pre-sorted)
export const ALL_AGENTS: AgentConfig[] = ${JSON.stringify(agents, null, 2)};

// Agents by ID (for fast lookup)
export const AGENTS_BY_ID: Record<string, AgentConfig> = ${JSON.stringify(agentMap, null, 2)};

// Agents by category (pre-grouped)
export const AGENTS_BY_CATEGORY: Record<string, AgentConfig[]> = ${JSON.stringify(categories, null, 2)};

// Agent IDs list
export const AGENT_IDS: string[] = ${JSON.stringify(Object.keys(agentMap))};

// Total count
export const TOTAL_AGENTS = ${agents.length};
`;
    
    await fs.writeFile(outputFile, tsContent);
    
    // Also generate a simple JSON version for external use
    const jsonOutput = path.join(__dirname, '../public/agents-compiled.json');
    await fs.writeFile(jsonOutput, JSON.stringify({
      agents,
      agentMap,
      categories,
      meta: {
        total: agents.length,
        buildTime: new Date().toISOString()
      }
    }, null, 2));

    // Sync agents to Supabase database
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
