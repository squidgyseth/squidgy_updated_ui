import { 
  ALL_AGENTS, 
  AGENTS_BY_ID, 
  AGENTS_BY_CATEGORY, 
  AGENT_IDS,
  type AgentConfig 
} from '../data/agents';

/**
 * Ultra-fast agent service using pre-compiled data
 * Zero HTTP requests, zero runtime parsing, instant access
 */
export class OptimizedAgentService {
  private static instance: OptimizedAgentService;

  private constructor() {
    // Data is already loaded at import time - instant!
  }

  static getInstance(): OptimizedAgentService {
    if (!OptimizedAgentService.instance) {
      OptimizedAgentService.instance = new OptimizedAgentService();
    }
    return OptimizedAgentService.instance;
  }

  /**
   * Get all agents (already sorted) - O(1)
   */
  getAllAgents(): AgentConfig[] {
    return ALL_AGENTS;
  }

  /**
   * Get agent by ID - O(1) lookup
   */
  getAgentById(agentId: string): AgentConfig | null {
    return AGENTS_BY_ID[agentId] || null;
  }

  /**
   * Get agents by category - O(1) lookup
   */
  getAgentsByCategory(): Record<string, AgentConfig[]> {
    return AGENTS_BY_CATEGORY;
  }

  /**
   * Get agents in specific category - O(1) lookup
   */
  getAgentsInCategory(category: string): AgentConfig[] {
    return AGENTS_BY_CATEGORY[category.toUpperCase()] || [];
  }

  /**
   * Get all agent IDs - O(1)
   */
  getAgentIds(): string[] {
    return AGENT_IDS;
  }

  /**
   * Check if agent exists - O(1)
   */
  hasAgent(agentId: string): boolean {
    return agentId in AGENTS_BY_ID;
  }

  /**
   * Get pinned agents - O(n) but cached
   */
  getPinnedAgents(): AgentConfig[] {
    return ALL_AGENTS.filter(agent => agent.agent.pinned);
  }

  /**
   * Search agents by name/description - O(n) but fast
   */
  searchAgents(query: string): AgentConfig[] {
    const lowQuery = query.toLowerCase();
    return ALL_AGENTS.filter(agent => 
      agent.agent.name.toLowerCase().includes(lowQuery) ||
      agent.agent.description.toLowerCase().includes(lowQuery) ||
      (agent.agent.specialization && agent.agent.specialization.toLowerCase().includes(lowQuery))
    );
  }

  /**
   * Get agents count - O(1)
   */
  getAgentsCount(): number {
    return ALL_AGENTS.length;
  }

  /**
   * Get categories list - O(1)
   */
  getCategories(): string[] {
    return Object.keys(AGENTS_BY_CATEGORY);
  }

  /**
   * Get agents visible to regular users (excludes admin_only agents) - O(n) but cached
   */
  getVisibleAgents(): AgentConfig[] {
    return ALL_AGENTS.filter(agent => agent.agent.admin_only !== true);
  }

  /**
   * Get agents by category, filtered for regular users (excludes admin_only) - O(n)
   */
  getVisibleAgentsByCategory(): Record<string, AgentConfig[]> {
    const visibleCategories: Record<string, AgentConfig[]> = {};
    
    Object.entries(AGENTS_BY_CATEGORY).forEach(([category, agents]) => {
      const visibleAgents = agents.filter(agent => agent.agent.admin_only !== true);
      if (visibleAgents.length > 0) {
        visibleCategories[category] = visibleAgents;
      }
    });
    
    return visibleCategories;
  }

  /**
   * Get visible agents in specific category (excludes admin_only) - O(n)
   */
  getVisibleAgentsInCategory(category: string): AgentConfig[] {
    const agents = AGENTS_BY_CATEGORY[category.toUpperCase()] || [];
    return agents.filter(agent => agent.agent.admin_only !== true);
  }
}

export default OptimizedAgentService;
