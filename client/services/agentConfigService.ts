import type { AgentCarouselConfig, AgentPage } from '../types/carouselTypes';

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
  getMockAgentConfig(agentId: string): AgentConfig | null {
    const mockConfigs: Record<string, AgentConfig> = {
      'newsletter': {
        agent: {
          id: 'newsletter',
          name: 'Newsletter Agent',
          category: 'MARKETING',
          description: 'Create and manage newsletters',
          specialization: 'Creative & Trendy',
          tagline: 'Content. Create. Distribute.',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter',
          pinned: true,
          capabilities: [
            'Content creation and optimization for newsletters',
            'PDF document processing and analysis',
            'Speech-to-text content input',
            'Newsletter template generation',
            'Email marketing best practices'
          ],
          recent_actions: [
            'Generated newsletter for Q4 product launch',
            'Processed PDF content from marketing materials',
            'Analyzed competitor newsletter performance'
          ]
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
          specialization: 'Creative & Trendy',
          tagline: 'Trend. Post. Analyze.',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=smm',
          capabilities: [
            'Content creation and optimization for all major social platforms',
            'Trend analysis and hashtag research',
            'Social media strategy development and planning',
            'Engagement optimization and community management'
          ],
          recent_actions: [
            'Created 15 Instagram post ideas for fashion brand',
            'Analysed competitor performance',
            'Generated trending hashtags for Q4 campaign'
          ]
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
      },
      'personal_assistant': {
        agent: {
          id: 'personal_assistant',
          name: 'Personal Assistant',
          category: 'GENERAL',
          description: 'Your versatile personal assistant ready to help with any task, from scheduling and organization to research and general support.',
          specialization: 'Always Ready to Help',
          tagline: 'Organize. Schedule. Support.',
          avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64',
          capabilities: [
            'Task management and scheduling coordination',
            'Research and information gathering', 
            'Email drafting and communication support',
            'Document organization and file management',
            'Calendar management and appointment scheduling',
            'Travel planning and logistics coordination'
          ],
          recent_actions: [
            'Organized calendar for next week\'s meetings',
            'Researched market trends for quarterly report',
            'Drafted follow-up emails for client meetings', 
            'Scheduled team meetings for project kickoff'
          ]
        },
        n8n: {
          webhook_url: 'https://n8n.theaiteam.uk/webhook/personal_assistant'
        },
        ui: {
          page_type: 'standard'
        },
        ui_use: {
          pages: [
            {
              name: 'Personal Dashboard',
              path: '/agents/personal_assistant/personal_dashboard',
              order: 1,
              validated: true
            }
          ],
          default_page: '/agents/personal_assistant/personal_dashboard',
          navigation_type: 'none'
        }
      },
      'test_multi_agent': {
        agent: {
          id: 'test_multi_agent',
          name: 'Test Multi-Agent',
          category: 'TESTING',
          description: 'Testing multi-agent code generation system with advanced AI capabilities and collaborative workflows.',
          specialization: 'Advanced Testing',
          tagline: 'Test. Generate. Collaborate.',
          avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64',
          capabilities: [
            'Multi-agent code generation and testing',
            'Advanced AI workflow collaboration',
            'System integration testing',
            'Performance optimization and analysis'
          ],
          recent_actions: [
            'Generated test suites for new features',
            'Coordinated multi-agent workflows',
            'Optimized system performance metrics',
            'Validated integration pipelines'
          ]
        },
        n8n: {
          webhook_url: 'https://n8n.theaiteam.uk/webhook/test_multi_agent'
        },
        ui: {
          page_type: 'standard'
        },
        ui_use: {
          pages: [
            {
              name: 'Testing Dashboard',
              path: '/agents/test_multi_agent/dashboard',
              order: 1,
              validated: true
            }
          ],
          default_page: '/agents/test_multi_agent/dashboard',
          navigation_type: 'none'
        }
      },
      'test_multi_page_agent': {
        agent: {
          id: 'test_multi_page_agent',
          name: 'Test Multi-Page Agent',
          category: 'TESTING',
          description: 'Testing multi-page functionality with advanced navigation and complex user interface components.',
          specialization: 'Multi-Page Testing',
          tagline: 'Navigate. Test. Validate.',
          avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64',
          capabilities: [
            'Multi-page navigation testing',
            'Complex UI component validation',
            'User journey optimization',
            'Interface responsiveness testing'
          ],
          recent_actions: [
            'Tested multi-page navigation flows',
            'Validated complex UI components',
            'Optimized user experience paths',
            'Analyzed interface responsiveness'
          ]
        },
        n8n: {
          webhook_url: 'https://n8n.theaiteam.uk/webhook/test_multi_page_agent'
        },
        ui: {
          page_type: 'multi_page'
        },
        ui_use: {
          pages: [
            {
              name: 'Navigation Test',
              path: '/agents/test_multi_page_agent/navigation-test',
              order: 1,
              validated: true
            },
            {
              name: 'UI Validation',
              path: '/agents/test_multi_page_agent/ui-validation',
              order: 2,
              validated: false
            },
            {
              name: 'Performance Analysis',
              path: '/agents/test_multi_page_agent/performance-analysis',
              order: 3,
              validated: true
            }
          ],
          default_page: '/agents/test_multi_page_agent/navigation-test',
          navigation_type: 'carousel'
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