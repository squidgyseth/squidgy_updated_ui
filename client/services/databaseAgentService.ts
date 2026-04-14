import { supabase } from '@/lib/supabase';

export interface DatabaseAgentConfig {
  agent_id: string;
  name: string;
  emoji?: string;
  category: string;
  description: string;
  specialization?: string;
  tagline?: string;
  avatar_url?: string;
  pinned?: boolean;
  enabled?: boolean;
  admin_only?: boolean;
  is_default?: boolean;
  display_order?: number;
  initial_message?: string;
  sidebar_greeting?: string;
  capabilities?: string[];
  recent_actions?: string[];
  skills?: Array<{
    name: string;
    description: string;
    file?: string;
  }>;
  ui_config?: any;
  interface_config?: {
    type: string;
    features?: string[];
  };
  suggestions?: string[];
  personality?: {
    tone: string;
    style: string;
    approach: string;
  };
  webhook_url: string;
  uses_conversation_state?: boolean;
  platforms?: any;
  domain_config?: any;
  raw_config?: any;
  updated_at?: string;
}

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
  ui?: any;
  ui_use?: any;
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
  skills?: Array<{
    name: string;
    description: string;
    file?: string;
  }>;
  platforms?: any;
  solar_config?: any;
  domain_config?: any;
}

class DatabaseAgentService {
  private static instance: DatabaseAgentService;
  private agentsCache: AgentConfig[] | null = null;
  private agentsByIdCache: Record<string, AgentConfig> = {};
  private agentsByCategoryCache: Record<string, AgentConfig[]> = {};
  private lastFetchTime: number = 0;
  private cacheDuration: number = 60000; // 1 minute cache

  private constructor() {}

  static getInstance(): DatabaseAgentService {
    if (!DatabaseAgentService.instance) {
      DatabaseAgentService.instance = new DatabaseAgentService();
    }
    return DatabaseAgentService.instance;
  }

  /**
   * Transform database record to AgentConfig format (matches YAML structure)
   */
  private transformToAgentConfig(dbAgent: DatabaseAgentConfig): AgentConfig {
    return {
      agent: {
        id: dbAgent.agent_id,
        name: dbAgent.name,
        emoji: dbAgent.emoji,
        category: dbAgent.category,
        description: dbAgent.description,
        specialization: dbAgent.specialization,
        tagline: dbAgent.tagline,
        avatar: dbAgent.avatar_url,
        pinned: dbAgent.pinned,
        enabled: dbAgent.enabled,
        admin_only: dbAgent.admin_only,
        uses_conversation_state: dbAgent.uses_conversation_state,
        initial_message: dbAgent.initial_message,
        sidebar_greeting: dbAgent.sidebar_greeting,
        capabilities: dbAgent.capabilities,
        recent_actions: dbAgent.recent_actions,
      },
      n8n: {
        webhook_url: dbAgent.webhook_url,
      },
      ui: dbAgent.ui_config?.page_type ? dbAgent.ui_config : undefined,
      ui_use: dbAgent.ui_config?.pages ? dbAgent.ui_config : undefined,
      interface: dbAgent.interface_config,
      suggestions: dbAgent.suggestions,
      personality: dbAgent.personality,
      skills: dbAgent.skills,
      platforms: dbAgent.platforms,
      domain_config: dbAgent.domain_config,
      solar_config: dbAgent.domain_config,
    };
  }

  /**
   * Fetch all agents from database and cache them
   */
  async fetchAgents(forceRefresh: boolean = false): Promise<AgentConfig[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && this.agentsCache && (now - this.lastFetchTime) < this.cacheDuration) {
      return this.agentsCache;
    }

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_enabled', true)
        .order('pinned', { ascending: false })
        .order('display_order', { ascending: true })
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching agents from database:', error);
        return this.agentsCache || [];
      }

      if (!data || data.length === 0) {
        console.warn('No agents found in database');
        return [];
      }

      // Transform database records to AgentConfig format
      const agents = data.map(dbAgent => this.transformToAgentConfig(dbAgent as DatabaseAgentConfig));

      // Update caches
      this.agentsCache = agents;
      this.agentsByIdCache = {};
      this.agentsByCategoryCache = {};

      agents.forEach(agent => {
        this.agentsByIdCache[agent.agent.id] = agent;
        
        const category = agent.agent.category.toUpperCase();
        if (!this.agentsByCategoryCache[category]) {
          this.agentsByCategoryCache[category] = [];
        }
        this.agentsByCategoryCache[category].push(agent);
      });

      this.lastFetchTime = now;
      return agents;
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      return this.agentsCache || [];
    }
  }

  /**
   * Get all agents (with caching)
   */
  async getAllAgents(forceRefresh: boolean = false): Promise<AgentConfig[]> {
    return this.fetchAgents(forceRefresh);
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<AgentConfig | null> {
    await this.fetchAgents();
    return this.agentsByIdCache[agentId] || null;
  }

  /**
   * Get agents by category
   */
  async getAgentsByCategory(): Promise<Record<string, AgentConfig[]>> {
    await this.fetchAgents();
    return this.agentsByCategoryCache;
  }

  /**
   * Get agents in specific category
   */
  async getAgentsInCategory(category: string): Promise<AgentConfig[]> {
    await this.fetchAgents();
    return this.agentsByCategoryCache[category.toUpperCase()] || [];
  }

  /**
   * Get all agent IDs
   */
  async getAgentIds(): Promise<string[]> {
    await this.fetchAgents();
    return Object.keys(this.agentsByIdCache);
  }

  /**
   * Check if agent exists
   */
  async hasAgent(agentId: string): Promise<boolean> {
    await this.fetchAgents();
    return agentId in this.agentsByIdCache;
  }

  /**
   * Get pinned agents
   */
  async getPinnedAgents(): Promise<AgentConfig[]> {
    const agents = await this.fetchAgents();
    return agents.filter(agent => agent.agent.pinned);
  }

  /**
   * Search agents by name/description
   */
  async searchAgents(query: string): Promise<AgentConfig[]> {
    const agents = await this.fetchAgents();
    const lowQuery = query.toLowerCase();
    return agents.filter(agent => 
      agent.agent.name.toLowerCase().includes(lowQuery) ||
      agent.agent.description.toLowerCase().includes(lowQuery) ||
      (agent.agent.specialization && agent.agent.specialization.toLowerCase().includes(lowQuery))
    );
  }

  /**
   * Get agents count
   */
  async getAgentsCount(): Promise<number> {
    const agents = await this.fetchAgents();
    return agents.length;
  }

  /**
   * Get categories list
   */
  async getCategories(): Promise<string[]> {
    await this.fetchAgents();
    return Object.keys(this.agentsByCategoryCache);
  }

  /**
   * Get visible agents (excludes admin_only)
   */
  async getVisibleAgents(): Promise<AgentConfig[]> {
    const agents = await this.fetchAgents();
    return agents.filter(agent => agent.agent.admin_only !== true);
  }

  /**
   * Get visible agents by category (excludes admin_only)
   */
  async getVisibleAgentsByCategory(): Promise<Record<string, AgentConfig[]>> {
    await this.fetchAgents();
    const visibleCategories: Record<string, AgentConfig[]> = {};
    
    Object.entries(this.agentsByCategoryCache).forEach(([category, agents]) => {
      const visibleAgents = agents.filter(agent => agent.agent.admin_only !== true);
      if (visibleAgents.length > 0) {
        visibleCategories[category] = visibleAgents;
      }
    });
    
    return visibleCategories;
  }

  /**
   * Get visible agents in specific category (excludes admin_only)
   */
  async getVisibleAgentsInCategory(category: string): Promise<AgentConfig[]> {
    await this.fetchAgents();
    const agents = this.agentsByCategoryCache[category.toUpperCase()] || [];
    return agents.filter(agent => agent.agent.admin_only !== true);
  }

  /**
   * Clear cache and force refresh on next fetch
   */
  clearCache(): void {
    this.agentsCache = null;
    this.agentsByIdCache = {};
    this.agentsByCategoryCache = {};
    this.lastFetchTime = 0;
  }

  /**
   * Refresh agents from database
   */
  async refreshAgents(): Promise<AgentConfig[]> {
    return this.fetchAgents(true);
  }
}

export default DatabaseAgentService;
