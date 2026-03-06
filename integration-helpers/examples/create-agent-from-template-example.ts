/**
 * Example: Create Agent from N8N Template
 * 
 * This example demonstrates how to programmatically create a new agent
 * using an existing N8N workflow template.
 */

import { N8NTemplateService } from '../../server/services/n8nTemplateService';
import { AgentBuilderService } from '../../server/services/agentBuilderService';
import * as fs from 'fs';
import * as path from 'path';

async function createAgentFromTemplate() {
  const n8nService = N8NTemplateService.getInstance();
  const agentBuilder = AgentBuilderService.getInstance();

  // ============================================================================
  // STEP 1: Download Template Workflow
  // ============================================================================
  
  console.log('Step 1: Downloading template workflow...');
  
  // Use fixed template ID
  const templateId = 'ijDtq0ljM2atxA0E'; // Standard agent template
  
  const template = await n8nService.downloadTemplate(templateId);
  console.log(`✓ Downloaded: ${template.name}`);
  console.log(`  Nodes: ${template.nodes.length}`);

  // ============================================================================
  // STEP 2: Define Agent Configuration
  // ============================================================================
  
  console.log('\nStep 2: Defining agent configuration...');
  
  const agentConfig = {
    name: 'Email Marketing Manager',
    id: 'email_marketing_manager',
    purpose: 'Manage email campaigns and newsletters',
    category: 'MARKETING' as const,
    capabilities: [
      'Create email campaigns',
      'Schedule newsletter sends',
      'Manage subscriber lists',
      'Track email performance',
      'A/B test subject lines'
    ],
    tone: 'professional',
    style: 'helpful',
    approach: 'data_driven'
  };

  console.log(`✓ Agent: ${agentConfig.name} (${agentConfig.id})`);

  // ============================================================================
  // STEP 3: Generate System Prompt
  // ============================================================================
  
  console.log('\nStep 3: Generating system prompt...');
  
  const systemPrompt = `You are ${agentConfig.name}, ${agentConfig.purpose}.

Your capabilities:
${agentConfig.capabilities.map(c => `- ${c}`).join('\n')}

Communication style:
- Tone: ${agentConfig.tone}
- Style: ${agentConfig.style}
- Approach: ${agentConfig.approach}

User message: {{ $json.user_mssg }}

Instructions:
1. Use available tools to accomplish tasks
2. Be specific and actionable in your responses
3. Track campaign performance and provide insights
4. Suggest optimizations based on data

Respond helpfully and professionally.`;

  console.log('✓ System prompt generated');

  // ============================================================================
  // STEP 4: Customize Workflow
  // ============================================================================
  
  console.log('\nStep 4: Customizing workflow...');
  
  let customizedWorkflow = n8nService.customizeWorkflowForAgent(
    template,
    agentConfig.id,
    agentConfig.name,
    systemPrompt,
    agentConfig.id // webhook path
  );

  console.log('✓ Workflow customized');
  console.log(`  Webhook path: /${agentConfig.id}`);

  // ============================================================================
  // STEP 5: Add Tool Nodes
  // ============================================================================
  
  console.log('\nStep 5: Adding tool nodes...');
  
  // Option A: Auto-generate from capabilities
  const autoTools = n8nService.generateToolNodesFromCapabilities(agentConfig.capabilities);
  console.log(`  Auto-generated: ${autoTools.length} tools`);

  // Option B: Define custom tools
  const customTools = [
    {
      name: 'Send Email Campaign',
      type: 'n8n-nodes-base.httpRequestTool',
      parameters: {
        method: 'POST',
        url: '={{$env.BACKEND_URL}}/api/email/send-campaign',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: '=Bearer {{$env.API_TOKEN}}' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'user_id', value: '={{$json.user_id}}' },
            { name: 'campaign_id', value: '={{$json.campaign_id}}' },
            { name: 'subject', value: '={{$json.subject}}' },
            { name: 'content', value: '={{$json.content}}' },
            { name: 'recipient_list', value: '={{$json.recipient_list}}' }
          ]
        }
      },
      description: 'Send email campaign to subscriber list'
    },
    {
      name: 'Get Campaign Analytics',
      type: 'n8n-nodes-base.httpRequestTool',
      parameters: {
        method: 'GET',
        url: '={{$env.BACKEND_URL}}/api/email/analytics',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: '=Bearer {{$env.API_TOKEN}}' }
          ]
        },
        sendQuery: true,
        queryParameters: {
          parameters: [
            { name: 'user_id', value: '={{$json.user_id}}' },
            { name: 'campaign_id', value: '={{$json.campaign_id}}' }
          ]
        }
      },
      description: 'Get email campaign performance metrics'
    }
  ];

  // Combine auto-generated and custom tools
  const allTools = [...autoTools, ...customTools];
  console.log(`  Total tools: ${allTools.length}`);

  // Add tools to workflow
  customizedWorkflow = n8nService.addToolNodesToWorkflow(
    customizedWorkflow,
    allTools,
    'AI Agent' // AI Agent node name
  );

  console.log('✓ Tool nodes added to workflow');

  // ============================================================================
  // STEP 6: Additional Customizations (Optional)
  // ============================================================================
  
  console.log('\nStep 6: Applying additional customizations...');
  
  // Modify specific nodes
  const additionalMods = [
    {
      nodeName: 'OpenRouter Chat Model',
      modifications: [
        { path: 'parameters.model', value: 'anthropic/claude-3-5-sonnet' }
      ]
    },
    {
      nodeName: 'Conversation Memory',
      modifications: [
        { path: 'parameters.contextWindowLength', value: 100 }
      ]
    }
  ];

  customizedWorkflow = n8nService.modifyWorkflowNodes(customizedWorkflow, additionalMods);
  console.log('✓ Additional customizations applied');

  // ============================================================================
  // STEP 7: Update Shared Workflow Template
  // ============================================================================
  
  console.log('\nStep 7: Updating shared workflow template...');
  
  // Update shared template
  const sharedDir = path.join(process.cwd(), 'client', 'shared');
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  const sharedTemplatePath = path.join(sharedDir, 'n8n_workflow_template.json');
  fs.writeFileSync(sharedTemplatePath, JSON.stringify(customizedWorkflow, null, 2), 'utf8');
  console.log(`✓ Shared workflow template updated: ${sharedTemplatePath}`);
  
  // Create client agent directory for config files
  const clientAgentDir = path.join(process.cwd(), 'client', agentConfig.id);
  if (!fs.existsSync(clientAgentDir)) {
    fs.mkdirSync(clientAgentDir, { recursive: true });
  }

  // ============================================================================
  // STEP 8: Deploy to N8N
  // ============================================================================
  
  console.log('\nStep 8: Deploying to N8N...');
  
  try {
    const deployment = await n8nService.deployWorkflow(
      customizedWorkflow,
      `${agentConfig.name} - Workflow`
    );

    console.log('✓ Workflow deployed!');
    console.log(`  Workflow ID: ${deployment.id}`);
    console.log(`  URL: ${deployment.url}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Manual steps required in N8N UI:');
    console.log('  1. Open the workflow in N8N');
    console.log('  2. Set credentials (OpenRouter, Supabase, etc.)');
    console.log('  3. Click "Publish" to activate');
    console.log('  4. Move to Squidgy folder');
  } catch (error: any) {
    console.error('✗ Deployment failed:', error.message);
    console.log('  You can manually import the workflow from:', sharedTemplatePath);
  }

  // ============================================================================
  // STEP 9: Generate Agent YAML Configuration
  // ============================================================================
  
  console.log('\nStep 9: Generating agent configuration...');
  
  const yamlContent = agentBuilder.generateYAML(agentConfig);
  const yamlPath = path.join(clientAgentDir, 'config.yaml');

  fs.writeFileSync(yamlPath, yamlContent, 'utf8');
  console.log(`✓ YAML configuration saved: ${yamlPath}`);

  // ============================================================================
  // STEP 10: Create System Prompt File
  // ============================================================================
  
  console.log('\nStep 10: Creating system prompt file...');
  
  const systemPromptPath = path.join(clientAgentDir, 'system_prompt.md');
  const systemPromptContent = `# ${agentConfig.name}

${agentConfig.purpose}

=======================================================================
## PRIMARY RESPONSIBILITIES

${agentConfig.capabilities.map((c, i) => `${i + 1}. **${c}**`).join('\n')}

=======================================================================
## WORKFLOWS

### Email Campaign Creation
1. Gather campaign requirements from user
2. Draft email content
3. Review and refine with user
4. Schedule or send campaign
5. Track performance metrics

### Performance Analysis
1. Retrieve campaign analytics
2. Analyze open rates, click rates, conversions
3. Identify trends and patterns
4. Provide actionable recommendations

=======================================================================
## TOOL USAGE

### Send Email Campaign
Use when user wants to send an email to their subscriber list.
Required parameters: campaign_id, subject, content, recipient_list

### Get Campaign Analytics
Use to retrieve performance metrics for a specific campaign.
Required parameters: campaign_id

### Search Knowledge Base
Use to find information about email best practices, templates, or user preferences.

=======================================================================
## ROUTING RULES

Stay focused on email marketing tasks. For other marketing needs (social media, content creation), route to appropriate agents via Personal Assistant.
`;

  fs.writeFileSync(systemPromptPath, systemPromptContent, 'utf8');
  console.log(`✓ System prompt saved: ${systemPromptPath}`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ AGENT CREATION COMPLETE!');
  console.log('='.repeat(70));
  console.log('');
  console.log('Agent Details:');
  console.log(`  Name: ${agentConfig.name}`);
  console.log(`  ID: ${agentConfig.id}`);
  console.log(`  Category: ${agentConfig.category}`);
  console.log(`  Capabilities: ${agentConfig.capabilities.length}`);
  console.log(`  Tools: ${allTools.length}`);
  console.log('');
  console.log('Files Created:');
  console.log(`  ✓ ${yamlPath}`);
  console.log(`  ✓ ${systemPromptPath}`);
  console.log(`  ✓ Shared template: ${sharedTemplatePath}`);
  console.log('');
  console.log('Next Steps:');
  console.log('  1. Complete manual N8N setup (see above)');
  console.log('  2. Run: node scripts/build-agents.js');
  console.log('  3. Test your agent!');
  console.log('');
}

// Run the example
createAgentFromTemplate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
