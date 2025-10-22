#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateAgentsJson() {
  try {
    const configDir = path.join(__dirname, '../agents/configs');
    const outputDir = path.join(__dirname, '../public');
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Read all YAML files
    const files = await fs.readdir(configDir);
    const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    const agents = [];
    
    // Parse each YAML file
    for (const file of yamlFiles) {
      // Skip template files
      if (file.includes('template')) continue;
      
      try {
        const filePath = path.join(configDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const config = yaml.load(content);
        
        // Only include valid agent configs
        if (config && config.agent && config.agent.id) {
          agents.push(config);
        }
      } catch (error) {
        console.warn(`Failed to parse ${file}:`, error);
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
    
    // Write agents list
    await fs.writeFile(
      path.join(outputDir, 'agents.json'), 
      JSON.stringify(agents, null, 2)
    );
    
    // Write individual agent configs
    const agentConfigsDir = path.join(outputDir, 'agent-configs');
    await fs.mkdir(agentConfigsDir, { recursive: true });
    
    for (const agent of agents) {
      await fs.writeFile(
        path.join(agentConfigsDir, `${agent.agent.id}.json`),
        JSON.stringify(agent, null, 2)
      );
    }
    
    console.log(`✅ Generated static agent data for ${agents.length} agents`);
    console.log(`📁 Output: public/agents.json and public/agent-configs/`);
    
  } catch (error) {
    console.error('❌ Failed to generate agents JSON:', error);
    process.exit(1);
  }
}

generateAgentsJson();