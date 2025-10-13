import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentConfig {
  agent: {
    id: string;
    name: string;
    category: string;
    description: string;
    avatar?: string;
    
    // N8N Configuration
    n8n: {
      webhook_url: string;
    };
    
    // UI Configuration
    ui: {
      page_type: 'standard' | 'figma';
      figma_url?: string;          // For Figma API (original method)
      figma_deployed_url?: string; // For deployed Figma site (new method)
      figma_token?: string;
    };
  };
}

export class AgentConfigParser {
  /**
   * Parse YAML file to agent config
   */
  parseYamlFile(filePath: string): AgentConfig {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      let config = yaml.load(fileContents) as AgentConfig;
      
      // Validate required fields
      this.validateConfig(config);
      
      // Process environment variables
      config = this.processEnvVars(config);
      
      return config;
    } catch (error: any) {
      throw new Error(`Failed to parse YAML file: ${error.message}`);
    }
  }

  /**
   * Parse YAML string to agent config
   */
  parseYamlString(yamlContent: string): AgentConfig {
    try {
      let config = yaml.load(yamlContent) as AgentConfig;
      this.validateConfig(config);
      return this.processEnvVars(config);
    } catch (error: any) {
      throw new Error(`Failed to parse YAML: ${error.message}`);
    }
  }

  /**
   * Validate agent configuration
   */
  private validateConfig(config: AgentConfig) {
    if (!config.agent) {
      throw new Error('Missing "agent" section in config');
    }
    
    const required = ['id', 'name', 'category', 'description'];
    for (const field of required) {
      if (!config.agent[field as keyof typeof config.agent]) {
        throw new Error(`Missing required field: agent.${field}`);
      }
    }
    
    if (!config.agent.n8n?.webhook_url) {
      throw new Error('Missing n8n webhook URL');
    }
    
    if (config.agent.ui?.page_type === 'figma') {
      if (!config.agent.ui.figma_url && !config.agent.ui.figma_deployed_url) {
        throw new Error('Either figma_url or figma_deployed_url required when page_type is "figma"');
      }
    }
  }

  /**
   * Process environment variables in config
   */
  private processEnvVars(config: AgentConfig): AgentConfig {
    const configStr = JSON.stringify(config);
    const processed = configStr.replace(/\${([^}]+)}/g, (match, envVar) => {
      return process.env[envVar] || match;
    });
    return JSON.parse(processed);
  }

  /**
   * Load all agent configs from directory
   */
  loadAllConfigs(dirPath: string): AgentConfig[] {
    const configs: AgentConfig[] = [];
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      return configs;
    }
    
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const filePath = path.join(dirPath, file);
        try {
          const config = this.parseYamlFile(filePath);
          configs.push(config);
        } catch (error) {
          console.error(`Error loading ${file}:`, error);
        }
      }
    }
    
    return configs;
  }
}