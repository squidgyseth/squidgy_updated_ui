import type { AgentCarouselConfig, AgentPage } from '../types/carouselTypes';

export interface AgentConfig {
  agent: {
    id: string;
    name: string;
    category: string;
    description: string;
    avatar?: string;
    pinned?: boolean;
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
      // Try to load from API first
      const response = await fetch(`/api/agents/${agentId}/config`);
      if (response.ok) {
        const config = await response.json();
        this.agentConfigs.set(agentId, config);
        return config;
      }
    } catch (error) {
      console.error(`Could not load config for agent ${agentId} from API:`, error);
    }

    // No fallback - return null if API fails
    return null;
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
      const response = await fetch('/api/agents/list');
      if (response.ok) {
        const agents = await response.json();
        console.log('Loaded agents from API:', agents);
        return agents;
      }
    } catch (error) {
      console.error('Could not load agents from API:', error);
    }

    // No fallback - return empty array if API fails
    return [];
  }

  /**
   * Mock agent configuration for development
   */
  private getMockAgentConfig(agentId: string): AgentConfig | null {
    const mockConfigs: Record<string, AgentConfig> = {
      'newsletter': {
        agent: {
          id: 'newsletter',
          name: 'Newsletter Agent',
          category: 'MARKETING',
          description: 'Create and manage newsletters',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter',
          pinned: true
        },
        n8n: {
          webhook_url: 'https://n8n.theaiteam.uk/webhook/newsletter'
        },
        ui: {
          page_type: 'standard'
        },
        ui_use: {
          pages: [
            {
              name: 'Newsletter Page',
              path: '/agents/newsletter/newsletter_liquid_blanch_17032840_page1',
              order: 1,
              validated: true
            }
          ],
          default_page: '/agents/newsletter/newsletter_liquid_blanch_17032840_page1',
          navigation_type: 'none'
        }
      },
      'smm_assistant': {
        agent: {
          id: 'smm_assistant',
          name: 'SMM Assistant',
          category: 'MARKETING',
          description: 'Social media marketing specialist',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=smm'
        },
        n8n: {
          webhook_url: 'https://n8n.example.com/webhook/smm'
        },
        ui: {
          page_type: 'multi_page'
        },
        ui_use: {
          pages: [
            {
              name: 'Dashboard',
              path: '/agents/smm_assistant/dashboard',
              order: 1,
              validated: true
            },
            {
              name: 'Analytics',
              path: '/agents/smm_assistant/analytics',
              order: 2,
              validated: true
            },
            {
              name: 'Content Creator',
              path: '/agents/smm_assistant/content',
              order: 3,
              validated: true
            },
            {
              name: 'Reports',
              path: '/agents/smm_assistant/reports',
              order: 4,
              validated: false
            }
          ],
          default_page: '/agents/smm_assistant/dashboard',
          navigation_type: 'tabs'
        }
      },
      'test_multiagent': {
        agent: {
          id: 'test_multiagent',
          name: 'Test Multi-Agent',
          category: 'MARKETING',
          description: 'Testing multi-agent functionality'
        },
        n8n: {
          webhook_url: 'https://n8n.example.com/webhook/test'
        },
        ui: {
          page_type: 'multi_page'
        },
        ui_use: {
          pages: [
            {
              name: 'Main Page',
              path: '/agents/test_multiagent/main',
              order: 1,
              validated: true
            }
          ],
          default_page: '/agents/test_multiagent/main',
          navigation_type: 'none'
        }
      }
    };

    return mockConfigs[agentId] || null;
  }

  /**
   * Mock agents list for development
   */
  private getMockAgentsList(): AgentConfig[] {
    return [
      this.getMockAgentConfig('newsletter')!,
      this.getMockAgentConfig('smm_assistant')!,
      this.getMockAgentConfig('test_multiagent')!,
      {
        agent: {
          id: 'lead_generator',
          name: 'Lead Generator',
          category: 'SALES',
          description: 'Find leads fast'
        },
        n8n: {
          webhook_url: 'https://n8n.example.com/webhook/leads'
        },
        ui: {
          page_type: 'standard'
        }
      },
      {
        agent: {
          id: 'crm_updater',
          name: 'CRM Updater',
          category: 'SALES',
          description: 'Keep data clean'
        },
        n8n: {
          webhook_url: 'https://n8n.example.com/webhook/crm'
        },
        ui: {
          page_type: 'standard'
        }
      }
    ];
  }

  /**
   * Clear cached configurations
   */
  clearCache(): void {
    this.agentConfigs.clear();
    this.carouselConfigs.clear();
  }
}