import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface for agent configuration
interface AgentConfig {
  agent: {
    id: string;
    name: string;
    category: string;
    description: string;
    avatar?: string;
    pinned?: boolean;
  };
  n8n?: {
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
}

/**
 * Get all agents from YAML configuration files
 */
router.get('/list', async (req, res) => {
  try {
    const agentsDir = path.join(__dirname, '../../agents');
    
    // Read all directories in the agents folder
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    const agentFolders = entries.filter(entry => 
      entry.isDirectory() && entry.name !== 'shared'
    );
    
    const agents: AgentConfig[] = [];
    
    // Parse config.yaml from each agent folder
    for (const folder of agentFolders) {
      try {
        const configPath = path.join(agentsDir, folder.name, 'config.yaml');
        const content = await fs.readFile(configPath, 'utf8');
        const config = yaml.load(content) as AgentConfig;
        
        // Only include valid agent configs
        if (config && config.agent && config.agent.id) {
          agents.push(config);
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
    
    res.json(agents);
  } catch (error) {
    console.error('Error loading agents:', error);
    res.status(500).json({ error: 'Failed to load agents' });
  }
});

/**
 * Get a specific agent configuration
 */
router.get('/:agentId/config', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agentsDir = path.join(__dirname, '../../agents');
    
    // Read all directories in the agents folder
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    const agentFolders = entries.filter(entry => 
      entry.isDirectory() && entry.name !== 'shared'
    );
    
    for (const folder of agentFolders) {
      try {
        const configPath = path.join(agentsDir, folder.name, 'config.yaml');
        const content = await fs.readFile(configPath, 'utf8');
        const config = yaml.load(content) as AgentConfig;
        
        // Check if this is the requested agent
        if (config && config.agent && config.agent.id === agentId) {
          return res.json(config);
        }
      } catch (error) {
        // Skip folders without config.yaml
      }
    }
    
    // Agent not found
    res.status(404).json({ error: `Agent ${agentId} not found` });
  } catch (error) {
    console.error('Error loading agent:', error);
    res.status(500).json({ error: 'Failed to load agent configuration' });
  }
});

/**
 * Get all agents grouped by category
 */
router.get('/categories', async (req, res) => {
  try {
    const agentsDir = path.join(__dirname, '../../agents');
    
    // Read all directories in the agents folder
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    const agentFolders = entries.filter(entry => 
      entry.isDirectory() && entry.name !== 'shared'
    );
    
    const categories: Record<string, AgentConfig[]> = {};
    
    // Parse config.yaml from each agent folder and group by category
    for (const folder of agentFolders) {
      try {
        const configPath = path.join(agentsDir, folder.name, 'config.yaml');
        const content = await fs.readFile(configPath, 'utf8');
        const config = yaml.load(content) as AgentConfig;
        
        if (config && config.agent && config.agent.id) {
          const category = config.agent.category.toUpperCase();
          
          if (!categories[category]) {
            categories[category] = [];
          }
          
          categories[category].push(config);
        }
      } catch (error) {
      }
    }
    
    // Sort agents within each category
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => {
        // Pinned agents come first
        if (a.agent.pinned !== b.agent.pinned) {
          return a.agent.pinned ? -1 : 1;
        }
        return a.agent.name.localeCompare(b.agent.name);
      });
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error loading categories:', error);
    res.status(500).json({ error: 'Failed to load agent categories' });
  }
});

export default router;
