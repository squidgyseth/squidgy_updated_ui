import { 
  ALL_AGENTS, 
  AGENTS_BY_ID, 
  AGENTS_BY_CATEGORY, 
  AGENT_IDS,
  type AgentConfig 
} from '../data/agents';
import { getSupabaseClient } from '../lib/supabase';
import { getPlatform, detectPlatformFromUrl } from '../config/platforms';

interface DatabaseAgent {
  id: string;
  agent_id: string;
  name: string;
  category: string;
  description: string;
  avatar_url: string | null;
  n8n_webhook_url: string | null;
  is_enabled: boolean;
  display_order: number;
}

/**
 * Optimized Agent Service
 * 
 * All agents are compiled from YAML files (available in ALL_AGENTS, AGENTS_BY_ID).
 * The platform's Supabase `agents` table controls which agents are AVAILABLE.
 * Only agents listed in the database table are displayed/accessible.
 */
export class OptimizedAgentService {
  private static instance: OptimizedAgentService;
  
  // Database availability cache
  private availableAgentIds: Set<string> | null = null;
  private availableAgentsMap: Map<string, DatabaseAgent> = new Map();
  private cacheTimestamp: number = 0;
  private cachedPlatformId: string | null = null; // Track which platform we loaded for
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): OptimizedAgentService {
    if (!OptimizedAgentService.instance) {
      OptimizedAgentService.instance = new OptimizedAgentService();
    }
    return OptimizedAgentService.instance;
  }

  /**
   * Load available agents from database
   * Call this on app init to pre-load available agents
   * @param platformId - Optional platform ID to track cache invalidation
   */
  async loadAvailableAgents(platformId?: string): Promise<void> {
    // Prevent multiple simultaneous loads
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Check if platform changed - invalidate cache if so
    if (platformId && this.cachedPlatformId && platformId !== this.cachedPlatformId) {
      console.log(`🔄 Platform changed from ${this.cachedPlatformId} to ${platformId}, refreshing agents...`);
      this.availableAgentIds = null;
      this.availableAgentsMap.clear();
      this.cacheTimestamp = 0;
    }

    // Check cache
    if (this.availableAgentIds && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return;
    }

    this.isLoading = true;
    this.cachedPlatformId = platformId || null;
    this.loadPromise = this._fetchAvailableAgents();
    
    try {
      await this.loadPromise;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  private async _fetchAvailableAgents(): Promise<void> {
    try {
      const platformId = this.cachedPlatformId || detectPlatformFromUrl();
      
      // Each platform has its own Supabase instance with its own agents table
      // The getSupabaseClient() returns the correct client based on current platform
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('agents')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        // Database has agents - use them
        this.availableAgentIds = new Set(data.map(a => a.agent_id));
        this.availableAgentsMap = new Map(data.map(a => [a.agent_id, a]));
        this.cacheTimestamp = Date.now();
        console.log(`📦 Platform ${platformId} has ${this.availableAgentIds.size} available agents from database:`, Array.from(this.availableAgentIds));
        return;
      }

      if (error) {
        console.error('Error fetching agents from database:', error);
      }

      // Fallback to platform config if database is empty or errored
      const platform = getPlatform(platformId);
      if (platform && platform.agents !== 'all' && Array.isArray(platform.agents)) {
        console.log(`🎯 Fallback: Using platform config agents for ${platformId}:`, platform.agents);
        this.availableAgentIds = new Set(platform.agents);
        this.availableAgentsMap.clear();
        this.cacheTimestamp = Date.now();
        console.log(`📦 Platform ${platformId} has ${this.availableAgentIds.size} available agents from config`);
        return;
      }

      // Ultimate fallback - allow all agents
      console.log(`⚠️ No agents found in database or config for ${platformId}, allowing all agents`);
      this.availableAgentIds = null;
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // On error, allow all agents (fallback)
      this.availableAgentIds = null;
    }
  }

  /**
   * Check if agent is available on this platform
   */
  isAgentAvailable(agentId: string): boolean {
    // If not loaded yet or error, allow all (fallback)
    if (this.availableAgentIds === null) {
      return true;
    }
    return this.availableAgentIds.has(agentId);
  }

  /**
   * Get all agents - filtered by platform availability
   */
  getAllAgents(): AgentConfig[] {
    if (this.availableAgentIds === null) {
      // Not loaded yet, return all
      return ALL_AGENTS;
    }
    
    // Filter and sort by database display_order
    const filtered = ALL_AGENTS.filter(agent => 
      this.availableAgentIds!.has(agent.agent.id)
    );
    
    // Sort by display_order from database
    return filtered.sort((a, b) => {
      const orderA = this.availableAgentsMap.get(a.agent.id)?.display_order ?? 999;
      const orderB = this.availableAgentsMap.get(b.agent.id)?.display_order ?? 999;
      return orderA - orderB;
    });
  }

  /**
   * Get agent by ID - returns null if not available on platform
   */
  getAgentById(agentId: string): AgentConfig | null {
    const config = AGENTS_BY_ID[agentId];
    if (!config) return null;
    
    // Check platform availability
    if (!this.isAgentAvailable(agentId)) {
      return null;
    }
    
    return config;
  }

  /**
   * Get agent by ID - ignores platform availability (for internal use)
   */
  getAgentByIdRaw(agentId: string): AgentConfig | null {
    return AGENTS_BY_ID[agentId] || null;
  }

  /**
   * Get agents by category - filtered by platform availability
   */
  getAgentsByCategory(): Record<string, AgentConfig[]> {
    const agents = this.getAllAgents();
    const byCategory: Record<string, AgentConfig[]> = {};
    
    for (const agent of agents) {
      const category = agent.agent.category.toUpperCase();
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(agent);
    }
    
    return byCategory;
  }

  /**
   * Get agents in specific category - filtered by platform availability
   */
  getAgentsInCategory(category: string): AgentConfig[] {
    const allInCategory = AGENTS_BY_CATEGORY[category.toUpperCase()] || [];
    
    if (this.availableAgentIds === null) {
      return allInCategory;
    }
    
    return allInCategory.filter(agent => 
      this.availableAgentIds!.has(agent.agent.id)
    );
  }

  /**
   * Get all agent IDs - filtered by platform availability
   */
  getAgentIds(): string[] {
    if (this.availableAgentIds === null) {
      return AGENT_IDS;
    }
    return Array.from(this.availableAgentIds);
  }

  /**
   * Check if agent exists in compiled configs
   */
  hasAgent(agentId: string): boolean {
    return agentId in AGENTS_BY_ID;
  }

  /**
   * Get pinned agents - filtered by platform availability
   */
  getPinnedAgents(): AgentConfig[] {
    return this.getAllAgents().filter(agent => agent.agent.pinned);
  }

  /**
   * Search agents by name/description - filtered by platform availability
   */
  searchAgents(query: string): AgentConfig[] {
    const lowQuery = query.toLowerCase();
    return this.getAllAgents().filter(agent => 
      agent.agent.name.toLowerCase().includes(lowQuery) ||
      agent.agent.description.toLowerCase().includes(lowQuery) ||
      (agent.agent.specialization && agent.agent.specialization.toLowerCase().includes(lowQuery))
    );
  }

  /**
   * Get agents count - filtered by platform availability
   */
  getAgentsCount(): number {
    return this.getAllAgents().length;
  }

  /**
   * Get categories list - only categories with available agents
   */
  getCategories(): string[] {
    return Object.keys(this.getAgentsByCategory());
  }

  /**
   * Clear cache and reload from database
   */
  async refreshAgents(): Promise<void> {
    this.availableAgentIds = null;
    this.availableAgentsMap.clear();
    this.cacheTimestamp = 0;
    await this.loadAvailableAgents();
  }

  /**
   * Check if agents have been loaded from database
   */
  isLoaded(): boolean {
    return this.availableAgentIds !== null;
  }
}

export default OptimizedAgentService;