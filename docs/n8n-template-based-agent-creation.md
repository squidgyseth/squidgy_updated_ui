# N8N Template-Based Agent Creation Guide

**Purpose**: Create new agents by downloading, customizing, and deploying N8N workflow templates.

**Last Updated**: 2026-03-06

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Template Workflow Setup](#template-workflow-setup)
5. [Using the CLI Tool](#using-the-cli-tool)
6. [Programmatic Usage](#programmatic-usage)
7. [Customization Options](#customization-options)
8. [Tool Node Generation](#tool-node-generation)
9. [Deployment Process](#deployment-process)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The template-based agent creation system allows you to:

1. **Download** an existing N8N workflow as a template
2. **Customize** specific nodes (webhook path, agent name, system prompt)
3. **Add tool nodes** dynamically based on agent capabilities
4. **Deploy** the customized workflow back to N8N
5. **Generate** agent YAML configuration automatically

This approach is faster and more consistent than manually creating workflows from scratch.

---

## Prerequisites

### Required

- N8N API key configured in `.env` file (`VITE_N8N_TOKEN`)
- Access to N8N instance at `https://n8n.theaiteam.uk`
- Node.js and npm installed
- Template workflow ID: `ijDtq0ljM2atxA0E`

### Standard Template Workflow

**Template ID**: `ijDtq0ljM2atxA0E`

This is the standard agent template that includes:

- Webhook trigger
- AI Agent with tool calling
- Multiple HTTP Request Tool nodes
- Structured output parser
- Conversation memory
- Proper response formatting

All agents created with the builder use this template automatically.

---

## Quick Start

### Using the CLI Tool

```bash
# Run the interactive agent creator
node scripts/create-agent-from-template.js
```

Follow the prompts to:
1. Template automatically downloaded to `client/shared/`
2. Configure agent details
3. Define capabilities
4. Add tool nodes
5. Shared template updated with customizations
6. Deploy to N8N

### Manual Process

```bash
# 1. Download template
node -e "
const { N8NTemplateService } = require('./server/services/n8nTemplateService.ts');
const service = N8NTemplateService.getInstance();
service.downloadAndSaveTemplate('TEMPLATE_ID', 'n8n/my_template.json');
"

# 2. Customize and deploy (see Programmatic Usage section)

# 3. Build agents
node scripts/build-agents.js
```

---

## Template Workflow Setup

### Creating a Template Workflow

Your template workflow should include:

#### 1. **Webhook Node**
```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "TEMPLATE_PATH",
    "responseMode": "responseNode"
  },
  "type": "n8n-nodes-base.webhook",
  "name": "Webhook"
}
```

#### 2. **AI Agent Node**
```json
{
  "parameters": {
    "promptType": "define",
    "text": "={{ $json.user_mssg }}",
    "hasOutputParser": true,
    "options": {
      "systemMessage": "TEMPLATE_SYSTEM_PROMPT"
    }
  },
  "type": "@n8n/n8n-nodes-langchain.agent",
  "name": "AI Agent"
}
```

#### 3. **Code Nodes** for data preparation and formatting

#### 4. **Respond to Webhook Node**
```json
{
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ ... }}"
  },
  "type": "n8n-nodes-base.respondToWebhook",
  "name": "Respond to Webhook"
}
```

### Template Placeholders

The customization service will replace:

- `TEMPLATE_PATH` → `agent_id`
- `TEMPLATE_SYSTEM_PROMPT` → Generated system prompt
- `agent_name: "template"` → `agent_name: "your_agent_id"`

---

## Using the CLI Tool

### Step-by-Step Walkthrough

#### Step 1: Template Selection

```
Step 1: Using Standard Template
  Template ID: ijDtq0ljM2atxA0E
```

The template is automatically selected - no user input needed.

#### Step 2: Agent Configuration

```
Agent name (e.g., "Social Media Manager"): Content Scheduler
  Generated ID: content_scheduler

Agent purpose (what does it do?): Schedule and publish content across platforms

Category (MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL): MARKETING
```

#### Step 3: Capabilities

```
Enter agent capabilities (one per line, empty line to finish):
  Capability 1: Schedule posts to Facebook
  Capability 2: Schedule posts to Instagram
  Capability 3: Manage media library
  Capability 4: Track post performance
  Capability 5: [press Enter]

✓ 4 capabilities defined
```

#### Step 4: Tool Nodes

```
Add tool nodes based on capabilities? (yes/no): yes

Generating tool nodes...
  Generated 3 tool nodes:
    - Facebook Post Tool (n8n-nodes-base.httpRequestTool)
    - Get GHL Media (n8n-nodes-base.httpRequestTool)
    - Search Knowledge Base (n8n-nodes-base.httpRequestTool)

AI Agent node name (default: "AI Agent"): [press Enter]

✓ Tool nodes added to workflow
```

#### Step 5: Deploy

```
Deploy workflow to N8N now? (yes/no): yes

Deploying to N8N...
✓ Workflow deployed!
  Workflow ID: xyz789
  URL: https://n8n.theaiteam.uk/workflow/xyz789

⚠️  IMPORTANT: Manual steps required in N8N UI:
  1. Open the workflow in N8N
  2. Set credentials (OpenRouter, Supabase, etc.)
  3. Click "Publish" to activate
  4. Move to Squidgy folder
```

---

## Programmatic Usage

### Download Template

```typescript
import { N8NTemplateService } from './server/services/n8nTemplateService';

const n8nService = N8NTemplateService.getInstance();

// Download standard template
const templateId = 'ijDtq0ljM2atxA0E';
const template = await n8nService.downloadTemplate(templateId);

console.log(`Downloaded: ${template.name}`);
console.log(`Nodes: ${template.nodes.length}`);
```

### Customize Workflow

```typescript
// Customize for specific agent
const customized = n8nService.customizeWorkflowForAgent(
  template,
  'my_agent_id',
  'My Agent Name',
  'System prompt goes here...',
  'my_agent_id' // webhook path
);
```

### Add Tool Nodes

```typescript
// Generate tools from capabilities
const capabilities = [
  'Post to Facebook',
  'Search knowledge base',
  'Calculate metrics'
];

const toolNodes = n8nService.generateToolNodesFromCapabilities(capabilities);

// Add to workflow
const withTools = n8nService.addToolNodesToWorkflow(
  customized,
  toolNodes,
  'AI Agent' // AI Agent node name
);
```

### Manual Node Modifications

```typescript
import { N8NNodeModification } from './server/services/n8nTemplateService';

const modifications: N8NNodeModification[] = [
  {
    nodeName: 'Webhook',
    modifications: [
      { path: 'parameters.path', value: 'custom_path' }
    ]
  },
  {
    nodeType: 'n8n-nodes-base.code',
    modifications: [
      { path: 'parameters.jsCode', value: 'const x = 1; return [{json: {x}}];' }
    ]
  }
];

const modified = n8nService.modifyWorkflowNodes(workflow, modifications);
```

### Deploy to N8N

```typescript
// Deploy new workflow
const deployment = await n8nService.deployWorkflow(
  customizedWorkflow,
  'My New Agent Workflow'
);

console.log(`Deployed: ${deployment.id}`);
console.log(`URL: ${deployment.url}`);

// Or update existing workflow
await n8nService.updateWorkflow('EXISTING_ID', customizedWorkflow);
```

---

## Customization Options

### Automatic Customizations

The `customizeWorkflowForAgent()` method automatically updates:

1. **Webhook path** → `/{agent_id}`
2. **Webhook name** → `{Agent Name} Webhook`
3. **AI Agent system prompt** → Your custom prompt
4. **Code node agent_name** → All references updated to new agent ID

### Manual Customizations

Use `modifyWorkflowNodes()` for custom changes:

```typescript
const mods = [
  {
    nodeName: 'OpenRouter Chat Model',
    modifications: [
      { path: 'parameters.model', value: 'anthropic/claude-3-5-sonnet' }
    ]
  },
  {
    nodeName: 'Conversation Memory',
    modifications: [
      { path: 'parameters.contextWindowLength', value: 50 }
    ]
  }
];

const customWorkflow = n8nService.modifyWorkflowNodes(template, mods);
```

---

## Tool Node Generation

### Automatic Tool Detection

The system automatically generates tool nodes based on capability keywords:

| Capability Keywords | Generated Tool | Type |
|---------------------|----------------|------|
| `facebook`, `post` | Facebook Post Tool | HTTP Request Tool |
| `ghl`, `gohighlevel`, `media` | Get GHL Media | HTTP Request Tool |
| `knowledge`, `search`, `rag` | Search Knowledge Base | HTTP Request Tool |
| `calculat`, `math` | Calculator | LangChain Calculator Tool |

### Custom Tool Nodes

```typescript
import { N8NToolNode } from './server/services/n8nTemplateService';

const customTools: N8NToolNode[] = [
  {
    name: 'Custom API Call',
    type: 'n8n-nodes-base.httpRequestTool',
    parameters: {
      method: 'POST',
      url: '={{$env.API_URL}}/custom/endpoint',
      sendBody: true,
      bodyParameters: {
        parameters: [
          { name: 'data', value: '={{$json.data}}' }
        ]
      }
    },
    description: 'Call custom API endpoint'
  }
];

const workflow = n8nService.addToolNodesToWorkflow(
  template,
  customTools,
  'AI Agent'
);
```

### Tool Node Positioning

Tools are automatically positioned:
- **X**: Same as AI Agent node
- **Y**: Below AI Agent, spaced 100px apart
- **Connections**: Automatically connected via `ai_tool` connection type

---

## Deployment Process

### Full Deployment Workflow

```typescript
// 1. Download template
const templateId = 'ijDtq0ljM2atxA0E';
const template = await n8nService.downloadTemplate(templateId);

// 2. Customize
let workflow = n8nService.customizeWorkflowForAgent(
  template,
  'my_agent',
  'My Agent',
  systemPrompt
);

// 3. Add tools
const tools = n8nService.generateToolNodesFromCapabilities(capabilities);
workflow = n8nService.addToolNodesToWorkflow(workflow, tools);

// 4. Update shared template
const sharedDir = path.join(process.cwd(), 'client', 'shared');
if (!fs.existsSync(sharedDir)) {
  fs.mkdirSync(sharedDir, { recursive: true });
}

fs.writeFileSync(
  path.join(sharedDir, 'n8n_workflow_template.json'),
  JSON.stringify(workflow, null, 2)
);

// 5. Save agent config files
const clientAgentDir = path.join(process.cwd(), 'client', 'my_agent');
if (!fs.existsSync(clientAgentDir)) {
  fs.mkdirSync(clientAgentDir, { recursive: true });
}

fs.writeFileSync(
  path.join(clientAgentDir, 'config.yaml'),
  yamlContent
);

fs.writeFileSync(
  path.join(clientAgentDir, 'system_prompt.md'),
  systemPromptContent
);

// 5. Deploy to N8N
const deployment = await n8nService.deployWorkflow(workflow, 'My Agent');

// 6. Manual N8N UI steps (cannot be automated):
//    - Set credentials
//    - Publish workflow
//    - Move to Squidgy folder
```

### Post-Deployment Checklist

- [ ] Workflow deployed to N8N
- [ ] Credentials configured in N8N UI
- [ ] Workflow published (activated)
- [ ] Workflow moved to Squidgy folder
- [ ] Agent YAML created in `agents/{agent_id}/config.yaml`
- [ ] System prompt created in `agents/{agent_id}/system_prompt.md`
- [ ] `build-agents.js` executed
- [ ] Agent tested in UI

---

## Troubleshooting

### Issue: API Key Not Found

**Error**: `Failed to download N8N template: Request failed with status code 401`

**Solution**:

1. **Get your N8N API key**:
   - Go to https://n8n.theaiteam.uk
   - Navigate to Settings → API
   - Generate/Copy your API key

2. **Add to `.env` file**:
   ```bash
   VITE_N8N_TOKEN=your-n8n-api-key-here
   ```

3. **Restart your terminal/script** to load the new environment variable

### Issue: Template Not Found

**Error**: `Failed to download N8N template: Not found`

**Solution**:
- Verify workflow ID is correct
- Check you have access to the workflow
- List all workflows to find the correct ID:
  ```bash
  node -e "
  const { N8NTemplateService } = require('./server/services/n8nTemplateService.ts');
  N8NTemplateService.getInstance().listWorkflows().then(console.log);
  "
  ```

### Issue: Node Not Found for Modification

**Warning**: `Node not found for modification: AI Agent`

**Solution**:
- Check node name matches exactly (case-sensitive)
- Use `nodeType` instead of `nodeName` if node name varies
- Inspect template to verify node names:
  ```bash
  cat n8n/templates/template.json | grep '"name"'
  ```

### Issue: Tool Nodes Not Connected

**Problem**: Tool nodes added but not working

**Solution**:
- Verify AI Agent node name is correct
- Check connections in workflow JSON:
  ```json
  "connections": {
    "Tool Name": {
      "ai_tool": [[{"node": "AI Agent", "type": "ai_tool", "index": 0}]]
    }
  }
  ```
- Manually connect in N8N UI if needed

### Issue: Deployment Fails

**Error**: `Failed to deploy workflow to N8N`

**Solution**:
- Check N8N API key has write permissions
- Verify network connectivity to N8N instance
- Remove `id` field from workflow before deploying (done automatically)
- Check N8N server logs for detailed error

---

## Best Practices

### Template Selection

✅ **Good template characteristics:**
- Well-structured with clear node names
- Uses latest node typeVersions
- Includes proper error handling
- Has conversation memory configured
- Uses structured output parser

❌ **Avoid templates with:**
- Hardcoded credentials
- Deprecated node types
- Complex custom code that's hard to modify
- Missing error handling

### Capability Definition

Be specific with capabilities to get better tool generation:

✅ **Good**: `"Post images to Facebook feed"`
❌ **Vague**: `"Social media"`

✅ **Good**: `"Search user knowledge base with semantic search"`
❌ **Vague**: `"Find stuff"`

### System Prompt Generation

Include in your system prompt:
- Agent name and purpose
- List of capabilities
- Communication style (tone, style, approach)
- Tool usage instructions
- Response format expectations

---

## Related Documentation

- **[N8N Agent Setup](./n8n-agent-setup.md)** - Manual N8N workflow configuration
- **[Agent Creation Guide](../agents/README.md)** - Standard agent creation process
- **[Integration Helpers](../integration-helpers/README.md)** - Platform integration automation

---

**Last Updated**: 2026-03-06
**Squidgy Version**: 1.0.0
