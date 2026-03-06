# Agent Folder Structure

**Purpose**: Documentation of the agent file organization structure.

**Last Updated**: 2026-03-06

---

## Overview

All agent files are organized in the `client/{agent_id}/` directory structure. This keeps all agent-related files together in one location.

---

## Folder Structure

```
agents/
├── shared/                              # Shared resources
│   ├── base_system_prompt.md           # Base prompt for all agents
│   ├── agent_template.yaml              # Template for new agents
│   └── n8n_workflow_template.json       # N8N workflow template (source)
│
├── {agent_id}/                          # Agent-specific folder
│   ├── config.yaml                      # Agent YAML configuration
│   ├── system_prompt.md                 # Agent system prompt
│   └── n8n_workflow.json                # Agent's customized N8N workflow
│
└── another_agent/
    ├── config.yaml
    ├── system_prompt.md
    └── n8n_workflow.json

client/
├── {agent_id}/                          # Agent-specific folder (for build output)
│   ├── config.yaml                      # Generated agent config
│   └── system_prompt.md                 # Generated system prompt
│
└── [other client files]
```

---

## File Descriptions

### `agents/shared/n8n_workflow_template.json`

**Shared N8N workflow template** that is downloaded from N8N and used as a base for new agents.

This is the **source template** that contains:
- Base workflow structure
- Standard nodes (webhook, AI agent, memory, etc.)
- Placeholder values (e.g., `<<agent_id>>`)

**Location**: `agents/shared/n8n_workflow_template.json`

**Note**: This file is NOT modified. It's used as a template to create agent-specific workflows.

### `agents/{agent_id}/n8n_workflow.json`

**Agent-specific N8N workflow** customized for this particular agent.

This file contains:
- Customized webhook path (`/{agent_id}`)
- Agent-specific tool nodes
- Replaced `<<agent_id>>` placeholders
- Agent-specific configurations

**Example location**: `agents/weather_advisor/n8n_workflow.json`

**Note**: This is the workflow that gets deployed to N8N for this agent.

### `config.yaml`

Agent configuration file containing:
- Agent metadata (id, name, category, description)
- UI configuration
- N8N webhook URL
- Personality settings
- Capabilities
- Suggestion buttons
- Conversation state schema (if applicable)

**Example location**: `client/email_marketing_manager/config.yaml`

### `system_prompt.md`

Agent-specific system prompt containing:
- Agent responsibilities
- Workflows and processes
- Tool usage instructions
- Routing rules
- Domain-specific knowledge

**Example location**: `client/email_marketing_manager/system_prompt.md`

**Note**: The base system prompt (`agents/shared/base_system_prompt.md`) is automatically prepended during build.

---

## Creating New Agent Files

### Using the Template-Based Builder

```bash
node scripts/create-agent-from-template.js
```

This automatically creates all files in the correct location:
- `client/{agent_id}/config.yaml`
- `client/{agent_id}/system_prompt.md`
- `client/{agent_id}/n8n_workflow.json`

### Manual Creation

1. **Create agent directory**:
   ```bash
   mkdir client/my_agent_id
   ```

2. **Create config.yaml**:
   ```bash
   cp agents/shared/agent_template.yaml client/my_agent_id/config.yaml
   ```

3. **Create system_prompt.md**:
   ```bash
   touch client/my_agent_id/system_prompt.md
   ```

4. **Create or import N8N workflow**:
   - Use template-based builder, OR
   - Export from N8N and save as `client/my_agent_id/n8n_workflow.json`

---

## Build Process

After creating agent files, run the build script:

```bash
node scripts/build-agents.js
```

This script:
1. Reads all `client/{agent_id}/config.yaml` files
2. Compiles them into `client/data/agents.ts`
3. Syncs to Supabase `agents` table
4. Combines base prompt + agent prompt
5. Uploads to Neon database

---

## Migration from Old Structure

If you have agents in the old `agents/{agent_id}/` structure:

### Move Files

```bash
# For each agent
mv agents/my_agent_id/config.yaml client/my_agent_id/config.yaml
mv agents/my_agent_id/system_prompt.md client/my_agent_id/system_prompt.md

# If you have N8N workflow in n8n/ folder
mv n8n/my_agent_id_workflow.json client/my_agent_id/n8n_workflow.json
```

### Update References

Update any scripts or documentation that reference the old paths.

---

## Best Practices

### File Naming

- **Agent ID**: Use snake_case (e.g., `email_marketing_manager`)
- **Config file**: Always `config.yaml`
- **System prompt**: Always `system_prompt.md`
- **N8N workflow**: Always `n8n_workflow.json`

### Organization

✅ **Do**:
- Keep all agent files in `client/{agent_id}/`
- Use descriptive agent IDs
- Include all necessary files for the agent

❌ **Don't**:
- Scatter agent files across multiple directories
- Use spaces in agent IDs
- Duplicate files in multiple locations

### Version Control

- Commit all agent files to git
- Use meaningful commit messages when updating agents
- Keep N8N workflows in sync with deployed versions

---

## Example: Complete Agent Structure

```
agents/
├── shared/
│   ├── base_system_prompt.md         # Base prompt for all agents
│   ├── agent_template.yaml            # Template for new agents
│   └── n8n_workflow_template.json     # Source N8N template
│
└── email_marketing_manager/
    ├── config.yaml                    # Agent configuration
    ├── system_prompt.md               # Agent-specific prompt
    └── n8n_workflow.json              # Agent's customized workflow

client/
└── email_marketing_manager/
    ├── config.yaml                    # Generated agent config
    └── system_prompt.md               # Generated system prompt
```

**config.yaml**:
```yaml
agent:
  id: email_marketing_manager
  name: "Email Marketing Manager"
  category: MARKETING
  # ... rest of config
```

**system_prompt.md**:
```markdown
# Email Marketing Manager

Manage email campaigns and newsletters.

## PRIMARY RESPONSIBILITIES
1. Create email campaigns
2. Schedule newsletter sends
# ... rest of prompt
```

**Agent N8N Workflow** (`agents/email_marketing_manager/n8n_workflow.json`):
```json
{
  "name": "Email Marketing Manager - Workflow",
  "nodes": [
    {
      "parameters": {
        "path": "email_marketing_manager"
      },
      "type": "n8n-nodes-base.webhook",
      "name": "Webhook"
    }
    // ... rest of workflow
  ]
}
```

**Note**: The shared template is updated with each agent's customizations and deployed to N8N.

---

## Related Documentation

- **[Agent Creation Guide](../agents/README.md)** - How to create agents
- **[N8N Template-Based Creation](./n8n-template-based-agent-creation.md)** - Template-based workflow
- **[Build Script](../scripts/build-agents.js)** - Agent compilation

---

**Last Updated**: 2026-03-06
