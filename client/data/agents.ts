// Auto-generated at build time - DO NOT EDIT MANUALLY
// Generated on: 2026-01-15T07:23:28.835Z

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

// All agents (pre-sorted)
export const ALL_AGENTS: AgentConfig[] = [
  {
    "agent": {
      "id": "personal_assistant",
      "emoji": "🤖",
      "name": "Personal Assistant",
      "category": "GENERAL",
      "description": "Your onboarding assistant for setting up AI agents",
      "specialization": "Onboarding Expert",
      "tagline": "Setup. Configure. Launch.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
      "pinned": true,
      "initial_message": "Hey! I'm your Personal Assistant. Share your website URL and I'll analyze your company to recommend the best AI agents for you.",
      "sidebar_greeting": "Hi! I'm your Personal Assistant - your dedicated onboarding expert. I'm here to help you set up and configure AI agents tailored to your business needs. How can I assist you today?",
      "capabilities": [
        "Website analysis and company insights",
        "AI agent recommendation and setup",
        "Brand voice and communication style configuration",
        "Target audience and business goal analysis",
        "Calendar and notification setup",
        "Complete onboarding flow management"
      ],
      "recent_actions": [
        "Analyzed company website and recommended 3 AI agents",
        "Configured SMM Assistant for e-commerce business",
        "Set up professional brand voice for marketing team",
        "Enabled notifications and calendar integration"
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
      "Let's start the setup process",
      "Analyze my company website",
      "Recommend AI agents for my business",
      "Configure my brand voice and style",
      "Set up notifications and calendar",
      "➕ Add Another Assistant"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/personal_assistant"
    },
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "proactive"
    }
  },
  {
    "agent": {
      "id": "content_repurposer_multi",
      "emoji": "✨",
      "name": "Content Repurposer Multi",
      "category": "MARKETING",
      "description": "Transform content into multiple platform formats",
      "specialization": "Content Repurposer",
      "tagline": "Repurpose. Convert. Deliver.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=content_repurposer",
      "initial_message": "Hey there! 🎨 I'm your Content Repurposer, ready to transform your content across different platforms.<br><br>📄 To get started, please <strong>select a newsletter from the dropdown above</strong>, and I'll help you generate engaging social media posts based on that content!",
      "capabilities": [
        "Multi-platform content transformation",
        "Social media post generation (LinkedIn, Twitter, Instagram)",
        "Blog to social media conversion",
        "Newsletter content repurposing",
        "Tone and style adaptation per platform"
      ],
      "recent_actions": [
        "Converted blog post into 5 LinkedIn posts",
        "Generated Twitter thread from newsletter",
        "Created Instagram captions from article",
        "Adapted content for multiple audiences"
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
      "Convert newsletter to social posts",
      "Create LinkedIn post from content",
      "Generate Twitter thread",
      "Adapt for Instagram",
      "Repurpose for multiple platforms",
      "Change tone for different audience"
    ],
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "proactive"
    }
  },
  {
    "agent": {
      "id": "newsletter",
      "emoji": "📧",
      "name": "Newsletter Agent",
      "category": "MARKETING",
      "description": "Create and manage newsletters",
      "specialization": "Creative & Trendy",
      "tagline": "Content. Create. Distribute.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter",
      "pinned": false,
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
      "id": "newsletter_multi",
      "emoji": "📰",
      "name": "Newsletter Agent Multi",
      "category": "MARKETING",
      "description": "Create and manage newsletters",
      "specialization": "Creative & Trendy",
      "tagline": "Content. Create. Distribute.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter_multi",
      "pinned": false,
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
      "webhook_url": "https://n8n.theaiteam.uk/webhook/newsletter_multi",
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
      "id": "SOL",
      "emoji": "☀️",
      "name": "Solar Sales Assistant",
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
      "emoji": "🔄",
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
];

// Agents by ID (for fast lookup)
export const AGENTS_BY_ID: Record<string, AgentConfig> = {
  "content_repurposer": {
    "agent": {
      "id": "content_repurposer",
      "emoji": "🔄",
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
  "content_repurposer_multi": {
    "agent": {
      "id": "content_repurposer_multi",
      "emoji": "✨",
      "name": "Content Repurposer Multi",
      "category": "MARKETING",
      "description": "Transform content into multiple platform formats",
      "specialization": "Content Repurposer",
      "tagline": "Repurpose. Convert. Deliver.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=content_repurposer",
      "initial_message": "Hey there! 🎨 I'm your Content Repurposer, ready to transform your content across different platforms.<br><br>📄 To get started, please <strong>select a newsletter from the dropdown above</strong>, and I'll help you generate engaging social media posts based on that content!",
      "capabilities": [
        "Multi-platform content transformation",
        "Social media post generation (LinkedIn, Twitter, Instagram)",
        "Blog to social media conversion",
        "Newsletter content repurposing",
        "Tone and style adaptation per platform"
      ],
      "recent_actions": [
        "Converted blog post into 5 LinkedIn posts",
        "Generated Twitter thread from newsletter",
        "Created Instagram captions from article",
        "Adapted content for multiple audiences"
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
      "Convert newsletter to social posts",
      "Create LinkedIn post from content",
      "Generate Twitter thread",
      "Adapt for Instagram",
      "Repurpose for multiple platforms",
      "Change tone for different audience"
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
      "emoji": "📧",
      "name": "Newsletter Agent",
      "category": "MARKETING",
      "description": "Create and manage newsletters",
      "specialization": "Creative & Trendy",
      "tagline": "Content. Create. Distribute.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter",
      "pinned": false,
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
  "newsletter_multi": {
    "agent": {
      "id": "newsletter_multi",
      "emoji": "📰",
      "name": "Newsletter Agent Multi",
      "category": "MARKETING",
      "description": "Create and manage newsletters",
      "specialization": "Creative & Trendy",
      "tagline": "Content. Create. Distribute.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter_multi",
      "pinned": false,
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
      "webhook_url": "https://n8n.theaiteam.uk/webhook/newsletter_multi",
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
      "emoji": "🤖",
      "name": "Personal Assistant",
      "category": "GENERAL",
      "description": "Your onboarding assistant for setting up AI agents",
      "specialization": "Onboarding Expert",
      "tagline": "Setup. Configure. Launch.",
      "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
      "pinned": true,
      "initial_message": "Hey! I'm your Personal Assistant. Share your website URL and I'll analyze your company to recommend the best AI agents for you.",
      "sidebar_greeting": "Hi! I'm your Personal Assistant - your dedicated onboarding expert. I'm here to help you set up and configure AI agents tailored to your business needs. How can I assist you today?",
      "capabilities": [
        "Website analysis and company insights",
        "AI agent recommendation and setup",
        "Brand voice and communication style configuration",
        "Target audience and business goal analysis",
        "Calendar and notification setup",
        "Complete onboarding flow management"
      ],
      "recent_actions": [
        "Analyzed company website and recommended 3 AI agents",
        "Configured SMM Assistant for e-commerce business",
        "Set up professional brand voice for marketing team",
        "Enabled notifications and calendar integration"
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
      "Let's start the setup process",
      "Analyze my company website",
      "Recommend AI agents for my business",
      "Configure my brand voice and style",
      "Set up notifications and calendar",
      "➕ Add Another Assistant"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/personal_assistant"
    },
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "proactive"
    }
  },
  "SOL": {
    "agent": {
      "id": "SOL",
      "emoji": "☀️",
      "name": "Solar Sales Assistant",
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
  }
};

// Agents by category (pre-grouped)
export const AGENTS_BY_CATEGORY: Record<string, AgentConfig[]> = {
  "GENERAL": [
    {
      "agent": {
        "id": "personal_assistant",
        "emoji": "🤖",
        "name": "Personal Assistant",
        "category": "GENERAL",
        "description": "Your onboarding assistant for setting up AI agents",
        "specialization": "Onboarding Expert",
        "tagline": "Setup. Configure. Launch.",
        "avatar": "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
        "pinned": true,
        "initial_message": "Hey! I'm your Personal Assistant. Share your website URL and I'll analyze your company to recommend the best AI agents for you.",
        "sidebar_greeting": "Hi! I'm your Personal Assistant - your dedicated onboarding expert. I'm here to help you set up and configure AI agents tailored to your business needs. How can I assist you today?",
        "capabilities": [
          "Website analysis and company insights",
          "AI agent recommendation and setup",
          "Brand voice and communication style configuration",
          "Target audience and business goal analysis",
          "Calendar and notification setup",
          "Complete onboarding flow management"
        ],
        "recent_actions": [
          "Analyzed company website and recommended 3 AI agents",
          "Configured SMM Assistant for e-commerce business",
          "Set up professional brand voice for marketing team",
          "Enabled notifications and calendar integration"
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
        "Let's start the setup process",
        "Analyze my company website",
        "Recommend AI agents for my business",
        "Configure my brand voice and style",
        "Set up notifications and calendar",
        "➕ Add Another Assistant"
      ],
      "n8n": {
        "webhook_url": "https://n8n.theaiteam.uk/webhook/personal_assistant"
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
        "id": "content_repurposer_multi",
        "emoji": "✨",
        "name": "Content Repurposer Multi",
        "category": "MARKETING",
        "description": "Transform content into multiple platform formats",
        "specialization": "Content Repurposer",
        "tagline": "Repurpose. Convert. Deliver.",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=content_repurposer",
        "initial_message": "Hey there! 🎨 I'm your Content Repurposer, ready to transform your content across different platforms.<br><br>📄 To get started, please <strong>select a newsletter from the dropdown above</strong>, and I'll help you generate engaging social media posts based on that content!",
        "capabilities": [
          "Multi-platform content transformation",
          "Social media post generation (LinkedIn, Twitter, Instagram)",
          "Blog to social media conversion",
          "Newsletter content repurposing",
          "Tone and style adaptation per platform"
        ],
        "recent_actions": [
          "Converted blog post into 5 LinkedIn posts",
          "Generated Twitter thread from newsletter",
          "Created Instagram captions from article",
          "Adapted content for multiple audiences"
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
        "Convert newsletter to social posts",
        "Create LinkedIn post from content",
        "Generate Twitter thread",
        "Adapt for Instagram",
        "Repurpose for multiple platforms",
        "Change tone for different audience"
      ],
      "personality": {
        "tone": "professional",
        "style": "helpful",
        "approach": "proactive"
      }
    },
    {
      "agent": {
        "id": "newsletter",
        "emoji": "📧",
        "name": "Newsletter Agent",
        "category": "MARKETING",
        "description": "Create and manage newsletters",
        "specialization": "Creative & Trendy",
        "tagline": "Content. Create. Distribute.",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter",
        "pinned": false,
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
        "id": "newsletter_multi",
        "emoji": "📰",
        "name": "Newsletter Agent Multi",
        "category": "MARKETING",
        "description": "Create and manage newsletters",
        "specialization": "Creative & Trendy",
        "tagline": "Content. Create. Distribute.",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newsletter_multi",
        "pinned": false,
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
        "webhook_url": "https://n8n.theaiteam.uk/webhook/newsletter_multi",
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
    }
  ],
  "SALES": [
    {
      "agent": {
        "id": "SOL",
        "emoji": "☀️",
        "name": "Solar Sales Assistant",
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
        "emoji": "🔄",
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
  ]
};

// Agent IDs list
export const AGENT_IDS: string[] = ["content_repurposer","content_repurposer_multi","newsletter","newsletter_multi","personal_assistant","SOL"];

// Total count
export const TOTAL_AGENTS = 6;
