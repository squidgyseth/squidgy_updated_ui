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
    const configDir = path.join(__dirname, '../../agents/configs');
    
    // Read all YAML files in the configs directory
    const files = await fs.readdir(configDir);
    const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    const agents: AgentConfig[] = [];
    
    // Parse each YAML file
    for (const file of yamlFiles) {
      // Skip template files
      if (file.includes('template')) continue;
      
      try {
        const filePath = path.join(configDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const config = yaml.load(content) as AgentConfig;
        
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
    const configDir = path.join(__dirname, '../../agents/configs');
    
    // Read all YAML files to find the matching agent
    const files = await fs.readdir(configDir);
    const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    for (const file of yamlFiles) {
      // Skip template files
      if (file.includes('template')) continue;
      
      try {
        const filePath = path.join(configDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const config = yaml.load(content) as AgentConfig;
        
        // Check if this is the requested agent
        if (config && config.agent && config.agent.id === agentId) {
          return res.json(config);
        }
      } catch (error) {
        console.warn(`Failed to parse ${file}:`, error);
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
    const configDir = path.join(__dirname, '../../agents/configs');
    
    // Read all YAML files
    const files = await fs.readdir(configDir);
    const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    const categories: Record<string, AgentConfig[]> = {};
    
    // Parse each YAML file and group by category
    for (const file of yamlFiles) {
      // Skip template files
      if (file.includes('template')) continue;
      
      try {
        const filePath = path.join(configDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const config = yaml.load(content) as AgentConfig;
        
        if (config && config.agent && config.agent.id) {
          const category = config.agent.category.toUpperCase();
          
          if (!categories[category]) {
            categories[category] = [];
          }
          
          categories[category].push(config);
        }
      } catch (error) {
        console.warn(`Failed to parse ${file}:`, error);
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
