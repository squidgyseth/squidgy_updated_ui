import yaml from 'js-yaml';

interface AgentConfig {
  agent: {
    id: string;
    name: string;
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

class YamlAgentLoader {
  private static instance: YamlAgentLoader;
  private agentConfigs: Map<string, AgentConfig> = new Map();
  private allAgents: AgentConfig[] = [];
  private loaded = false;

  private constructor() {}

  static getInstance(): YamlAgentLoader {
    if (!YamlAgentLoader.instance) {
      YamlAgentLoader.instance = new YamlAgentLoader();
    }
    return YamlAgentLoader.instance;
  }

  /**
   * Load all agent configurations from YAML files
   */
  async loadAllAgents(): Promise<AgentConfig[]> {
    if (this.loaded && this.allAgents.length > 0) {
      return this.allAgents;
    }

    const agentIds = [
      'personal_assistant',
      'newsletter', 
      'smm_assistant',
      'content_repurposer',
      'social_media_scheduler',
      'test_multi_agent',
      'test_multi_page_agent'
    ];

    const agents: AgentConfig[] = [];

    for (const agentId of agentIds) {
      try {
        const agent = await this.loadAgentConfig(agentId);
        if (agent) {
          agents.push(agent);
        }
      } catch (error) {
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

    this.allAgents = agents;
    this.loaded = true;
    
    return agents;
  }

  /**
   * Load a specific agent configuration
   */
  async loadAgentConfig(agentId: string): Promise<AgentConfig | null> {
    if (this.agentConfigs.has(agentId)) {
      return this.agentConfigs.get(agentId)!;
    }

    try {
      // Fetch the YAML file directly from the original agents folder
      const response = await fetch(`/agents/configs/${agentId}.yaml`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${agentId}.yaml: ${response.status}`);
      }

      const yamlContent = await response.text();
      const config = yaml.load(yamlContent) as AgentConfig;

      if (config && config.agent && config.agent.id) {
        this.agentConfigs.set(agentId, config);
        return config;
      }

      throw new Error(`Invalid agent configuration in ${agentId}.yaml`);
    } catch (error) {
      console.error(`Failed to load agent config for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Get agents grouped by category
   */
  async getAgentsByCategory(): Promise<Record<string, AgentConfig[]>> {
    const agents = await this.loadAllAgents();
    const categories: Record<string, AgentConfig[]> = {};

    agents.forEach(agent => {
      const category = agent.agent.category.toUpperCase();
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(agent);
    });

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

    return categories;
  }

  /**
   * Clear cache to force reload
   */
  clearCache(): void {
    this.agentConfigs.clear();
    this.allAgents = [];
    this.loaded = false;
  }
}

export default YamlAgentLoader;
export type { AgentConfig };
