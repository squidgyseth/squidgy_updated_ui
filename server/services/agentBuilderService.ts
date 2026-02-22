/**
 * Agent Builder Service
 * Handles conversational agent creation and YAML generation
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentBuilderConversation {
  // Basic Info
  purpose?: string;
  category?: 'MARKETING' | 'SALES' | 'HR' | 'SUPPORT' | 'OPERATIONS' | 'GENERAL';
  name?: string;
  id?: string;

  // Personality
  tone?: string;
  style?: string;
  approach?: string;

  // Capabilities
  capabilities?: string[];
  platforms?: string[];
  integrations?: string[];

  // UI
  needsCustomUI?: boolean;
  figmaUrl?: string;

  // Complexity
  detectedTier?: 1 | 2 | 3 | 4;

  // Conditional Wizard Support
  hasConditionalWizard?: boolean;
  wizardPhases?: WizardPhase[];
  conversationStateSchema?: ConversationStateSchema;
  databaseSchema?: DatabaseSchema;
  knowledgeBaseFiles?: KnowledgeBaseFile[];
  importCapabilities?: ImportCapability[];

  // State
  phase?: 'purpose' | 'category' | 'naming' | 'personality' | 'capabilities' | 'integrations' | 'ui' | 'complete';
}

export interface WizardPhase {
  id: string;
  description: string;
  triggers?: string[];
  steps?: WizardStep[];
  outputs?: string;
}

export interface WizardStep {
  id: string;
  question: string;
  stores_to: string;
  follow_up_prompts?: string[];
  good_examples?: string[];
  avoid_examples?: string[];
}

export interface ConversationStateSchema {
  phase: string;
  brand_exists?: string;
  wizard_step?: string;
  wizard_data?: Record<string, string>;
  import_status?: string;
  last_interaction?: string;
  [key: string]: any;
}

export interface DatabaseSchema {
  table: string;
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: string;
}

export interface KnowledgeBaseFile {
  file: string;
  description: string;
  content?: string;
}

export interface ImportCapability {
  supported_formats: string[];
  extraction_targets: string[];
}

export interface GeneratedAgentConfig {
  yamlPath: string;
  yamlContent: string;
  n8nWorkflowPath?: string;
  n8nWorkflowContent?: string;
  integrationScripts?: string[];
  setupGuide: string;
  tier: number;
}

export class AgentBuilderService {
  private static instance: AgentBuilderService;

  private constructor() {}

  static getInstance(): AgentBuilderService {
    if (!AgentBuilderService.instance) {
      AgentBuilderService.instance = new AgentBuilderService();
    }
    return AgentBuilderService.instance;
  }

  /**
   * Detect agent complexity tier based on conversation
   */
  detectTier(conversation: AgentBuilderConversation): 1 | 2 | 3 | 4 {
    const { platforms = [], integrations = [], needsCustomUI = false } = conversation;

    // Tier 4: Custom UI
    if (needsCustomUI) {
      return 4;
    }

    // Tier 3: Complex integrations or domain-specific
    const complexIntegrations = ['calculator', 'maps', 'external_api', 'regional_config'];
    if (integrations.some(i => complexIntegrations.includes(i))) {
      return 3;
    }

    // Tier 2: Multiple platforms
    if (platforms.length > 0 || integrations.length > 1) {
      return 2;
    }

    // Tier 1: Basic
    return 1;
  }

  /**
   * Generate agent ID from name
   */
  generateAgentId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Generate complete YAML configuration
   */
  generateYAML(conversation: AgentBuilderConversation): string {
    const tier = this.detectTier(conversation);
    const agentId = conversation.id || this.generateAgentId(conversation.name || 'new_agent');

    const config: any = {
      agent: {
        id: agentId,
        emoji: this.selectEmoji(conversation.category),
        name: conversation.name || 'New Agent',
        category: conversation.category || 'GENERAL',
        description: conversation.purpose || 'AI agent to help with tasks',
        specialization: this.generateSpecialization(conversation),
        tagline: this.generateTagline(conversation),
        avatar: `/Squidgy AI Assistants Avatars/${Math.floor(Math.random() * 16) + 1}.png`,
        pinned: false,
        enabled: true,
        initial_message: this.generateInitialMessage(conversation, agentId),
        sidebar_greeting: this.generateSidebarGreeting(conversation),
        capabilities: conversation.capabilities || this.generateCapabilities(conversation),
        recent_actions: this.generateRecentActions(conversation)
      },

      ui_use: {
        page_type: 'single_page',
        pages: [{
          name: `${conversation.name} Dashboard`,
          path: `${agentId}-dashboard`,
          order: 1,
          validated: true
        }]
      },

      interface: {
        type: 'chat',
        features: this.generateInterfaceFeatures(conversation, tier)
      },

      suggestions: this.generateSuggestions(conversation),

      n8n: {
        webhook_url: `https://n8n.theaiteam.uk/webhook/${agentId}`
      },

      personality: {
        tone: conversation.tone || 'professional',
        style: conversation.style || 'helpful',
        approach: conversation.approach || 'proactive'
      }
    };

    // Add conditional wizard configuration if applicable
    if (conversation.hasConditionalWizard) {
      config.agent.uses_conversation_state = true;

      if (conversation.wizardPhases && conversation.wizardPhases.length > 0) {
        config[`${agentId}_config`] = {
          wizard_phases: conversation.wizardPhases
        };

        if (conversation.databaseSchema) {
          config[`${agentId}_config`].database = conversation.databaseSchema;
        }

        if (conversation.importCapabilities && conversation.importCapabilities.length > 0) {
          config[`${agentId}_config`].import = conversation.importCapabilities[0];
        }

        if (conversation.knowledgeBaseFiles && conversation.knowledgeBaseFiles.length > 0) {
          config[`${agentId}_config`].knowledge_base = conversation.knowledgeBaseFiles;
        }
      }

      if (conversation.conversationStateSchema) {
        config.conversation_state_schema = conversation.conversationStateSchema;
      }
    }

    // Add platform configs for Tier 2
    if (tier === 2 && conversation.platforms && conversation.platforms.length > 0) {
      (config as any).platforms = this.generatePlatformConfig(conversation.platforms);
    }

    // Add domain config for Tier 3
    if (tier === 3) {
      (config as any).domain_config = this.generateDomainConfig(conversation);
    }

    // Add UI config for Tier 4
    if (tier === 4) {
      (config as any).ui = {
        page_type: 'multi_page',
        figma_url: conversation.figmaUrl || '',
        figma_deployed_url: '',
        figma_token: 'figd_VBNaIIUBmyE1DNKT5SdAUXnRLBWjczDJ30N0DXkd'
      };
    }

    return yaml.dump(config, { lineWidth: -1, noRefs: true });
  }

  /**
   * Generate N8N workflow template
   */
  generateN8NWorkflow(conversation: AgentBuilderConversation): any {
    const agentId = conversation.id || this.generateAgentId(conversation.name || 'new_agent');
    const tier = this.detectTier(conversation);

    // If agent has conditional wizard, generate conditional workflow
    if (conversation.hasConditionalWizard) {
      return this.generateConditionalWizardWorkflow(conversation);
    }

    const workflow = {
      name: `${conversation.name} - Workflow`,
      nodes: [
        // Webhook trigger
        {
          parameters: {
            httpMethod: 'POST',
            path: `/${agentId}`,
            responseMode: 'responseNode',
            options: {}
          },
          type: 'n8n-nodes-base.webhook',
          typeVersion: 2,
          position: [0, 300],
          id: `webhook-${agentId}`,
          name: 'Webhook',
          webhookId: `${agentId}-webhook`
        },

        // Code node for data preparation
        {
          parameters: {
            jsCode: this.generateCodeNodeLogic(conversation)
          },
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [200, 300],
          id: `code-prepare-${agentId}`,
          name: 'Code - Prepare Data'
        },

        // AI Agent node
        {
          parameters: {
            promptType: 'define',
            text: this.generateAIPrompt(conversation),
            hasOutputParser: true,
            options: {}
          },
          type: '@n8n/n8n-nodes-langchain.agent',
          typeVersion: 1.8,
          position: [400, 300],
          id: `ai-agent-${agentId}`,
          name: 'AI Agent'
        },

        // LLM node
        {
          parameters: {
            model: 'anthropic/claude-3-haiku',
            options: {
              responseFormat: 'text'
            }
          },
          type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
          typeVersion: 1,
          position: [400, 500],
          id: `llm-${agentId}`,
          name: 'OpenRouter Chat Model',
          credentials: {
            openRouterApi: {
              id: 'YOUR_OPENROUTER_CREDENTIAL_ID',
              name: 'OpenRouter'
            }
          }
        },

        // Conversation Memory node
        {
          parameters: {
            sessionIdType: 'customKey',
            sessionKey: "={{ $('Code - Prepare Data').item.json.session_id }}",
            contextWindowLength: 100
          },
          type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
          typeVersion: 1.3,
          position: [600, 500],
          id: `memory-${agentId}`,
          name: 'Conversation Memory'
        },

        // Format Response node
        {
          parameters: {
            jsCode: this.generateFormatResponseCode(conversation)
          },
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [600, 300],
          id: `format-${agentId}`,
          name: 'Format Response'
        },

        // Response node
        {
          parameters: {
            respondWith: 'text',
            responseBody: "={{ $json }}",
            options: {
              responseContentType: 'application/json'
            }
          },
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1.1,
          position: [800, 300],
          id: `respond-${agentId}`,
          name: 'Respond to Webhook'
        }
      ],
      connections: {
        'Webhook': {
          main: [[{ node: 'Code - Prepare Data', type: 'main', index: 0 }]]
        },
        'Code - Prepare Data': {
          main: [[{ node: 'AI Agent', type: 'main', index: 0 }]]
        },
        'AI Agent': {
          main: [[{ node: 'Format Response', type: 'main', index: 0 }]]
        },
        'Format Response': {
          main: [[{ node: 'Respond to Webhook', type: 'main', index: 0 }]]
        },
        'OpenRouter Chat Model': {
          ai_languageModel: [[{ node: 'AI Agent', type: 'ai_languageModel', index: 0 }]]
        },
        'Conversation Memory': {
          ai_memory: [[{ node: 'AI Agent', type: 'ai_memory', index: 0 }]]
        }
      },
      active: false,
      settings: {
        executionOrder: 'v1'
      }
    };

    return workflow;
  }

  /**
   * Generate conditional wizard N8N workflow
   * Based on Brandy reference implementation pattern
   */
  private generateConditionalWizardWorkflow(conversation: AgentBuilderConversation): any {
    const agentId = conversation.id || this.generateAgentId(conversation.name || 'new_agent');
    const tableName = conversation.databaseSchema?.table || `${agentId}_data`;

    return {
      name: `${conversation.name} - Conditional Wizard Workflow`,
      nodes: [
        // Webhook trigger
        {
          parameters: {
            httpMethod: 'POST',
            path: `/${agentId}`,
            responseMode: 'responseNode',
            options: {}
          },
          type: 'n8n-nodes-base.webhook',
          typeVersion: 2,
          position: [0, 300],
          id: `webhook-${agentId}`,
          name: 'Webhook',
          webhookId: `${agentId}-webhook`
        },

        // Supabase check - Does data exist?
        {
          parameters: {
            operation: 'getAll',
            tableId: tableName,
            returnAll: false,
            options: {
              filter: {
                filterValues: [
                  {
                    key: 'user_id',
                    condition: 'equals',
                    value: '={{ $json.body.user_id }}'
                  }
                ]
              }
            }
          },
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: [200, 300],
          id: `supabase-check-${agentId}`,
          name: 'Supabase - Check Data Exists',
          credentials: {
            supabaseApi: {
              id: 'YOUR_SUPABASE_CREDENTIAL_ID',
              name: 'Supabase'
            }
          }
        },

        // Code - Determine Phase
        {
          parameters: {
            jsCode: this.generateConditionalLogic(conversation, tableName)
          },
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [400, 300],
          id: `code-determine-phase-${agentId}`,
          name: 'Code - Determine Phase'
        },

        // IF node - Route based on phase
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict'
              },
              conditions: [
                {
                  leftValue: '={{ $json.conversation_state.phase }}',
                  rightValue: 'advisor',
                  operator: {
                    type: 'string',
                    operation: 'equals'
                  }
                }
              ],
              combinator: 'and'
            },
            options: {}
          },
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [600, 300],
          id: `if-phase-${agentId}`,
          name: 'IF - Has Data?'
        },

        // Wizard Prompt (for assessment/wizard phases)
        {
          parameters: {
            promptType: 'define',
            text: this.generateWizardPrompt(conversation),
            hasOutputParser: true,
            options: {}
          },
          type: '@n8n/n8n-nodes-langchain.agent',
          typeVersion: 1.8,
          position: [800, 200],
          id: `ai-wizard-${agentId}`,
          name: 'AI Agent - Wizard Mode'
        },

        // Advisor Prompt (when data exists)
        {
          parameters: {
            promptType: 'define',
            text: this.generateAdvisorPrompt(conversation),
            hasOutputParser: false,
            options: {}
          },
          type: '@n8n/n8n-nodes-langchain.agent',
          typeVersion: 1.8,
          position: [800, 400],
          id: `ai-advisor-${agentId}`,
          name: 'AI Agent - Advisor Mode'
        },

        // LLM node (shared)
        {
          parameters: {
            model: 'anthropic/claude-3-5-sonnet',
            options: {
              responseFormat: 'text'
            }
          },
          type: '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
          typeVersion: 1,
          position: [800, 600],
          id: `llm-${agentId}`,
          name: 'OpenRouter Chat Model',
          credentials: {
            openRouterApi: {
              id: 'YOUR_OPENROUTER_CREDENTIAL_ID',
              name: 'OpenRouter'
            }
          }
        },

        // Structured Output Parser (for wizard mode)
        {
          parameters: {
            schemaType: 'fromJson',
            jsonSchema: JSON.stringify({
              type: 'object',
              properties: {
                agent_response: { type: 'string' },
                conversation_state: {
                  type: 'object',
                  properties: conversation.conversationStateSchema || {}
                }
              }
            })
          },
          type: '@n8n/n8n-nodes-langchain.outputParserStructured',
          typeVersion: 1.3,
          position: [800, 0],
          id: `parser-${agentId}`,
          name: 'Structured Output Parser',
        },

        // Response node
        {
          parameters: {
            respondWith: 'json',
            responseBody: `={
  "user_id": "{{ $('Webhook').item.json.body.user_id }}",
  "session_id": "{{ $('Webhook').item.json.body.session_id }}",
  "agent_name": "${agentId}",
  "timestamp_of_call_made": "{{ new Date().toISOString() }}",
  "request_id": "{{ $('Webhook').item.json.body.request_id }}",
  "agent_response": {{ $json.agent_response ? JSON.stringify($json.agent_response) : JSON.stringify($json.output) }},
  "conversation_state": {{ $json.conversation_state ? JSON.stringify($json.conversation_state) : '{}' }}
}`,
            options: {}
          },
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1.1,
          position: [1000, 300],
          id: `respond-${agentId}`,
          name: 'Respond to Webhook'
        }
      ],
      connections: {
        'Webhook': {
          main: [[{ node: 'Supabase - Check Data Exists', type: 'main', index: 0 }]]
        },
        'Supabase - Check Data Exists': {
          main: [[{ node: 'Code - Determine Phase', type: 'main', index: 0 }]]
        },
        'Code - Determine Phase': {
          main: [[{ node: 'IF - Has Data?', type: 'main', index: 0 }]]
        },
        'IF - Has Data?': {
          main: [
            [{ node: 'AI Agent - Wizard Mode', type: 'main', index: 0 }],  // false - no data
            [{ node: 'AI Agent - Advisor Mode', type: 'main', index: 0 }]  // true - has data
          ]
        },
        'AI Agent - Wizard Mode': {
          main: [[{ node: 'Respond to Webhook', type: 'main', index: 0 }]]
        },
        'AI Agent - Advisor Mode': {
          main: [[{ node: 'Respond to Webhook', type: 'main', index: 0 }]]
        },
        'OpenRouter Chat Model': {
          ai_languageModel: [
            [
              { node: 'AI Agent - Wizard Mode', type: 'ai_languageModel', index: 0 },
              { node: 'AI Agent - Advisor Mode', type: 'ai_languageModel', index: 0 }
            ]
          ]
        },
        'Structured Output Parser': {
          ai_outputParser: [[{ node: 'AI Agent - Wizard Mode', type: 'ai_outputParser', index: 0 }]]
        }
      },
      active: false,
      settings: {
        executionOrder: 'v1'
      }
    };
  }

  /**
   * Save generated agent to file
   */
  async saveAgent(conversation: AgentBuilderConversation): Promise<GeneratedAgentConfig> {
    const agentId = conversation.id || this.generateAgentId(conversation.name || 'new_agent');
    const tier = this.detectTier(conversation);

    // Generate YAML
    const yamlContent = this.generateYAML(conversation);
    const yamlPath = path.join(
      process.cwd(),
      'agents',
      'configs',
      `${agentId}.yaml`
    );

    // Save YAML
    fs.writeFileSync(yamlPath, yamlContent, 'utf8');

    // Generate N8N workflow
    const n8nWorkflow = this.generateN8NWorkflow(conversation);
    const n8nWorkflowPath = path.join(
      process.cwd(),
      'n8n',
      `${agentId}_workflow.json`
    );
    const n8nWorkflowContent = JSON.stringify(n8nWorkflow, null, 2);

    // Save N8N workflow
    if (!fs.existsSync(path.dirname(n8nWorkflowPath))) {
      fs.mkdirSync(path.dirname(n8nWorkflowPath), { recursive: true });
    }
    fs.writeFileSync(n8nWorkflowPath, n8nWorkflowContent, 'utf8');

    // Generate setup guide
    const setupGuide = this.generateSetupGuide(conversation, tier);

    return {
      yamlPath,
      yamlContent,
      n8nWorkflowPath,
      n8nWorkflowContent,
      integrationScripts: [],
      setupGuide,
      tier
    };
  }

  // Helper methods for content generation

  private selectEmoji(category?: string): string {
    const emojiMap: Record<string, string> = {
      MARKETING: '📱',
      SALES: '💼',
      HR: '👥',
      SUPPORT: '🎧',
      OPERATIONS: '⚙️',
      GENERAL: '🤖'
    };
    return emojiMap[category || 'GENERAL'] || '🤖';
  }

  private generateSpecialization(conversation: AgentBuilderConversation): string {
    return conversation.capabilities?.[0]?.split(' ').slice(0, 3).join(' ') || 'AI Specialist';
  }

  private generateTagline(conversation: AgentBuilderConversation): string {
    const { approach = 'proactive' } = conversation;
    const taglines: Record<string, string> = {
      proactive: 'Anticipate. Act. Achieve.',
      consultative: 'Consult. Confirm. Execute.',
      data_driven: 'Analyze. Optimize. Deliver.',
      solution_focused: 'Identify. Solve. Succeed.'
    };
    return taglines[approach] || 'Ready to help you succeed.';
  }

  private generateInitialMessage(conversation: AgentBuilderConversation, agentId: string): string {
    return `Hey! 👋 I'm ${conversation.name}, your ${conversation.purpose}.<br><br>I'm here to help you with ${conversation.capabilities?.[0] || 'your tasks'}. What would you like to work on today?<br><br>📋 <a href="/agent-settings/${agentId}" target="_blank" style="color: #7c3aed; text-decoration: underline;">Complete Setup</a>`;
  }

  private generateSidebarGreeting(conversation: AgentBuilderConversation): string {
    return `Hi! I'm ${conversation.name} - ${conversation.purpose}. How can I assist you today?`;
  }

  private generateCapabilities(conversation: AgentBuilderConversation): string[] {
    return conversation.capabilities || [
      `${conversation.purpose} automation`,
      'Multi-platform integration',
      'Real-time data processing',
      'Intelligent recommendations'
    ];
  }

  private generateRecentActions(conversation: AgentBuilderConversation): string[] {
    return [
      `Completed setup for ${conversation.name}`,
      'Processed user request successfully',
      'Generated insights and recommendations',
      'Automated workflow execution'
    ];
  }

  private generateInterfaceFeatures(conversation: AgentBuilderConversation, tier: number): string[] {
    const baseFeatures = ['text_input', 'suggestion_buttons'];

    if (tier >= 2) {
      baseFeatures.push('file_upload');
    }

    if (tier >= 3) {
      baseFeatures.push('voice_input');
    }

    return baseFeatures;
  }

  private generateSuggestions(conversation: AgentBuilderConversation): string[] {
    return [
      'Complete Setup',
      conversation.capabilities?.[0] || 'Get started',
      conversation.capabilities?.[1] || 'View dashboard',
      'Show help',
      'Get recommendations'
    ];
  }

  private generatePlatformConfig(platforms: string[]): any {
    const config: any = {};

    platforms.forEach(platform => {
      config[platform.toLowerCase()] = {
        accounts: [],
        content_types: ['text', 'image', 'video']
      };
    });

    return config;
  }

  private generateDomainConfig(conversation: AgentBuilderConversation): any {
    return {
      defaults: {},
      integrations: conversation.integrations || []
    };
  }

  private generateCodeNodeLogic(conversation: AgentBuilderConversation): string {
    return `// Prepare data for AI Agent
const webhookBody = $('Webhook').first().json.body;

return [{
  json: {
    user_id: webhookBody.user_id,
    user_mssg: webhookBody.user_mssg,
    session_id: webhookBody.session_id,
    agent_name: webhookBody.agent_name,
    timestamp_of_call_made: webhookBody.timestamp_of_call_made,
    request_id: webhookBody.request_id
  }
}];`;
  }

  private generateAIPrompt(conversation: AgentBuilderConversation): string {
    return `You are ${conversation.name}, ${conversation.purpose}.

Your role:
${conversation.capabilities?.map(c => `- ${c}`).join('\n') || '- Assist users with their requests'}

Communication style:
- Tone: ${conversation.tone || 'professional'}
- Style: ${conversation.style || 'helpful'}
- Approach: ${conversation.approach || 'proactive'}

User message: {{ $json.user_mssg }}

Respond helpfully and professionally.`;
  }

  private generateFormatResponseCode(conversation: AgentBuilderConversation): string {
    const agentId = conversation.id || this.generateAgentId(conversation.name || 'new_agent');

    return `// Format response to match frontend expectations
const webhookData = $('Code - Prepare Data').first().json;
const aiData = $('AI Agent').first().json;

// Extract AI response
let aiResponse = "I'm here to help!";

if (aiData.output) {
  if (typeof aiData.output === 'string') {
    aiResponse = aiData.output;
  } else if (typeof aiData.output === 'object') {
    aiResponse = aiData.output.response || JSON.stringify(aiData.output);
  }
}

// Return array with single item (N8N requirement)
return [{
  json: {
    user_id: webhookData.user_id,
    session_id: webhookData.session_id,
    agent_name: "${agentId}",
    timestamp_of_call_made: webhookData.timestamp_of_call_made,
    request_id: webhookData.request_id,
    agent_response: aiResponse,
    agent_status: "Ready"
  }
}];`;
  }

  private generateResponseBody(agentId: string): string {
    // DEPRECATED - kept for backwards compatibility
    // New workflows use Format Response node instead
    return `={
  "user_id": "{{ $('Code - Prepare Data').item.json.user_id }}",
  "session_id": "{{ $('Code - Prepare Data').item.json.session_id }}",
  "agent_name": "${agentId}",
  "timestamp_of_call_made": "{{ new Date().toISOString() }}",
  "request_id": "{{ $('Code - Prepare Data').item.json.request_id }}",
  "agent_response": {{ JSON.stringify($('AI Agent').item.json.output) }}
}`;
  }

  private generateSetupGuide(conversation: AgentBuilderConversation, tier: number): string {
    const agentId = conversation.id || this.generateAgentId(conversation.name || 'new_agent');

    return `# ${conversation.name} - Setup Guide

## 🎯 Agent Overview
- **Name**: ${conversation.name}
- **Category**: ${conversation.category}
- **Tier**: ${tier}
- **Purpose**: ${conversation.purpose}

## 📋 Setup Steps

### 1. YAML Configuration ✅
- Configuration saved to: \`agents/configs/${agentId}.yaml\`
- Agent ID: \`${agentId}\`

### 2. N8N Workflow Setup
- Workflow template saved to: \`n8n/${agentId}_workflow.json\`

**Import to N8N:**
1. Open N8N: https://n8n.theaiteam.uk
2. Click "Import from file"
3. Select: \`n8n/${agentId}_workflow.json\`
4. Configure credentials:
   - OpenRouter API (for LLM)
   - Supabase API (if using database)
5. Activate workflow

### 3. Integration Setup
${this.generateIntegrationSteps(conversation)}

### 4. Build & Deploy
\`\`\`bash
npm run build
npm run dev
\`\`\`

### 5. Test Your Agent
- Navigate to the agent in the sidebar
- Send a test message
- Verify responses are working

## 🚀 Next Steps
- Customize agent personality in YAML
- Add more capabilities
- Configure platform integrations
- Test thoroughly before production

---
Generated by Agent Builder (ACE)
`;
  }

  private generateIntegrationSteps(conversation: AgentBuilderConversation): string {
    if (!conversation.platforms || conversation.platforms.length === 0) {
      return '- No external integrations required';
    }

    return conversation.platforms.map(platform => {
      return `- **${platform}**: See \`/guides/integrations/${platform.toLowerCase()}-setup.md\``;
    }).join('\n');
  }

  /**
   * Generate conditional logic for determining agent phase
   */
  private generateConditionalLogic(conversation: AgentBuilderConversation, tableName: string): string {
    const columns = conversation.databaseSchema?.columns.map(c => c.name) || [];
    const checkConditions = columns.map(col => `${col} !== null && ${col} !== ''`).join(' && ');

    return `// Determine agent phase based on data existence
const webhookBody = $('Webhook').first().json.body;
const dataCheck = $('Supabase - Check Data Exists').first().json;

// Check if data exists and is complete
const dataExists = dataCheck && Object.keys(dataCheck).length > 0;
${columns.length > 0 ? `const isComplete = dataExists && (${checkConditions.replace(/\b([a-z_]+)\b/g, 'dataCheck.$1')});` : ''}

// Determine conversation state
let conversationState = {
  phase: ${columns.length > 0 ? 'isComplete ? "advisor" : "assessment"' : 'dataExists ? "advisor" : "assessment"'},
  data_exists: dataExists,
  last_interaction: new Date().toISOString()
};

// Merge with any existing state from webhook
if (webhookBody.conversation_state) {
  conversationState = {
    ...conversationState,
    ...webhookBody.conversation_state
  };
}

return [{
  json: {
    user_id: webhookBody.user_id,
    user_mssg: webhookBody.user_mssg,
    session_id: webhookBody.session_id,
    agent_name: webhookBody.agent_name,
    timestamp_of_call_made: webhookBody.timestamp_of_call_made,
    request_id: webhookBody.request_id,
    conversation_state: conversationState,
    existing_data: dataCheck || {}
  }
}];`;
  }

  /**
   * Generate wizard mode prompt (when data doesn't exist)
   */
  private generateWizardPrompt(conversation: AgentBuilderConversation): string {
    const wizardSteps = conversation.wizardPhases
      ?.find(p => p.steps)
      ?.steps
      ?.map((step, i) => `${i + 1}. ${step.question} (stores to: ${step.stores_to})`)
      .join('\n') || 'Guide the user through setup';

    return `You are ${conversation.name}, ${conversation.purpose}.

CURRENT MODE: Wizard/Assessment Mode

The user does NOT have data configured yet. Your role is to guide them through the setup process.

Wizard Steps:
${wizardSteps}

Current State:
- Phase: {{ $json.conversation_state.phase }}
- User Message: {{ $json.user_mssg }}

Instructions:
1. If phase is "assessment", offer options for getting started
2. If phase is "wizard", guide through the steps one by one
3. After each step, save data progressively
4. Track wizard progress in conversation_state

Return JSON with this structure:
{
  "agent_response": "Your conversational response to the user",
  "conversation_state": {
    "phase": "assessment|wizard|complete",
    "wizard_step": current_step_number,
    "wizard_data": { collected_data }
  }
}`;
  }

  /**
   * Generate advisor mode prompt (when data exists)
   */
  private generateAdvisorPrompt(conversation: AgentBuilderConversation): string {
    const capabilities = conversation.capabilities?.map(c => `- ${c}`).join('\n') || '- Provide expert guidance';

    return `You are ${conversation.name}, ${conversation.purpose}.

CURRENT MODE: Advisor Mode

The user HAS existing data. Your role is to provide expert guidance and assistance.

User's Existing Data:
{{ JSON.stringify($json.existing_data) }}

Capabilities:
${capabilities}

User Message: {{ $json.user_mssg }}

Instructions:
1. Reference their existing data when providing advice
2. Generate content aligned with their configuration
3. Answer questions about their setup
4. Provide actionable recommendations

Respond conversationally and helpfully.`;
  }
}
