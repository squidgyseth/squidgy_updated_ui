#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Upsert agents to Supabase personal_assistant_config table
 * Only upserts records with config_type = 'assistants'
 */
async function upsertAgentsToSupabase(agents) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not found - skipping database sync');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Transform agents to personal_assistant_config format
  const records = agents.map(agent => ({
    config_type: 'assistants',
    code: agent.agent.id,
    display_name: agent.agent.name,
    emoji: agent.agent.emoji || '🤖',
    description: agent.agent.description || null,
    category: agent.agent.category || 'General'
  }));

  console.log(`\n🔄 Syncing ${records.length} agents to Supabase...`);

  // Upsert each record (based on config_type + code unique constraint)
  for (const record of records) {
    try {
      const { error } = await supabase
        .from('personal_assistant_config')
        .upsert(record, {
          onConflict: 'config_type,code',
          ignoreDuplicates: false
        });

      if (error) {
        console.warn(`⚠️  Failed to upsert ${record.code}:`, error.message);
      } else {
        console.log(`   ✓ ${record.emoji} ${record.display_name} (${record.code})`);
      }
    } catch (err) {
      console.warn(`⚠️  Error upserting ${record.code}:`, err.message);
    }
  }

  console.log(`✅ Database sync complete\n`);
}

/**
 * Build-time script to pre-compile all YAML agents into optimized JSON
 * This eliminates runtime YAML parsing and reduces HTTP requests
 */
async function buildAgents() {
  try {
    const configDir = path.join(__dirname, '../agents/configs');
    const outputFile = path.join(__dirname, '../client/data/agents.ts');
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    
    // Read all YAML files
    const files = await fs.readdir(configDir);
    const yamlFiles = files.filter(file => 
      (file.endsWith('.yaml') || file.endsWith('.yml')) && 
      !file.includes('template')
    );
    
    const agents = [];
    const agentMap = {};
    
    // Parse each YAML file
    for (const file of yamlFiles) {
      try {
        const filePath = path.join(configDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const config = yaml.load(content);
        
        // Only include valid agent configs
        if (config && config.agent && config.agent.id) {
          agents.push(config);
          agentMap[config.agent.id] = config;
        }
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error.message);
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
    
    console.log(`✅ Built ${agents.length} agents into optimized TypeScript module`);
    console.log(`📁 Output: ${outputFile}`);
    console.log(`🚀 Performance: Single import, zero runtime parsing, instant access`);
    
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
    
    console.log(`📋 Also generated JSON: ${jsonOutput}`);

    // Sync agents to Supabase database
    await upsertAgentsToSupabase(agents);

  } catch (error) {
    console.error('❌ Failed to build agents:', error);
    process.exit(1);
  }
}

buildAgents();