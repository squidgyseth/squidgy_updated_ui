// Auto-generated at build time - DO NOT EDIT MANUALLY
// Generated on: 2025-11-30T19:53:49.513Z

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
    initial_message?: string;
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

// All agents (pre-sorted)
export const ALL_AGENTS: AgentConfig[] = [
  {
    "agent": {
      "id": "personal_assistant",
      "name": "Personal Assistant",
      "category": "GENERAL",
      "description": "Your versatile personal assistant ready to help with any task.",
      "specialization": "Always Ready to Help",
      "tagline": "Organize. Schedule. Support.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
      "pinned": true,
      "capabilities": [
        "Task management and scheduling coordination",
        "Research and information gathering",
        "Email drafting and communication support",
        "Document organization and file management",
        "Calendar management and appointment scheduling",
        "Travel planning and logistics coordination"
      ],
      "recent_actions": [
        "Organized calendar for next week's meetings",
        "Researched market trends for quarterly report",
        "Drafted follow-up emails for client meetings",
        "Scheduled team meetings for project kickoff"
      ]
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Personal Dashboard",
          "path": "personal-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "Help me organize my schedule for this week",
      "Draft a professional email for me",
      "Research latest industry trends",
      "Create a task list for my project",
      "Schedule a meeting with my team",
      "Help me plan my upcoming trip"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/c2fcbad6-abc0-43af-8aa8-d1661ff4461d"
    },
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "proactive"
    }
  },
  {
    "agent": {
      "id": "newsletter",
      "name": "Newsletter Agent",
      "category": "MARKETING",
      "description": "Create and manage newsletters",
      "specialization": "Creative & Trendy",
      "tagline": "Content. Create. Distribute.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter",
      "pinned": true,
      "initial_message": "Hey there! 👋 I'm here to help you create amazing newsletters. Whether you need to write content, design layouts, or analyze performance - I've got you covered. What would you like to work on today?",
      "capabilities": [
        "Content creation and optimization for newsletters",
        "PDF document processing and analysis",
        "Speech-to-text content input",
        "Newsletter template generation",
        "Email marketing best practices"
      ],
      "recent_actions": [
        "Generated newsletter for Q4 product launch",
        "Processed PDF content from marketing materials",
        "Analyzed competitor newsletter performance"
      ]
    },
    "suggestions": [
      "Create newsletter content",
      "Process PDF document",
      "Generate email templates",
      "Analyze newsletter performance",
      "Design email layout",
      "Optimize subject lines"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/Squidgy/Newsletter",
      "image_generator_url": "https://n8n.theaiteam.uk/webhook/image_generator"
    },
    "ui": {
      "page_type": "standard",
      "figma_url": "",
      "figma_deployed_url": "https://liquid-blanch-17032840.figma.site/\n",
      "figma_token": "figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd",
      "pages": [
        {
          "name": "newsletter_liquid-blanch-17032840_page1",
          "path": "/agents/newsletter/newsletter_liquid-blanch-17032840_page1",
          "order": 1,
          "source": {
            "type": "figma_deployed",
            "url": "https://liquid-blanch-17032840.figma.site/"
          }
        }
      ]
    },
    "ui_use": {
      "pages": [
        {
          "name": "Newsletter Liquid-Blanch-17032840 Page1",
          "path": "/agents/newsletter/newsletter_liquid-blanch-17032840_page1",
          "order": 1,
          "generatedComponent": "/Users/somasekharaddakula/CascadeProjects/UI_SquidgyFrontend_Updated/client/pages/agents/newsletter/dashboard.tsx"
        }
      ],
      "default_page": "/agents/newsletter/newsletter_liquid-blanch-17032840_page1"
    }
  },
  {
    "agent": {
      "id": "smm_assistant",
      "name": "SMM Assistant",
      "category": "MARKETING",
      "description": "Specializes in social media marketing, content creation, and trend analysis.",
      "specialization": "Creative & Trendy",
      "tagline": "Trend. Post. Analyze.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/5de94726d88f958a1bdd5755183ee631960b155f?width=64",
      "capabilities": [
        "Content creation and optimization for all major social platforms",
        "Trend analysis and hashtag research",
        "Social media strategy development and planning",
        "Engagement optimization and community management"
      ],
      "recent_actions": [
        "Created 15 Instagram post ideas for fashion brand",
        "Analysed competitor performance",
        "Generated trending hashtags for Q4 campaign",
        "Developed content calendar for December"
      ]
    },
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/Squidgy/SMM_Assistant"
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "SMM Dashboard",
          "path": "smm-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "Create Instagram post ideas",
      "Analyze competitor content",
      "Write engaging captions",
      "Generate trending hashtags",
      "Plan content calendar",
      "Optimize engagement strategy"
    ],
    "personality": {
      "tone": "creative",
      "style": "trendy",
      "approach": "data_driven"
    }
  },
  {
    "agent": {
      "id": "SOL",
      "name": "SOL Bot",
      "category": "SALES",
      "description": "Solar sales expert - Calculate savings, design systems, close deals",
      "specialization": "Solar Energy Expert",
      "tagline": "Illuminate. Calculate. Convert.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=solar&backgroundColor=ffb238",
      "pinned": true,
      "presetup_required": true,
      "presetup_page": "/solar-config",
      "initial_message": "Hi! I'm SOL Bot, your solar energy expert. 🌞<br><br>I specialize in solar panel systems, ROI calculations, and helping you go green while saving green!<br><br>📋 <a href=\"/solar-config\" target=\"_blank\" style=\"color: #7c3aed; text-decoration: underline;\">Complete Solar Setup</a> - Configure your solar offer details.",
      "capabilities": [
        "Solar panel system sizing and design",
        "ROI and payback period calculations",
        "Energy consumption analysis",
        "Federal and state incentive guidance",
        "Shade analysis and roof assessment",
        "Battery storage recommendations",
        "Net metering calculations",
        "Financing options comparison",
        "Carbon footprint reduction estimates",
        "Utility rate analysis"
      ],
      "recent_actions": [
        "Calculated 25-year savings of $47,000 for residential system",
        "Designed 10kW system with Tesla Powerwall",
        "Analyzed time-of-use rates for optimal savings",
        "Provided tax credit documentation for IRS Form 5695",
        "Generated proposal for 50-panel commercial installation"
      ]
    },
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/sol_bot"
    },
    "ui": {
      "page_type": "standard",
      "figma_url": "",
      "figma_deployed_url": "",
      "figma_token": "figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd"
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Solar Dashboard",
          "path": "solar-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons",
        "calculator_widget",
        "map_integration"
      ]
    },
    "suggestions": [
      "Have I had any new leads today?",
      "Show me this week's sales performance",
      "Generate a proposal for commercial solar",
      "What's the ROI calculation for this project?",
      "Create a quote for residential installation",
      "Schedule a site assessment appointment",
      "Request a callback for this lead",
      "Track my pipeline conversion rates"
    ],
    "personality": {
      "tone": "enthusiastic",
      "style": "educational",
      "approach": "consultative"
    },
    "solar_config": {
      "defaults": {
        "installation_price": 2,
        "dealer_fee": 15,
        "broker_fee": 50,
        "financing_apr": 5,
        "financing_term": 240,
        "energy_price": 0.17,
        "yearly_cost_increase": 4,
        "installation_lifespan": 20,
        "typical_panel_count": 40,
        "max_roof_segments": 4,
        "solar_incentive": 3,
        "panel_wattage": 400,
        "system_efficiency": 0.85,
        "degradation_rate": 0.005,
        "electricity_rate_increase": 0.03
      },
      "regions": [
        "US_Federal",
        "California",
        "Texas",
        "Florida",
        "Arizona",
        "Nevada",
        "New_York",
        "Colorado"
      ],
      "integrations": [
        "google_sunroof",
        "pvwatts",
        "utility_apis",
        "permit_databases"
      ]
    }
  },
  {
    "agent": {
      "id": "content_repurposer",
      "name": "Content Repurposer",
      "category": "SALES",
      "description": "Repurpose content for different platforms and audiences",
      "specialization": "Content Repurposer",
      "tagline": "Repurpose. Convert. Deliver.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=content_repurposer",
      "initial_message": "Hey there! 🎨 I'm your Content Repurposer, ready to transform your content across different platforms.<br><br>📄 To get started, please <strong>select a newsletter from the dropdown above</strong>, and I'll help you generate engaging social media posts based on that content!",
      "capabilities": [
        "Primary capability or main function",
        "Secondary feature or service provided",
        "Integration or special functionality",
        "Advanced feature or automation",
        "Additional service or tool"
      ],
      "recent_actions": [
        "Completed a recent task or project",
        "Generated content or performed analysis",
        "Processed user request or data",
        "Automated workflow or integration"
      ]
    },
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/content_repurposer",
      "image_generator_url": "https://n8n.theaiteam.uk/webhook/image_generator"
    },
    "ui": {
      "page_type": "standard",
      "figma_url": "",
      "figma_deployed_url": "",
      "figma_token": "figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd"
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Your Agent Dashboard",
          "path": "your-agent-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "First suggested action",
      "Second helpful prompt",
      "Third common task",
      "Fourth useful command",
      "Fifth popular request",
      "Sixth frequent operation"
    ],
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "proactive"
    }
  },
  {
    "agent": {
      "id": "test_multi_agent",
      "name": "Test Multi-Agent",
      "category": "TESTING",
      "description": "Testing multi-agent code generation system.",
      "specialization": "Advanced Testing",
      "tagline": "Test. Generate. Collaborate.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
      "capabilities": [
        "Multi-agent code generation and testing",
        "Advanced AI workflow collaboration",
        "System integration testing",
        "Performance optimization and analysis"
      ],
      "recent_actions": [
        "Generated test suites for new features",
        "Coordinated multi-agent workflows",
        "Optimized system performance metrics",
        "Validated integration pipelines"
      ]
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Testing Dashboard",
          "path": "testing-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "Generate test cases",
      "Run system diagnostics",
      "Optimize performance",
      "Create integration tests",
      "Validate workflows",
      "Analyze metrics"
    ],
    "personality": {
      "tone": "technical",
      "style": "analytical",
      "approach": "systematic"
    }
  },
  {
    "agent": {
      "id": "test_multi_page_agent",
      "name": "Test Multi-Page Agent",
      "category": "TESTING",
      "description": "Testing multi-page functionality.",
      "specialization": "Multi-Page Testing",
      "tagline": "Navigate. Test. Validate.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
      "capabilities": [
        "Multi-page navigation testing",
        "Complex UI component validation",
        "User journey optimization",
        "Interface responsiveness testing"
      ],
      "recent_actions": [
        "Tested multi-page navigation flows",
        "Validated complex UI components",
        "Optimized user experience paths",
        "Analyzed interface responsiveness"
      ]
    },
    "ui_use": {
      "page_type": "multi_page",
      "pages": [
        {
          "name": "Navigation Test",
          "path": "navigation-test",
          "order": 1,
          "validated": true
        },
        {
          "name": "UI Validation",
          "path": "ui-validation",
          "order": 2,
          "validated": false
        },
        {
          "name": "Performance Analysis",
          "path": "performance-analysis",
          "order": 3,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "Test navigation flows",
      "Validate UI components",
      "Optimize user journeys",
      "Check responsiveness",
      "Run page tests",
      "Analyze performance"
    ],
    "personality": {
      "tone": "professional",
      "style": "methodical",
      "approach": "comprehensive"
    }
  }
];

// Agents by ID (for fast lookup)
export const AGENTS_BY_ID: Record<string, AgentConfig> = {
  "content_repurposer": {
    "agent": {
      "id": "content_repurposer",
      "name": "Content Repurposer",
      "category": "SALES",
      "description": "Repurpose content for different platforms and audiences",
      "specialization": "Content Repurposer",
      "tagline": "Repurpose. Convert. Deliver.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=content_repurposer",
      "initial_message": "Hey there! 🎨 I'm your Content Repurposer, ready to transform your content across different platforms.<br><br>📄 To get started, please <strong>select a newsletter from the dropdown above</strong>, and I'll help you generate engaging social media posts based on that content!",
      "capabilities": [
        "Primary capability or main function",
        "Secondary feature or service provided",
        "Integration or special functionality",
        "Advanced feature or automation",
        "Additional service or tool"
      ],
      "recent_actions": [
        "Completed a recent task or project",
        "Generated content or performed analysis",
        "Processed user request or data",
        "Automated workflow or integration"
      ]
    },
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/content_repurposer",
      "image_generator_url": "https://n8n.theaiteam.uk/webhook/image_generator"
    },
    "ui": {
      "page_type": "standard",
      "figma_url": "",
      "figma_deployed_url": "",
      "figma_token": "figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd"
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Your Agent Dashboard",
          "path": "your-agent-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "First suggested action",
      "Second helpful prompt",
      "Third common task",
      "Fourth useful command",
      "Fifth popular request",
      "Sixth frequent operation"
    ],
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "proactive"
    }
  },
  "newsletter": {
    "agent": {
      "id": "newsletter",
      "name": "Newsletter Agent",
      "category": "MARKETING",
      "description": "Create and manage newsletters",
      "specialization": "Creative & Trendy",
      "tagline": "Content. Create. Distribute.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter",
      "pinned": true,
      "initial_message": "Hey there! 👋 I'm here to help you create amazing newsletters. Whether you need to write content, design layouts, or analyze performance - I've got you covered. What would you like to work on today?",
      "capabilities": [
        "Content creation and optimization for newsletters",
        "PDF document processing and analysis",
        "Speech-to-text content input",
        "Newsletter template generation",
        "Email marketing best practices"
      ],
      "recent_actions": [
        "Generated newsletter for Q4 product launch",
        "Processed PDF content from marketing materials",
        "Analyzed competitor newsletter performance"
      ]
    },
    "suggestions": [
      "Create newsletter content",
      "Process PDF document",
      "Generate email templates",
      "Analyze newsletter performance",
      "Design email layout",
      "Optimize subject lines"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/Squidgy/Newsletter",
      "image_generator_url": "https://n8n.theaiteam.uk/webhook/image_generator"
    },
    "ui": {
      "page_type": "standard",
      "figma_url": "",
      "figma_deployed_url": "https://liquid-blanch-17032840.figma.site/\n",
      "figma_token": "figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd",
      "pages": [
        {
          "name": "newsletter_liquid-blanch-17032840_page1",
          "path": "/agents/newsletter/newsletter_liquid-blanch-17032840_page1",
          "order": 1,
          "source": {
            "type": "figma_deployed",
            "url": "https://liquid-blanch-17032840.figma.site/"
          }
        }
      ]
    },
    "ui_use": {
      "pages": [
        {
          "name": "Newsletter Liquid-Blanch-17032840 Page1",
          "path": "/agents/newsletter/newsletter_liquid-blanch-17032840_page1",
          "order": 1,
          "generatedComponent": "/Users/somasekharaddakula/CascadeProjects/UI_SquidgyFrontend_Updated/client/pages/agents/newsletter/dashboard.tsx"
        }
      ],
      "default_page": "/agents/newsletter/newsletter_liquid-blanch-17032840_page1"
    }
  },
  "personal_assistant": {
    "agent": {
      "id": "personal_assistant",
      "name": "Personal Assistant",
      "category": "GENERAL",
      "description": "Your versatile personal assistant ready to help with any task.",
      "specialization": "Always Ready to Help",
      "tagline": "Organize. Schedule. Support.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
      "pinned": true,
      "capabilities": [
        "Task management and scheduling coordination",
        "Research and information gathering",
        "Email drafting and communication support",
        "Document organization and file management",
        "Calendar management and appointment scheduling",
        "Travel planning and logistics coordination"
      ],
      "recent_actions": [
        "Organized calendar for next week's meetings",
        "Researched market trends for quarterly report",
        "Drafted follow-up emails for client meetings",
        "Scheduled team meetings for project kickoff"
      ]
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Personal Dashboard",
          "path": "personal-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "Help me organize my schedule for this week",
      "Draft a professional email for me",
      "Research latest industry trends",
      "Create a task list for my project",
      "Schedule a meeting with my team",
      "Help me plan my upcoming trip"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/c2fcbad6-abc0-43af-8aa8-d1661ff4461d"
    },
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "proactive"
    }
  },
  "smm_assistant": {
    "agent": {
      "id": "smm_assistant",
      "name": "SMM Assistant",
      "category": "MARKETING",
      "description": "Specializes in social media marketing, content creation, and trend analysis.",
      "specialization": "Creative & Trendy",
      "tagline": "Trend. Post. Analyze.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/5de94726d88f958a1bdd5755183ee631960b155f?width=64",
      "capabilities": [
        "Content creation and optimization for all major social platforms",
        "Trend analysis and hashtag research",
        "Social media strategy development and planning",
        "Engagement optimization and community management"
      ],
      "recent_actions": [
        "Created 15 Instagram post ideas for fashion brand",
        "Analysed competitor performance",
        "Generated trending hashtags for Q4 campaign",
        "Developed content calendar for December"
      ]
    },
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/Squidgy/SMM_Assistant"
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "SMM Dashboard",
          "path": "smm-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "Create Instagram post ideas",
      "Analyze competitor content",
      "Write engaging captions",
      "Generate trending hashtags",
      "Plan content calendar",
      "Optimize engagement strategy"
    ],
    "personality": {
      "tone": "creative",
      "style": "trendy",
      "approach": "data_driven"
    }
  },
  "SOL": {
    "agent": {
      "id": "SOL",
      "name": "SOL Bot",
      "category": "SALES",
      "description": "Solar sales expert - Calculate savings, design systems, close deals",
      "specialization": "Solar Energy Expert",
      "tagline": "Illuminate. Calculate. Convert.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=solar&backgroundColor=ffb238",
      "pinned": true,
      "presetup_required": true,
      "presetup_page": "/solar-config",
      "initial_message": "Hi! I'm SOL Bot, your solar energy expert. 🌞<br><br>I specialize in solar panel systems, ROI calculations, and helping you go green while saving green!<br><br>📋 <a href=\"/solar-config\" target=\"_blank\" style=\"color: #7c3aed; text-decoration: underline;\">Complete Solar Setup</a> - Configure your solar offer details.",
      "capabilities": [
        "Solar panel system sizing and design",
        "ROI and payback period calculations",
        "Energy consumption analysis",
        "Federal and state incentive guidance",
        "Shade analysis and roof assessment",
        "Battery storage recommendations",
        "Net metering calculations",
        "Financing options comparison",
        "Carbon footprint reduction estimates",
        "Utility rate analysis"
      ],
      "recent_actions": [
        "Calculated 25-year savings of $47,000 for residential system",
        "Designed 10kW system with Tesla Powerwall",
        "Analyzed time-of-use rates for optimal savings",
        "Provided tax credit documentation for IRS Form 5695",
        "Generated proposal for 50-panel commercial installation"
      ]
    },
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/sol_bot"
    },
    "ui": {
      "page_type": "standard",
      "figma_url": "",
      "figma_deployed_url": "",
      "figma_token": "figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd"
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Solar Dashboard",
          "path": "solar-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons",
        "calculator_widget",
        "map_integration"
      ]
    },
    "suggestions": [
      "Have I had any new leads today?",
      "Show me this week's sales performance",
      "Generate a proposal for commercial solar",
      "What's the ROI calculation for this project?",
      "Create a quote for residential installation",
      "Schedule a site assessment appointment",
      "Request a callback for this lead",
      "Track my pipeline conversion rates"
    ],
    "personality": {
      "tone": "enthusiastic",
      "style": "educational",
      "approach": "consultative"
    },
    "solar_config": {
      "defaults": {
        "installation_price": 2,
        "dealer_fee": 15,
        "broker_fee": 50,
        "financing_apr": 5,
        "financing_term": 240,
        "energy_price": 0.17,
        "yearly_cost_increase": 4,
        "installation_lifespan": 20,
        "typical_panel_count": 40,
        "max_roof_segments": 4,
        "solar_incentive": 3,
        "panel_wattage": 400,
        "system_efficiency": 0.85,
        "degradation_rate": 0.005,
        "electricity_rate_increase": 0.03
      },
      "regions": [
        "US_Federal",
        "California",
        "Texas",
        "Florida",
        "Arizona",
        "Nevada",
        "New_York",
        "Colorado"
      ],
      "integrations": [
        "google_sunroof",
        "pvwatts",
        "utility_apis",
        "permit_databases"
      ]
    }
  },
  "test_multi_agent": {
    "agent": {
      "id": "test_multi_agent",
      "name": "Test Multi-Agent",
      "category": "TESTING",
      "description": "Testing multi-agent code generation system.",
      "specialization": "Advanced Testing",
      "tagline": "Test. Generate. Collaborate.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
      "capabilities": [
        "Multi-agent code generation and testing",
        "Advanced AI workflow collaboration",
        "System integration testing",
        "Performance optimization and analysis"
      ],
      "recent_actions": [
        "Generated test suites for new features",
        "Coordinated multi-agent workflows",
        "Optimized system performance metrics",
        "Validated integration pipelines"
      ]
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Testing Dashboard",
          "path": "testing-dashboard",
          "order": 1,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "Generate test cases",
      "Run system diagnostics",
      "Optimize performance",
      "Create integration tests",
      "Validate workflows",
      "Analyze metrics"
    ],
    "personality": {
      "tone": "technical",
      "style": "analytical",
      "approach": "systematic"
    }
  },
  "test_multi_page_agent": {
    "agent": {
      "id": "test_multi_page_agent",
      "name": "Test Multi-Page Agent",
      "category": "TESTING",
      "description": "Testing multi-page functionality.",
      "specialization": "Multi-Page Testing",
      "tagline": "Navigate. Test. Validate.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
      "capabilities": [
        "Multi-page navigation testing",
        "Complex UI component validation",
        "User journey optimization",
        "Interface responsiveness testing"
      ],
      "recent_actions": [
        "Tested multi-page navigation flows",
        "Validated complex UI components",
        "Optimized user experience paths",
        "Analyzed interface responsiveness"
      ]
    },
    "ui_use": {
      "page_type": "multi_page",
      "pages": [
        {
          "name": "Navigation Test",
          "path": "navigation-test",
          "order": 1,
          "validated": true
        },
        {
          "name": "UI Validation",
          "path": "ui-validation",
          "order": 2,
          "validated": false
        },
        {
          "name": "Performance Analysis",
          "path": "performance-analysis",
          "order": 3,
          "validated": true
        }
      ]
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "voice_input",
        "suggestion_buttons"
      ]
    },
    "suggestions": [
      "Test navigation flows",
      "Validate UI components",
      "Optimize user journeys",
      "Check responsiveness",
      "Run page tests",
      "Analyze performance"
    ],
    "personality": {
      "tone": "professional",
      "style": "methodical",
      "approach": "comprehensive"
    }
  }
};

// Agents by category (pre-grouped)
export const AGENTS_BY_CATEGORY: Record<string, AgentConfig[]> = {
  "GENERAL": [
    {
      "agent": {
        "id": "personal_assistant",
        "name": "Personal Assistant",
        "category": "GENERAL",
        "description": "Your versatile personal assistant ready to help with any task.",
        "specialization": "Always Ready to Help",
        "tagline": "Organize. Schedule. Support.",
        "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
        "pinned": true,
        "capabilities": [
          "Task management and scheduling coordination",
          "Research and information gathering",
          "Email drafting and communication support",
          "Document organization and file management",
          "Calendar management and appointment scheduling",
          "Travel planning and logistics coordination"
        ],
        "recent_actions": [
          "Organized calendar for next week's meetings",
          "Researched market trends for quarterly report",
          "Drafted follow-up emails for client meetings",
          "Scheduled team meetings for project kickoff"
        ]
      },
      "ui_use": {
        "page_type": "single_page",
        "pages": [
          {
            "name": "Personal Dashboard",
            "path": "personal-dashboard",
            "order": 1,
            "validated": true
          }
        ]
      },
      "interface": {
        "type": "chat",
        "features": [
          "text_input",
          "file_upload",
          "voice_input",
          "suggestion_buttons"
        ]
      },
      "suggestions": [
        "Help me organize my schedule for this week",
        "Draft a professional email for me",
        "Research latest industry trends",
        "Create a task list for my project",
        "Schedule a meeting with my team",
        "Help me plan my upcoming trip"
      ],
      "n8n": {
        "webhook_url": "https://n8n.theaiteam.uk/webhook/c2fcbad6-abc0-43af-8aa8-d1661ff4461d"
      },
      "personality": {
        "tone": "professional",
        "style": "helpful",
        "approach": "proactive"
      }
    }
  ],
  "MARKETING": [
    {
      "agent": {
        "id": "newsletter",
        "name": "Newsletter Agent",
        "category": "MARKETING",
        "description": "Create and manage newsletters",
        "specialization": "Creative & Trendy",
        "tagline": "Content. Create. Distribute.",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter",
        "pinned": true,
        "initial_message": "Hey there! 👋 I'm here to help you create amazing newsletters. Whether you need to write content, design layouts, or analyze performance - I've got you covered. What would you like to work on today?",
        "capabilities": [
          "Content creation and optimization for newsletters",
          "PDF document processing and analysis",
          "Speech-to-text content input",
          "Newsletter template generation",
          "Email marketing best practices"
        ],
        "recent_actions": [
          "Generated newsletter for Q4 product launch",
          "Processed PDF content from marketing materials",
          "Analyzed competitor newsletter performance"
        ]
      },
      "suggestions": [
        "Create newsletter content",
        "Process PDF document",
        "Generate email templates",
        "Analyze newsletter performance",
        "Design email layout",
        "Optimize subject lines"
      ],
      "n8n": {
        "webhook_url": "https://n8n.theaiteam.uk/webhook/Squidgy/Newsletter",
        "image_generator_url": "https://n8n.theaiteam.uk/webhook/image_generator"
      },
      "ui": {
        "page_type": "standard",
        "figma_url": "",
        "figma_deployed_url": "https://liquid-blanch-17032840.figma.site/\n",
        "figma_token": "figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd",
        "pages": [
          {
            "name": "newsletter_liquid-blanch-17032840_page1",
            "path": "/agents/newsletter/newsletter_liquid-blanch-17032840_page1",
            "order": 1,
            "source": {
              "type": "figma_deployed",
              "url": "https://liquid-blanch-17032840.figma.site/"
            }
          }
        ]
      },
      "ui_use": {
        "pages": [
          {
            "name": "Newsletter Liquid-Blanch-17032840 Page1",
            "path": "/agents/newsletter/newsletter_liquid-blanch-17032840_page1",
            "order": 1,
            "generatedComponent": "/Users/somasekharaddakula/CascadeProjects/UI_SquidgyFrontend_Updated/client/pages/agents/newsletter/dashboard.tsx"
          }
        ],
        "default_page": "/agents/newsletter/newsletter_liquid-blanch-17032840_page1"
      }
    },
    {
      "agent": {
        "id": "smm_assistant",
        "name": "SMM Assistant",
        "category": "MARKETING",
        "description": "Specializes in social media marketing, content creation, and trend analysis.",
        "specialization": "Creative & Trendy",
        "tagline": "Trend. Post. Analyze.",
        "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/5de94726d88f958a1bdd5755183ee631960b155f?width=64",
        "capabilities": [
          "Content creation and optimization for all major social platforms",
          "Trend analysis and hashtag research",
          "Social media strategy development and planning",
          "Engagement optimization and community management"
        ],
        "recent_actions": [
          "Created 15 Instagram post ideas for fashion brand",
          "Analysed competitor performance",
          "Generated trending hashtags for Q4 campaign",
          "Developed content calendar for December"
        ]
      },
      "n8n": {
        "webhook_url": "https://n8n.theaiteam.uk/webhook/Squidgy/SMM_Assistant"
      },
      "ui_use": {
        "page_type": "single_page",
        "pages": [
          {
            "name": "SMM Dashboard",
            "path": "smm-dashboard",
            "order": 1,
            "validated": true
          }
        ]
      },
      "interface": {
        "type": "chat",
        "features": [
          "text_input",
          "file_upload",
          "voice_input",
          "suggestion_buttons"
        ]
      },
      "suggestions": [
        "Create Instagram post ideas",
        "Analyze competitor content",
        "Write engaging captions",
        "Generate trending hashtags",
        "Plan content calendar",
        "Optimize engagement strategy"
      ],
      "personality": {
        "tone": "creative",
        "style": "trendy",
        "approach": "data_driven"
      }
    }
  ],
  "SALES": [
    {
      "agent": {
        "id": "SOL",
        "name": "SOL Bot",
        "category": "SALES",
        "description": "Solar sales expert - Calculate savings, design systems, close deals",
        "specialization": "Solar Energy Expert",
        "tagline": "Illuminate. Calculate. Convert.",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=solar&backgroundColor=ffb238",
        "pinned": true,
        "presetup_required": true,
        "presetup_page": "/solar-config",
        "initial_message": "Hi! I'm SOL Bot, your solar energy expert. 🌞<br><br>I specialize in solar panel systems, ROI calculations, and helping you go green while saving green!<br><br>📋 <a href=\"/solar-config\" target=\"_blank\" style=\"color: #7c3aed; text-decoration: underline;\">Complete Solar Setup</a> - Configure your solar offer details.",
        "capabilities": [
          "Solar panel system sizing and design",
          "ROI and payback period calculations",
          "Energy consumption analysis",
          "Federal and state incentive guidance",
          "Shade analysis and roof assessment",
          "Battery storage recommendations",
          "Net metering calculations",
          "Financing options comparison",
          "Carbon footprint reduction estimates",
          "Utility rate analysis"
        ],
        "recent_actions": [
          "Calculated 25-year savings of $47,000 for residential system",
          "Designed 10kW system with Tesla Powerwall",
          "Analyzed time-of-use rates for optimal savings",
          "Provided tax credit documentation for IRS Form 5695",
          "Generated proposal for 50-panel commercial installation"
        ]
      },
      "n8n": {
        "webhook_url": "https://n8n.theaiteam.uk/webhook/sol_bot"
      },
      "ui": {
        "page_type": "standard",
        "figma_url": "",
        "figma_deployed_url": "",
        "figma_token": "figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd"
      },
      "ui_use": {
        "page_type": "single_page",
        "pages": [
          {
            "name": "Solar Dashboard",
            "path": "solar-dashboard",
            "order": 1,
            "validated": true
          }
        ]
      },
      "interface": {
        "type": "chat",
        "features": [
          "text_input",
          "file_upload",
          "voice_input",
          "suggestion_buttons",
          "calculator_widget",
          "map_integration"
        ]
      },
      "suggestions": [
        "Have I had any new leads today?",
        "Show me this week's sales performance",
        "Generate a proposal for commercial solar",
        "What's the ROI calculation for this project?",
        "Create a quote for residential installation",
        "Schedule a site assessment appointment",
        "Request a callback for this lead",
        "Track my pipeline conversion rates"
      ],
      "personality": {
        "tone": "enthusiastic",
        "style": "educational",
        "approach": "consultative"
      },
      "solar_config": {
        "defaults": {
          "installation_price": 2,
          "dealer_fee": 15,
          "broker_fee": 50,
          "financing_apr": 5,
          "financing_term": 240,
          "energy_price": 0.17,
          "yearly_cost_increase": 4,
          "installation_lifespan": 20,
          "typical_panel_count": 40,
          "max_roof_segments": 4,
          "solar_incentive": 3,
          "panel_wattage": 400,
          "system_efficiency": 0.85,
          "degradation_rate": 0.005,
          "electricity_rate_increase": 0.03
        },
        "regions": [
          "US_Federal",
          "California",
          "Texas",
          "Florida",
          "Arizona",
          "Nevada",
          "New_York",
          "Colorado"
        ],
        "integrations": [
          "google_sunroof",
          "pvwatts",
          "utility_apis",
          "permit_databases"
        ]
      }
    },
    {
      "agent": {
        "id": "content_repurposer",
        "name": "Content Repurposer",
        "category": "SALES",
        "description": "Repurpose content for different platforms and audiences",
        "specialization": "Content Repurposer",
        "tagline": "Repurpose. Convert. Deliver.",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=content_repurposer",
        "initial_message": "Hey there! 🎨 I'm your Content Repurposer, ready to transform your content across different platforms.<br><br>📄 To get started, please <strong>select a newsletter from the dropdown above</strong>, and I'll help you generate engaging social media posts based on that content!",
        "capabilities": [
          "Primary capability or main function",
          "Secondary feature or service provided",
          "Integration or special functionality",
          "Advanced feature or automation",
          "Additional service or tool"
        ],
        "recent_actions": [
          "Completed a recent task or project",
          "Generated content or performed analysis",
          "Processed user request or data",
          "Automated workflow or integration"
        ]
      },
      "n8n": {
        "webhook_url": "https://n8n.theaiteam.uk/webhook/content_repurposer",
        "image_generator_url": "https://n8n.theaiteam.uk/webhook/image_generator"
      },
      "ui": {
        "page_type": "standard",
        "figma_url": "",
        "figma_deployed_url": "",
        "figma_token": "figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd"
      },
      "ui_use": {
        "page_type": "single_page",
        "pages": [
          {
            "name": "Your Agent Dashboard",
            "path": "your-agent-dashboard",
            "order": 1,
            "validated": true
          }
        ]
      },
      "interface": {
        "type": "chat",
        "features": [
          "text_input",
          "file_upload",
          "voice_input",
          "suggestion_buttons"
        ]
      },
      "suggestions": [
        "First suggested action",
        "Second helpful prompt",
        "Third common task",
        "Fourth useful command",
        "Fifth popular request",
        "Sixth frequent operation"
      ],
      "personality": {
        "tone": "professional",
        "style": "helpful",
        "approach": "proactive"
      }
    }
  ],
  "TESTING": [
    {
      "agent": {
        "id": "test_multi_agent",
        "name": "Test Multi-Agent",
        "category": "TESTING",
        "description": "Testing multi-agent code generation system.",
        "specialization": "Advanced Testing",
        "tagline": "Test. Generate. Collaborate.",
        "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
        "capabilities": [
          "Multi-agent code generation and testing",
          "Advanced AI workflow collaboration",
          "System integration testing",
          "Performance optimization and analysis"
        ],
        "recent_actions": [
          "Generated test suites for new features",
          "Coordinated multi-agent workflows",
          "Optimized system performance metrics",
          "Validated integration pipelines"
        ]
      },
      "ui_use": {
        "page_type": "single_page",
        "pages": [
          {
            "name": "Testing Dashboard",
            "path": "testing-dashboard",
            "order": 1,
            "validated": true
          }
        ]
      },
      "interface": {
        "type": "chat",
        "features": [
          "text_input",
          "file_upload",
          "voice_input",
          "suggestion_buttons"
        ]
      },
      "suggestions": [
        "Generate test cases",
        "Run system diagnostics",
        "Optimize performance",
        "Create integration tests",
        "Validate workflows",
        "Analyze metrics"
      ],
      "personality": {
        "tone": "technical",
        "style": "analytical",
        "approach": "systematic"
      }
    },
    {
      "agent": {
        "id": "test_multi_page_agent",
        "name": "Test Multi-Page Agent",
        "category": "TESTING",
        "description": "Testing multi-page functionality.",
        "specialization": "Multi-Page Testing",
        "tagline": "Navigate. Test. Validate.",
        "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
        "capabilities": [
          "Multi-page navigation testing",
          "Complex UI component validation",
          "User journey optimization",
          "Interface responsiveness testing"
        ],
        "recent_actions": [
          "Tested multi-page navigation flows",
          "Validated complex UI components",
          "Optimized user experience paths",
          "Analyzed interface responsiveness"
        ]
      },
      "ui_use": {
        "page_type": "multi_page",
        "pages": [
          {
            "name": "Navigation Test",
            "path": "navigation-test",
            "order": 1,
            "validated": true
          },
          {
            "name": "UI Validation",
            "path": "ui-validation",
            "order": 2,
            "validated": false
          },
          {
            "name": "Performance Analysis",
            "path": "performance-analysis",
            "order": 3,
            "validated": true
          }
        ]
      },
      "interface": {
        "type": "chat",
        "features": [
          "text_input",
          "file_upload",
          "voice_input",
          "suggestion_buttons"
        ]
      },
      "suggestions": [
        "Test navigation flows",
        "Validate UI components",
        "Optimize user journeys",
        "Check responsiveness",
        "Run page tests",
        "Analyze performance"
      ],
      "personality": {
        "tone": "professional",
        "style": "methodical",
        "approach": "comprehensive"
      }
    }
  ]
};

// Agent IDs list
export const AGENT_IDS: string[] = ["content_repurposer","newsletter","personal_assistant","smm_assistant","SOL","test_multi_agent","test_multi_page_agent"];

// Total count
export const TOTAL_AGENTS = 7;
