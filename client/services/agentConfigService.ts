import type { AgentCarouselConfig, AgentPage } from '../types/carouselTypes';
import DatabaseAgentService from './databaseAgentService';
import { type AgentConfig as OptimizedAgentConfig } from './databaseAgentService';

export interface AgentConfig {
  agent: {
    id: string;
    name: string;
    category: string;
    description: string;
    specialization?: string;
    tagline?: string;
    avatar?: string;
    pinned?: boolean;
    capabilities?: string[];
    recent_actions?: string[];
  };
  n8n: {
    webhook_url: string;
  };
  ui: {
    page_type: string;
    pages?: AgentPage[];
  };
  ui_use?: {
    pages: AgentPage[];
    default_page?: string;
    navigation_type?: string;
  };
}

export class AgentConfigService {
  private static instance: AgentConfigService;
  private agentConfigs: Map<string, AgentConfig> = new Map();
  private carouselConfigs: Map<string, AgentCarouselConfig> = new Map();

  private constructor() {}

  static getInstance(): AgentConfigService {
    if (!AgentConfigService.instance) {
      AgentConfigService.instance = new AgentConfigService();
    }
    return AgentConfigService.instance;
  }

  /**
   * Load agent configuration from backend or local storage
   */
  async loadAgentConfig(agentId: string): Promise<AgentConfig | null> {
    try {
      const agentService = DatabaseAgentService.getInstance();
      const config = await agentService.getAgentById(agentId);
      
      if (config) {
        this.agentConfigs.set(agentId, config as AgentConfig);
        return config as AgentConfig;
      }
      return null;
    } catch (error) {
      console.error(`Could not load config for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Get carousel configuration for an agent
   */
  async getCarouselConfig(agentId: string): Promise<AgentCarouselConfig | null> {
    if (this.carouselConfigs.has(agentId)) {
      return this.carouselConfigs.get(agentId)!;
    }

    const agentConfig = await this.loadAgentConfig(agentId);
    if (!agentConfig) {
      return null;
    }

    const carouselConfig = this.buildCarouselConfig(agentConfig);
    this.carouselConfigs.set(agentId, carouselConfig);
    
    return carouselConfig;
  }

  /**
   * Build carousel configuration from agent config
   */
  private buildCarouselConfig(agentConfig: AgentConfig): AgentCarouselConfig {
    // Get pages from ui_use section (preferred) or ui section
    const pages = agentConfig.ui_use?.pages || agentConfig.ui?.pages || [];
    
    // Sort pages by order
    const sortedPages = pages.sort((a, b) => a.order - b.order);

    return {
      agentId: agentConfig.agent.id,
      agentName: agentConfig.agent.name,
      category: agentConfig.agent.category,
      pages: sortedPages,
      defaultPage: agentConfig.ui_use?.default_page,
      navigationStyle: this.getNavigationStyle(sortedPages.length),
      autoAdvance: false, // Don't auto-advance by default
      transitionDuration: 300
    };
  }

  /**
   * Determine navigation style based on number of pages
   */
  private getNavigationStyle(pageCount: number): 'arrows' | 'dots' | 'both' | 'none' {
    if (pageCount <= 1) return 'none';
    if (pageCount <= 3) return 'both';
    return 'arrows';
  }

  /**
   * Check if agent has multiple pages
   */
  async isMultiPageAgent(agentId: string): Promise<boolean> {
    const config = await this.getCarouselConfig(agentId);
    return (config?.pages?.length || 0) > 1;
  }

  /**
   * Get all available agents
   */
  async getAllAgents(): Promise<AgentConfig[]> {
    try {
      const agentService = DatabaseAgentService.getInstance();
      const agents = await agentService.getAllAgents();
      return agents as AgentConfig[];
    } catch (error) {
      console.error('Could not load agents:', error);
      return [];
    }
  }


  /**
   * Clear cached configurations
   */
  clearCache(): void {
    this.agentConfigs.clear();
    this.carouselConfigs.clear();
  }
}
