// Auto-generated at build time - DO NOT EDIT MANUALLY
// Generated on: 2026-02-07T17:06:18.130Z

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
    enabled?: boolean;  // Whether agent is enabled by default (personal_assistant always true)
    uses_conversation_state?: boolean;  // Enables multi-turn conversation state persistence
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
      "name": "Pia | Personal Assistant",
      "category": "GENERAL",
      "description": "Help manage your day-to-day tasks and keep you organised.",
      "specialization": "Personal Assistant",
      "tagline": "Friendly & Helpful",
      "avatar": "/Squidgy AI Assistants Avatars/1.png",
      "pinned": true,
      "enabled": true,
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
      "Complete Setup",
      "Analyze my company website",
      "Recommend AI agents for my business",
      "Configure my brand voice and style",
      "Set up notifications and calendar",
      "➕ Add Another Assistant"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/personal_assistant_advanced"
    },
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "proactive"
    }
  },
  {
    "agent": {
      "id": "social_media_scheduler",
      "name": "Social Media Scheduler",
      "category": "MARKETING",
      "description": "Schedule and manage your social media posts across multiple platforms",
      "specialization": "Automated & Strategic",
      "tagline": "Schedule. Publish. Engage.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=social-scheduler",
      "pinned": true,
      "enabled": true,
      "initial_message": "Hey! 👋 I'm your Social Media Scheduler. I can help you plan, schedule, and manage posts across all your social platforms. Want to schedule a post, check your content calendar, or analyze your posting strategy? Let's get started!",
      "capabilities": [
        "Schedule posts across multiple social media platforms",
        "Create and manage content calendars",
        "Optimize posting times for maximum engagement",
        "Draft social media content with hashtags and captions",
        "Track scheduled posts and publishing status",
        "Analyze best times to post based on audience data",
        "Manage social media campaigns and series",
        "Cross-platform content adaptation"
      ],
      "recent_actions": [
        "Scheduled 15 posts for next week's product launch",
        "Optimized posting times based on engagement analytics",
        "Created content calendar for Q1 campaign",
        "Drafted Instagram captions with trending hashtags"
      ]
    },
    "suggestions": [
      "Complete Setup",
      "Schedule a post for tomorrow",
      "Show my content calendar",
      "What's the best time to post?",
      "Draft a LinkedIn post",
      "Create a posting schedule",
      "Analyze my posting strategy"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/social_media_scheduler"
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "suggestion_buttons",
        "calendar_integration"
      ]
    },
    "personality": {
      "tone": "professional yet friendly",
      "style": "strategic and organized",
      "approach": "proactive scheduling and optimization"
    },
    "ui_use": {
      "pages": [
        {
          "name": "Social Media Dashboard",
          "path": "/agents/social_media_scheduler/dashboard",
          "order": 1
        }
      ],
      "default_page": "/agents/social_media_scheduler/dashboard"
    }
  },
  {
    "agent": {
      "id": "content_repurposer_multi",
      "emoji": "✨",
      "name": "Content Repurposer Multi",
      "category": "MARKETING",
      "description": "Transform content into multiple platform formats",
      "uses_conversation_state": true,
      "specialization": "Content Repurposer",
      "tagline": "Repurpose. Convert. Deliver.",
      "avatar": "/Squidgy AI Assistants Avatars/10.png",
      "enabled": false,
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
      "Complete Setup",
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
      "id": "newsletter_multi",
      "emoji": "📰",
      "name": "Newsletter Agent Multi",
      "category": "MARKETING",
      "description": "Create and manage newsletters",
      "specialization": "Creative & Trendy",
      "tagline": "Content. Create. Distribute.",
      "avatar": "/Squidgy AI Assistants Avatars/7.png",
      "pinned": false,
      "enabled": false,
      "uses_conversation_state": true,
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
      "Complete Setup",
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
      "id": "newsletter",
      "emoji": "📧",
      "name": "Nyla | Newsletter Ninja",
      "category": "MARKETING",
      "description": "Craft and send engaging email newsletters to keep your audience informed and connected.",
      "specialization": "Newsletter Ninja",
      "tagline": "Content. Create. Distribute.",
      "avatar": "/Squidgy AI Assistants Avatars/4.png",
      "pinned": false,
      "enabled": false,
      "uses_conversation_state": true,
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
      "Complete Setup",
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
      "id": "social_media_agent",
      "emoji": "📱",
      "name": "Sophia | Social Media Superhero",
      "category": "MARKETING",
      "description": "Manage and schedule social media content across Facebook, Instagram, and LinkedIn.",
      "specialization": "Social Media Superhero",
      "tagline": "Consult. Confirm. Execute.",
      "avatar": "/Squidgy AI Assistants Avatars/16.png",
      "pinned": false,
      "enabled": true,
      "initial_message": "Hey! 👋 I'm your Social Media Manager, here to help you create, schedule, and manage content across Facebook, Instagram, and LinkedIn.<br><br>I follow a simple workflow: <strong>Consult</strong> (generate ideas), <strong>Confirm</strong> (get your approval), and <strong>Execute</strong> (schedule posts).<br><br>What would you like to work on today?",
      "sidebar_greeting": "Hi! I'm your Social Media Manager - your dedicated assistant for scheduling and managing social media content across multiple platforms. I can help with Facebook, Instagram, and LinkedIn posts. How can I assist you today?",
      "capabilities": [
        "Multi-platform post scheduling (Facebook, Instagram, LinkedIn)",
        "Content ideation and caption generation",
        "Image and video post management",
        "Story scheduling for Facebook and Instagram",
        "Media file upload and storage management",
        "UTC timezone conversion for global scheduling",
        "Post deletion with safety confirmations"
      ],
      "recent_actions": [
        "Scheduled 5 LinkedIn posts for the week",
        "Created Instagram story campaign for product launch",
        "Generated caption ideas for Facebook engagement post",
        "Uploaded media files to storage for reuse"
      ]
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Social Media Dashboard",
          "path": "social-media-dashboard",
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
      "Complete Setup",
      "Schedule a post for LinkedIn",
      "Create an Instagram image post",
      "Generate caption ideas for Facebook",
      "Schedule a story for Instagram",
      "Upload media to storage",
      "Show my scheduled posts"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/social_media_agent"
    },
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "consultative"
    },
    "platforms": {
      "facebook": {
        "accounts": [
          "The Ai Team",
          "Solair - Solar Energy Ai Assistant"
        ],
        "content_types": [
          "text",
          "image",
          "video",
          "story_image",
          "story_video"
        ]
      },
      "instagram": {
        "accounts": [
          "hiretheaiteam",
          "Seth Ward"
        ],
        "content_types": [
          "image",
          "video",
          "story_image",
          "story_video"
        ]
      },
      "linkedin": {
        "accounts": [
          "Seth Ward",
          "The Ai Team"
        ],
        "content_types": [
          "text",
          "image",
          "video"
        ]
      }
    },
    "media_handling": {
      "max_file_size_mb": 25,
      "supported_image_types": [
        "image/png",
        "image/jpeg"
      ],
      "supported_video_types": [
        "video/mp4"
      ]
    }
  },
  {
    "agent": {
      "id": "SOL",
      "emoji": "☀️",
      "name": "Stella | Solar Sales Specialist",
      "category": "SALES",
      "description": "Assist with solar enquiries, qualify leads, and guide prospects through the sales process.",
      "specialization": "Solar Sales Specialist",
      "tagline": "Illuminate. Calculate. Convert.",
      "avatar": "/Squidgy AI Assistants Avatars/5.png",
      "pinned": true,
      "enabled": false,
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
      "Complete Setup",
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
      "name": "Rita | Repurposing Maestro",
      "category": "SALES",
      "description": "Transform existing content into fresh formats for different platforms—turn blogs into social posts, videos into articles, and more.",
      "uses_conversation_state": true,
      "specialization": "Repurposing Maestro",
      "tagline": "Repurpose. Convert. Deliver.",
      "avatar": "/Squidgy AI Assistants Avatars/15.png",
      "enabled": false,
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
      "Complete Setup",
      "Repurpose blog to social posts",
      "Convert video to article",
      "Transform article to video script",
      "Generate multi-platform content",
      "Show my content library"
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
      "name": "Rita | Repurposing Maestro",
      "category": "SALES",
      "description": "Transform existing content into fresh formats for different platforms—turn blogs into social posts, videos into articles, and more.",
      "uses_conversation_state": true,
      "specialization": "Repurposing Maestro",
      "tagline": "Repurpose. Convert. Deliver.",
      "avatar": "/Squidgy AI Assistants Avatars/15.png",
      "enabled": false,
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
      "Complete Setup",
      "Repurpose blog to social posts",
      "Convert video to article",
      "Transform article to video script",
      "Generate multi-platform content",
      "Show my content library"
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
      "uses_conversation_state": true,
      "specialization": "Content Repurposer",
      "tagline": "Repurpose. Convert. Deliver.",
      "avatar": "/Squidgy AI Assistants Avatars/10.png",
      "enabled": false,
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
      "Complete Setup",
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
      "name": "Nyla | Newsletter Ninja",
      "category": "MARKETING",
      "description": "Craft and send engaging email newsletters to keep your audience informed and connected.",
      "specialization": "Newsletter Ninja",
      "tagline": "Content. Create. Distribute.",
      "avatar": "/Squidgy AI Assistants Avatars/4.png",
      "pinned": false,
      "enabled": false,
      "uses_conversation_state": true,
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
      "Complete Setup",
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
      "avatar": "/Squidgy AI Assistants Avatars/7.png",
      "pinned": false,
      "enabled": false,
      "uses_conversation_state": true,
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
      "Complete Setup",
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
      "name": "Pia | Personal Assistant",
      "category": "GENERAL",
      "description": "Help manage your day-to-day tasks and keep you organised.",
      "specialization": "Personal Assistant",
      "tagline": "Friendly & Helpful",
      "avatar": "/Squidgy AI Assistants Avatars/1.png",
      "pinned": true,
      "enabled": true,
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
      "Complete Setup",
      "Analyze my company website",
      "Recommend AI agents for my business",
      "Configure my brand voice and style",
      "Set up notifications and calendar",
      "➕ Add Another Assistant"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/personal_assistant_advanced"
    },
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "proactive"
    }
  },
  "social_media_agent": {
    "agent": {
      "id": "social_media_agent",
      "emoji": "📱",
      "name": "Sophia | Social Media Superhero",
      "category": "MARKETING",
      "description": "Manage and schedule social media content across Facebook, Instagram, and LinkedIn.",
      "specialization": "Social Media Superhero",
      "tagline": "Consult. Confirm. Execute.",
      "avatar": "/Squidgy AI Assistants Avatars/16.png",
      "pinned": false,
      "enabled": true,
      "initial_message": "Hey! 👋 I'm your Social Media Manager, here to help you create, schedule, and manage content across Facebook, Instagram, and LinkedIn.<br><br>I follow a simple workflow: <strong>Consult</strong> (generate ideas), <strong>Confirm</strong> (get your approval), and <strong>Execute</strong> (schedule posts).<br><br>What would you like to work on today?",
      "sidebar_greeting": "Hi! I'm your Social Media Manager - your dedicated assistant for scheduling and managing social media content across multiple platforms. I can help with Facebook, Instagram, and LinkedIn posts. How can I assist you today?",
      "capabilities": [
        "Multi-platform post scheduling (Facebook, Instagram, LinkedIn)",
        "Content ideation and caption generation",
        "Image and video post management",
        "Story scheduling for Facebook and Instagram",
        "Media file upload and storage management",
        "UTC timezone conversion for global scheduling",
        "Post deletion with safety confirmations"
      ],
      "recent_actions": [
        "Scheduled 5 LinkedIn posts for the week",
        "Created Instagram story campaign for product launch",
        "Generated caption ideas for Facebook engagement post",
        "Uploaded media files to storage for reuse"
      ]
    },
    "ui_use": {
      "page_type": "single_page",
      "pages": [
        {
          "name": "Social Media Dashboard",
          "path": "social-media-dashboard",
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
      "Complete Setup",
      "Schedule a post for LinkedIn",
      "Create an Instagram image post",
      "Generate caption ideas for Facebook",
      "Schedule a story for Instagram",
      "Upload media to storage",
      "Show my scheduled posts"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/social_media_agent"
    },
    "personality": {
      "tone": "professional",
      "style": "helpful",
      "approach": "consultative"
    },
    "platforms": {
      "facebook": {
        "accounts": [
          "The Ai Team",
          "Solair - Solar Energy Ai Assistant"
        ],
        "content_types": [
          "text",
          "image",
          "video",
          "story_image",
          "story_video"
        ]
      },
      "instagram": {
        "accounts": [
          "hiretheaiteam",
          "Seth Ward"
        ],
        "content_types": [
          "image",
          "video",
          "story_image",
          "story_video"
        ]
      },
      "linkedin": {
        "accounts": [
          "Seth Ward",
          "The Ai Team"
        ],
        "content_types": [
          "text",
          "image",
          "video"
        ]
      }
    },
    "media_handling": {
      "max_file_size_mb": 25,
      "supported_image_types": [
        "image/png",
        "image/jpeg"
      ],
      "supported_video_types": [
        "video/mp4"
      ]
    }
  },
  "social_media_scheduler": {
    "agent": {
      "id": "social_media_scheduler",
      "name": "Social Media Scheduler",
      "category": "MARKETING",
      "description": "Schedule and manage your social media posts across multiple platforms",
      "specialization": "Automated & Strategic",
      "tagline": "Schedule. Publish. Engage.",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=social-scheduler",
      "pinned": true,
      "enabled": true,
      "initial_message": "Hey! 👋 I'm your Social Media Scheduler. I can help you plan, schedule, and manage posts across all your social platforms. Want to schedule a post, check your content calendar, or analyze your posting strategy? Let's get started!",
      "capabilities": [
        "Schedule posts across multiple social media platforms",
        "Create and manage content calendars",
        "Optimize posting times for maximum engagement",
        "Draft social media content with hashtags and captions",
        "Track scheduled posts and publishing status",
        "Analyze best times to post based on audience data",
        "Manage social media campaigns and series",
        "Cross-platform content adaptation"
      ],
      "recent_actions": [
        "Scheduled 15 posts for next week's product launch",
        "Optimized posting times based on engagement analytics",
        "Created content calendar for Q1 campaign",
        "Drafted Instagram captions with trending hashtags"
      ]
    },
    "suggestions": [
      "Complete Setup",
      "Schedule a post for tomorrow",
      "Show my content calendar",
      "What's the best time to post?",
      "Draft a LinkedIn post",
      "Create a posting schedule",
      "Analyze my posting strategy"
    ],
    "n8n": {
      "webhook_url": "https://n8n.theaiteam.uk/webhook/social_media_scheduler"
    },
    "interface": {
      "type": "chat",
      "features": [
        "text_input",
        "file_upload",
        "suggestion_buttons",
        "calendar_integration"
      ]
    },
    "personality": {
      "tone": "professional yet friendly",
      "style": "strategic and organized",
      "approach": "proactive scheduling and optimization"
    },
    "ui_use": {
      "pages": [
        {
          "name": "Social Media Dashboard",
          "path": "/agents/social_media_scheduler/dashboard",
          "order": 1
        }
      ],
      "default_page": "/agents/social_media_scheduler/dashboard"
    }
  },
  "SOL": {
    "agent": {
      "id": "SOL",
      "emoji": "☀️",
      "name": "Stella | Solar Sales Specialist",
      "category": "SALES",
      "description": "Assist with solar enquiries, qualify leads, and guide prospects through the sales process.",
      "specialization": "Solar Sales Specialist",
      "tagline": "Illuminate. Calculate. Convert.",
      "avatar": "/Squidgy AI Assistants Avatars/5.png",
      "pinned": true,
      "enabled": false,
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
      "Complete Setup",
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
        "name": "Pia | Personal Assistant",
        "category": "GENERAL",
        "description": "Help manage your day-to-day tasks and keep you organised.",
        "specialization": "Personal Assistant",
        "tagline": "Friendly & Helpful",
        "avatar": "/Squidgy AI Assistants Avatars/1.png",
        "pinned": true,
        "enabled": true,
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
        "Complete Setup",
        "Analyze my company website",
        "Recommend AI agents for my business",
        "Configure my brand voice and style",
        "Set up notifications and calendar",
        "➕ Add Another Assistant"
      ],
      "n8n": {
        "webhook_url": "https://n8n.theaiteam.uk/webhook/personal_assistant_advanced"
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
        "id": "social_media_scheduler",
        "name": "Social Media Scheduler",
        "category": "MARKETING",
        "description": "Schedule and manage your social media posts across multiple platforms",
        "specialization": "Automated & Strategic",
        "tagline": "Schedule. Publish. Engage.",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=social-scheduler",
        "pinned": true,
        "enabled": true,
        "initial_message": "Hey! 👋 I'm your Social Media Scheduler. I can help you plan, schedule, and manage posts across all your social platforms. Want to schedule a post, check your content calendar, or analyze your posting strategy? Let's get started!",
        "capabilities": [
          "Schedule posts across multiple social media platforms",
          "Create and manage content calendars",
          "Optimize posting times for maximum engagement",
          "Draft social media content with hashtags and captions",
          "Track scheduled posts and publishing status",
          "Analyze best times to post based on audience data",
          "Manage social media campaigns and series",
          "Cross-platform content adaptation"
        ],
        "recent_actions": [
          "Scheduled 15 posts for next week's product launch",
          "Optimized posting times based on engagement analytics",
          "Created content calendar for Q1 campaign",
          "Drafted Instagram captions with trending hashtags"
        ]
      },
      "suggestions": [
        "Complete Setup",
        "Schedule a post for tomorrow",
        "Show my content calendar",
        "What's the best time to post?",
        "Draft a LinkedIn post",
        "Create a posting schedule",
        "Analyze my posting strategy"
      ],
      "n8n": {
        "webhook_url": "https://n8n.theaiteam.uk/webhook/social_media_scheduler"
      },
      "interface": {
        "type": "chat",
        "features": [
          "text_input",
          "file_upload",
          "suggestion_buttons",
          "calendar_integration"
        ]
      },
      "personality": {
        "tone": "professional yet friendly",
        "style": "strategic and organized",
        "approach": "proactive scheduling and optimization"
      },
      "ui_use": {
        "pages": [
          {
            "name": "Social Media Dashboard",
            "path": "/agents/social_media_scheduler/dashboard",
            "order": 1
          }
        ],
        "default_page": "/agents/social_media_scheduler/dashboard"
      }
    },
    {
      "agent": {
        "id": "content_repurposer_multi",
        "emoji": "✨",
        "name": "Content Repurposer Multi",
        "category": "MARKETING",
        "description": "Transform content into multiple platform formats",
        "uses_conversation_state": true,
        "specialization": "Content Repurposer",
        "tagline": "Repurpose. Convert. Deliver.",
        "avatar": "/Squidgy AI Assistants Avatars/10.png",
        "enabled": false,
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
        "Complete Setup",
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
        "id": "newsletter_multi",
        "emoji": "📰",
        "name": "Newsletter Agent Multi",
        "category": "MARKETING",
        "description": "Create and manage newsletters",
        "specialization": "Creative & Trendy",
        "tagline": "Content. Create. Distribute.",
        "avatar": "/Squidgy AI Assistants Avatars/7.png",
        "pinned": false,
        "enabled": false,
        "uses_conversation_state": true,
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
        "Complete Setup",
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
        "id": "newsletter",
        "emoji": "📧",
        "name": "Nyla | Newsletter Ninja",
        "category": "MARKETING",
        "description": "Craft and send engaging email newsletters to keep your audience informed and connected.",
        "specialization": "Newsletter Ninja",
        "tagline": "Content. Create. Distribute.",
        "avatar": "/Squidgy AI Assistants Avatars/4.png",
        "pinned": false,
        "enabled": false,
        "uses_conversation_state": true,
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
        "Complete Setup",
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
        "id": "social_media_agent",
        "emoji": "📱",
        "name": "Sophia | Social Media Superhero",
        "category": "MARKETING",
        "description": "Manage and schedule social media content across Facebook, Instagram, and LinkedIn.",
        "specialization": "Social Media Superhero",
        "tagline": "Consult. Confirm. Execute.",
        "avatar": "/Squidgy AI Assistants Avatars/16.png",
        "pinned": false,
        "enabled": true,
        "initial_message": "Hey! 👋 I'm your Social Media Manager, here to help you create, schedule, and manage content across Facebook, Instagram, and LinkedIn.<br><br>I follow a simple workflow: <strong>Consult</strong> (generate ideas), <strong>Confirm</strong> (get your approval), and <strong>Execute</strong> (schedule posts).<br><br>What would you like to work on today?",
        "sidebar_greeting": "Hi! I'm your Social Media Manager - your dedicated assistant for scheduling and managing social media content across multiple platforms. I can help with Facebook, Instagram, and LinkedIn posts. How can I assist you today?",
        "capabilities": [
          "Multi-platform post scheduling (Facebook, Instagram, LinkedIn)",
          "Content ideation and caption generation",
          "Image and video post management",
          "Story scheduling for Facebook and Instagram",
          "Media file upload and storage management",
          "UTC timezone conversion for global scheduling",
          "Post deletion with safety confirmations"
        ],
        "recent_actions": [
          "Scheduled 5 LinkedIn posts for the week",
          "Created Instagram story campaign for product launch",
          "Generated caption ideas for Facebook engagement post",
          "Uploaded media files to storage for reuse"
        ]
      },
      "ui_use": {
        "page_type": "single_page",
        "pages": [
          {
            "name": "Social Media Dashboard",
            "path": "social-media-dashboard",
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
        "Complete Setup",
        "Schedule a post for LinkedIn",
        "Create an Instagram image post",
        "Generate caption ideas for Facebook",
        "Schedule a story for Instagram",
        "Upload media to storage",
        "Show my scheduled posts"
      ],
      "n8n": {
        "webhook_url": "https://n8n.theaiteam.uk/webhook/social_media_agent"
      },
      "personality": {
        "tone": "professional",
        "style": "helpful",
        "approach": "consultative"
      },
      "platforms": {
        "facebook": {
          "accounts": [
            "The Ai Team",
            "Solair - Solar Energy Ai Assistant"
          ],
          "content_types": [
            "text",
            "image",
            "video",
            "story_image",
            "story_video"
          ]
        },
        "instagram": {
          "accounts": [
            "hiretheaiteam",
            "Seth Ward"
          ],
          "content_types": [
            "image",
            "video",
            "story_image",
            "story_video"
          ]
        },
        "linkedin": {
          "accounts": [
            "Seth Ward",
            "The Ai Team"
          ],
          "content_types": [
            "text",
            "image",
            "video"
          ]
        }
      },
      "media_handling": {
        "max_file_size_mb": 25,
        "supported_image_types": [
          "image/png",
          "image/jpeg"
        ],
        "supported_video_types": [
          "video/mp4"
        ]
      }
    }
  ],
  "SALES": [
    {
      "agent": {
        "id": "SOL",
        "emoji": "☀️",
        "name": "Stella | Solar Sales Specialist",
        "category": "SALES",
        "description": "Assist with solar enquiries, qualify leads, and guide prospects through the sales process.",
        "specialization": "Solar Sales Specialist",
        "tagline": "Illuminate. Calculate. Convert.",
        "avatar": "/Squidgy AI Assistants Avatars/5.png",
        "pinned": true,
        "enabled": false,
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
        "Complete Setup",
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
        "name": "Rita | Repurposing Maestro",
        "category": "SALES",
        "description": "Transform existing content into fresh formats for different platforms—turn blogs into social posts, videos into articles, and more.",
        "uses_conversation_state": true,
        "specialization": "Repurposing Maestro",
        "tagline": "Repurpose. Convert. Deliver.",
        "avatar": "/Squidgy AI Assistants Avatars/15.png",
        "enabled": false,
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
        "Complete Setup",
        "Repurpose blog to social posts",
        "Convert video to article",
        "Transform article to video script",
        "Generate multi-platform content",
        "Show my content library"
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
export const AGENT_IDS: string[] = ["content_repurposer","content_repurposer_multi","newsletter","newsletter_multi","personal_assistant","social_media_agent","social_media_scheduler","SOL"];

// Total count
export const TOTAL_AGENTS = 8;
