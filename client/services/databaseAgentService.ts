/**
 * Database Agent Service
 * 
 * Fetches available agents from the platform's Supabase `agents` table.
 * Each platform (squidgy, yeaa, etc.) has its own Supabase instance with its own agents table.
 * The agents table controls which agents are AVAILABLE on that platform.
 * Agent configuration/behavior comes from YAML files (compiled to agents.ts).
 */

import { supabase, getSupabaseClient } from '../lib/supabase';
import { AGENTS_BY_ID, type AgentConfig } from '../data/agents';

export interface DatabaseAgent {
  id: string;
  agent_id: string;
  name: string;
  category: string;
  description: string;
  avatar_url: string | null;
  page_type: string;
  figma_url: string | null;
  generated_component_path: string | null;
  n8n_webhook_url: string | null;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export class DatabaseAgentService {
  private static instance: DatabaseAgentService;
  private cachedAgents: DatabaseAgent[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): DatabaseAgentService {
    if (!DatabaseAgentService.instance) {
      DatabaseAgentService.instance = new DatabaseAgentService();
    }
    return DatabaseAgentService.instance;
  }

  /**
   * Fetch available agents from the database
   * Returns only enabled agents, sorted by display_order
   */
  async fetchAvailableAgents(): Promise<DatabaseAgent[]> {
    // Check cache
    if (this.cachedAgents && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return this.cachedAgents;
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('agents')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching agents from database:', error);
        return [];
      }

      this.cachedAgents = data || [];
      this.cacheTimestamp = Date.now();
      
      console.log(`📦 Loaded ${this.cachedAgents.length} agents from database`);
      return this.cachedAgents;
    } catch (error) {
      console.error('Failed to fetch agents from database:', error);
      return [];
    }
  }

  /**
   * Get available agent IDs from the database
   */
  async getAvailableAgentIds(): Promise<string[]> {
    const agents = await this.fetchAvailableAgents();
    return agents.map(a => a.agent_id);
  }

  /**
   * Check if an agent is available on this platform
   */
  async isAgentAvailable(agentId: string): Promise<boolean> {
    const agents = await this.fetchAvailableAgents();
    return agents.some(a => a.agent_id === agentId && a.is_enabled);
  }

  /**
   * Get full agent config by merging database record with YAML config
   * Database controls availability, YAML provides full configuration
   */
  async getAgentConfig(agentId: string): Promise<AgentConfig | null> {
    const isAvailable = await this.isAgentAvailable(agentId);
    if (!isAvailable) {
      console.log(`Agent ${agentId} is not available on this platform`);
      return null;
    }

    // Get full config from YAML-compiled data
    const yamlConfig = AGENTS_BY_ID[agentId];
    if (!yamlConfig) {
      console.warn(`Agent ${agentId} exists in database but not in YAML configs`);
      return null;
    }

    return yamlConfig;
  }

  /**
   * Get all available agents with full configs
   * Filters YAML configs by what's available in the database
   */
  async getAllAvailableAgents(): Promise<AgentConfig[]> {
    const dbAgents = await this.fetchAvailableAgents();
    const availableConfigs: AgentConfig[] = [];

    for (const dbAgent of dbAgents) {
      const yamlConfig = AGENTS_BY_ID[dbAgent.agent_id];
      if (yamlConfig) {
        // Optionally override some fields from database
        const mergedConfig = {
          ...yamlConfig,
          // Database can override n8n webhook URL if specified
          n8n: {
            ...yamlConfig.n8n,
            webhook_url: dbAgent.n8n_webhook_url || yamlConfig.n8n.webhook_url
          }
        };
        availableConfigs.push(mergedConfig);
      } else {
        console.warn(`Agent ${dbAgent.agent_id} in database but not in YAML configs`);
      }
    }

    return availableConfigs;
  }

  /**
   * Get agents grouped by category (only available ones)
   */
  async getAgentsByCategory(): Promise<Record<string, AgentConfig[]>> {
    const agents = await this.getAllAvailableAgents();
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
   * Clear the cache (call when agents are updated)
   */
  clearCache(): void {
    this.cachedAgents = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Force refresh agents from database
   */
  async refreshAgents(): Promise<DatabaseAgent[]> {
    this.clearCache();
    return this.fetchAvailableAgents();
  }
}

export default DatabaseAgentService;
