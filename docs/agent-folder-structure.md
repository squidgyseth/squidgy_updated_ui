# Agent Folder Structure

**Purpose**: Documentation of the agent file organization structure.

**Last Updated**: 2026-03-06

---

## Overview

All agent files are organized in the `agents/{agent_id}/` directory structure. This keeps all agent-related files together in one location and provides a clean separation from client code.

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
│   └── n8n_workflow.json                # Agent's customized N8N workflow (optional)
│
└── another_agent/
    ├── config.yaml
    ├── system_prompt.md
    └── n8n_workflow.json
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

**Example location**: `agents/weather_advisor/config.yaml`

### `system_prompt.md`

Agent-specific system prompt containing:
- Agent responsibilities
- Workflows and processes
- Tool usage instructions
- Routing rules
- Domain-specific knowledge

**Example location**: `agents/weather_advisor/system_prompt.md`

**Note**: The base system prompt (`agents/shared/base_system_prompt.md`) is automatically prepended during build.

---

## Creating New Agent Files

### Using the Python Agent Management Script

**Recommended approach** - Use the Python script for all agent creation and editing:

```bash
python scripts/create-agent-from-template.py
```

This automatically:
- Creates the agent folder structure
- Generates all required files in the correct locations
- Handles YAML formatting and validation
- Supports both creation and editing of existing agents
- Optionally generates N8N workflows

### Manual Creation (Advanced)

If you prefer to create agents manually:

1. **Create agent directory**:
   ```bash
   mkdir agents/my_agent_id
   ```

2. **Create config.yaml**:
   ```bash
   cp agents/shared/agent_template.yaml agents/my_agent_id/config.yaml
   ```

3. **Create system_prompt.md**:
   ```bash
   touch agents/my_agent_id/system_prompt.md
   ```

4. **Create or import N8N workflow** (optional):
   - Use Python script with workflow generation, OR
   - Export from N8N and save as `agents/my_agent_id/n8n_workflow.json`

---

## Build Process

After creating agent files, run the build process for your platform:

```bash
# Use the build command for your system
[build command]
```

This process:
1. Reads all `agents/{agent_id}/config.yaml` files
2. Compiles them for the application
3. Syncs to database
4. Combines base prompt + agent prompt
5. Uploads compiled prompts to database

---

## Migration from Old Structure

If you have agents in the old `client/{agent_id}/` structure:

### Move Files

```bash
# For each agent
mv client/my_agent_id/config.yaml agents/my_agent_id/config.yaml
mv client/my_agent_id/system_prompt.md agents/my_agent_id/system_prompt.md
mv client/my_agent_id/n8n_workflow.json agents/my_agent_id/n8n_workflow.json
```

### Update References

Update any scripts or documentation that reference the old client paths.

---

## Best Practices

### File Naming

- **Agent ID**: Use snake_case (e.g., `email_marketing_manager`)
- **Config file**: Always `config.yaml`
- **System prompt**: Always `system_prompt.md`
- **N8N workflow**: Always `n8n_workflow.json`

### Organization

✅ **Do**:
- Keep all agent files in `agents/{agent_id}/`
- Use descriptive agent IDs
- Include all necessary files for the agent
- Use the Python script for consistent file generation

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

└── email_marketing_manager/
    ├── config.yaml                    # Agent configuration
    ├── system_prompt.md               # Agent-specific prompt
    └── n8n_workflow.json              # Agent's customized workflow (optional)
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

**Agent N8N Workflow** (`agents/email_marketing_manager/n8n_workflow.json`) - **Optional**:
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

**Note**: N8N workflows are optional - agents can function without them.

---

## Related Documentation

- **[Agent Creation Scripts](../scripts/README.md)** - Python script for agent creation and management
- **[Agent Creation Guide](../agents/README.md)** - How to create agents
- **[N8N Template-Based Creation](./n8n-template-based-agent-creation.md)** - Template-based workflow guide

---

**Last Updated**: 2026-03-06
