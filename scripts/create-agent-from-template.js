#!/usr/bin/env node

/**
 * Create Agent from N8N Template
 * Downloads an N8N workflow template, customizes it, and deploys a new agent
 */

import readline from 'readline';
import { N8NTemplateService } from '../server/services/n8nTemplateService.ts';
import { AgentBuilderService } from '../server/services/agentBuilderService.ts';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const n8nService = N8NTemplateService.getInstance();
const agentBuilder = AgentBuilderService.getInstance();

const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function log(message, color = null) {
  if (color && colors[color]) {
    console.log(colors[color](message));
  } else {
    console.log(message);
  }
}

function logBox(title, content) {
  const width = 70;
  const border = '═'.repeat(width);

  console.log('\n' + colors.cyan('╔' + border + '╗'));
  console.log(colors.cyan('║') + colors.bold(` ${title.padEnd(width - 1)}`) + colors.cyan('║'));
  console.log(colors.cyan('╠' + border + '╣'));

  content.forEach(line => {
    console.log(colors.cyan('║') + ` ${line.padEnd(width - 1)}` + colors.cyan('║'));
  });

  console.log(colors.cyan('╚' + border + '╝') + '\n');
}

async function main() {
  console.clear();

  logBox('🏗️  AGENT BUILDER - Template-Based Creation', [
    '',
    'This tool creates a new agent using the standard N8N workflow',
    'template. It will:',
    '',
    '  1. Download the template workflow from N8N',
    '  2. Customize it for your new agent',
    '  3. Add tool nodes based on capabilities',
    '  4. Deploy the workflow back to N8N',
    '  5. Generate agent files in client/{agent_id}/',
    ''
  ]);

  try {
    // Step 1: Use fixed template ID
    const templateId = 'ijDtq0ljM2atxA0E';
    log('Step 1: Using Standard Template', 'cyan');
    log(`  Template ID: ${templateId}`, 'yellow');
    log('');

    // Step 2: Agent details
    log('\n' + '─'.repeat(70), 'cyan');
    log('Step 2: Agent Configuration', 'cyan');
    log('');

    const agentName = await ask('Agent name (e.g., "Social Media Manager"): ');
    const agentId = agentBuilder.generateAgentId(agentName);
    log(`  Generated ID: ${agentId}`, 'yellow');

    const agentPurpose = await ask('Agent purpose (what does it do?): ');
    
    const categoryOptions = 'MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL';
    const agentCategory = await ask(`Category (${categoryOptions}): `);

    // Step 3: Capabilities and tools
    log('\n' + '─'.repeat(70), 'cyan');
    log('Step 3: Capabilities & Tools', 'cyan');
    log('');
    log('Enter agent capabilities (one per line, empty line to finish):', 'yellow');
    
    const capabilities = [];
    while (true) {
      const capability = await ask(`  Capability ${capabilities.length + 1}: `);
      if (!capability) break;
      capabilities.push(capability);
    }

    log(`\n✓ ${capabilities.length} capabilities defined`, 'green');

    // Step 4: Download template to shared folder
    log('\n' + '─'.repeat(70), 'cyan');
    log('Step 4: Downloading Template', 'cyan');
    log('');

    log('Downloading workflow template from N8N...', 'yellow');
    
    // Download to client/shared/n8n_workflow_template.json
    const sharedDir = path.join(process.cwd(), 'client', 'shared');
    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir, { recursive: true });
    }
    
    const templatePath = path.join(sharedDir, 'n8n_workflow_template.json');
    const template = await n8nService.downloadAndSaveTemplate(templateId, templatePath);
    
    log(`✓ Template downloaded: ${template.name}`, 'green');
    log(`  Location: ${templatePath}`, 'cyan');
    log(`  Nodes: ${template.nodes.length}`, 'cyan');

    // Step 5: Customize workflow
    log('\n' + '─'.repeat(70), 'cyan');
    log('Step 5: Customizing Workflow', 'cyan');
    log('');

    // Generate system prompt
    const systemPrompt = `You are ${agentName}, ${agentPurpose}.

Your capabilities:
${capabilities.map(c => `- ${c}`).join('\n')}

Communication style:
- Tone: professional
- Style: helpful
- Approach: proactive

User message: {{ $json.user_mssg }}

Respond helpfully and professionally.`;

    log('Customizing workflow for agent...', 'yellow');
    let customizedWorkflow = n8nService.customizeWorkflowForAgent(
      template,
      agentId,
      agentName,
      systemPrompt,
      agentId
    );

    log('✓ Workflow customized', 'green');

    // Step 6: Add tool nodes
    const addTools = await ask('\nAdd tool nodes based on capabilities? (yes/no): ');
    
    if (addTools.toLowerCase() === 'yes' || addTools.toLowerCase() === 'y') {
      log('\nGenerating tool nodes...', 'yellow');
      const toolNodes = n8nService.generateToolNodesFromCapabilities(capabilities);
      
      if (toolNodes.length > 0) {
        log(`  Generated ${toolNodes.length} tool nodes:`, 'cyan');
        toolNodes.forEach(tool => {
          log(`    - ${tool.name} (${tool.type})`, 'cyan');
        });

        const aiAgentNodeName = await ask('\nAI Agent node name (default: "AI Agent"): ') || 'AI Agent';
        
        customizedWorkflow = n8nService.addToolNodesToWorkflow(
          customizedWorkflow,
          toolNodes,
          aiAgentNodeName
        );
        
        log('✓ Tool nodes added to workflow', 'green');
      } else {
        log('  No tool nodes generated from capabilities', 'yellow');
      }
    }

    // Step 7: Update shared workflow template
    log('\n' + '─'.repeat(70), 'cyan');
    log('Step 7: Updating Shared Workflow Template', 'cyan');
    log('');

    // Update the shared template file with customizations
    fs.writeFileSync(templatePath, JSON.stringify(customizedWorkflow, null, 2), 'utf8');
    log(`✓ Shared workflow template updated: ${templatePath}`, 'green');
    
    // Create client agent directory for config files only
    const clientAgentDir = path.join(process.cwd(), 'client', agentId);
    if (!fs.existsSync(clientAgentDir)) {
      fs.mkdirSync(clientAgentDir, { recursive: true });
    }

    // Step 8: Deploy to N8N
    const deployNow = await ask('\nDeploy workflow to N8N now? (yes/no): ');
    
    let deployedWorkflowId;
    if (deployNow.toLowerCase() === 'yes' || deployNow.toLowerCase() === 'y') {
      log('\nDeploying to N8N...', 'yellow');
      
      const deployment = await n8nService.deployWorkflow(
        customizedWorkflow,
        `${agentName} - Workflow`
      );
      
      deployedWorkflowId = deployment.id;
      log(`✓ Workflow deployed!`, 'green');
      log(`  Workflow ID: ${deployment.id}`, 'cyan');
      log(`  URL: ${deployment.url}`, 'cyan');
      log('', 'yellow');
      log('⚠️  IMPORTANT: Manual steps required in N8N UI:', 'yellow');
      log('  1. Open the workflow in N8N', 'yellow');
      log('  2. Set credentials (OpenRouter, Supabase, etc.)', 'yellow');
      log('  3. Click "Publish" to activate', 'yellow');
      log('  4. Move to Squidgy folder', 'yellow');
    }

    // Step 9: Generate YAML configuration
    log('\n' + '─'.repeat(70), 'cyan');
    log('Step 9: Generating Agent Configuration', 'cyan');
    log('');

    const conversation = {
      name: agentName,
      id: agentId,
      purpose: agentPurpose,
      category: agentCategory.toUpperCase(),
      capabilities: capabilities,
      tone: 'professional',
      style: 'helpful',
      approach: 'proactive'
    };

    const yamlContent = agentBuilder.generateYAML(conversation);
    const yamlPath = path.join(clientAgentDir, 'config.yaml');

    fs.writeFileSync(yamlPath, yamlContent, 'utf8');
    log(`✓ YAML configuration saved: ${yamlPath}`, 'green');

    // Create system_prompt.md
    const systemPromptPath = path.join(clientAgentDir, 'system_prompt.md');
    const systemPromptContent = `# ${agentName}

${agentPurpose}

=======================================================================
## PRIMARY RESPONSIBILITIES

${capabilities.map((c, i) => `${i + 1}. **${c}**`).join('\n')}

=======================================================================
## WORKFLOWS

### Standard Workflow
1. Receive user request
2. Process using available tools
3. Generate response
4. Return to user

=======================================================================
## TOOL USAGE

Use the available tools to accomplish tasks efficiently.

=======================================================================
## ROUTING RULES

Stay focused on your primary responsibilities. Escalate complex requests to the Personal Assistant if needed.
`;

    fs.writeFileSync(systemPromptPath, systemPromptContent, 'utf8');
    log(`✓ System prompt saved: ${systemPromptPath}`, 'green');

    // Step 10: Summary
    log('\n' + '═'.repeat(70), 'green');
    log('✅ AGENT CREATION COMPLETE!', 'green');
    log('═'.repeat(70), 'green');
    log('');
    log('Agent Details:', 'cyan');
    log(`  Name: ${agentName}`, 'cyan');
    log(`  ID: ${agentId}`, 'cyan');
    log(`  Category: ${agentCategory}`, 'cyan');
    log(`  Capabilities: ${capabilities.length}`, 'cyan');
    log('');
    log('Files Created:', 'cyan');
    log(`  ✓ ${yamlPath}`, 'green');
    log(`  ✓ ${systemPromptPath}`, 'green');
    log(`  ✓ Shared template: ${templatePath}`, 'green');
    if (deployedWorkflowId) {
      log(`  ✓ N8N Workflow: ${deployedWorkflowId}`, 'green');
    }
    log('');
    log('Next Steps:', 'yellow');
    log('  1. Review and customize the generated files', 'yellow');
    if (!deployedWorkflowId) {
      log('  2. Import workflow to N8N manually', 'yellow');
      log('  3. Set credentials in N8N', 'yellow');
      log('  4. Publish workflow in N8N', 'yellow');
    } else {
      log('  2. Complete manual N8N setup (see above)', 'yellow');
    }
    log('  5. Run: node scripts/build-agents.js', 'yellow');
    log('  6. Test your agent!', 'yellow');
    log('');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    log('', 'red');
    log('Troubleshooting:', 'yellow');
    log('  - Check N8N API key is configured', 'yellow');
    log('  - Verify template workflow ID is correct', 'yellow');
    log('  - Ensure you have network access to N8N', 'yellow');
    log('');
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(error => {
  console.error(colors.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
