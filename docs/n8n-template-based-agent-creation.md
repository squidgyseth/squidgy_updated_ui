# N8N Template-Based Agent Creation Guide

**Purpose**: Create new agents or edit existing agents using the Python agent management script with N8N workflow template integration.

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

The Python agent management script (`create-agent-from-template.py`) provides a complete solution for:

1. **Creating new agents** - Interactive wizard to define agent details and generate all files
2. **Editing existing agents** - Load current configuration and update specific properties
3. **N8N workflow integration** - Optional template-based workflow generation and deployment
4. **File management** - Automatic generation of `config.yaml`, `system_prompt.md`, and `n8n_workflow.json`
5. **Credential handling** - Automatic remapping of template credentials to your instance

This approach is faster and more consistent than manually creating workflows from scratch or editing files directly.

---

## Prerequisites

### Required

- Python 3.10+ with packages: `requests python-dotenv pyyaml`
- N8N API key configured in `.env` file (`VITE_N8N_TOKEN`)
- Access to N8N instance at `https://n8n.theaiteam.uk`
- Template workflow ID: `ijDtq0ljM2atxA0E` (for N8N workflow generation)

### Standard Template Workflow

**Template ID**: `ijDtq0ljM2atxA0E`

This is the standard agent template used when generating N8N workflows. It includes:

- Webhook trigger
- AI Agent with tool calling
- Multiple HTTP Request Tool nodes
- Structured output parser
- Conversation memory
- Proper response formatting

**Note**: Workflow generation is optional - you can create/edit agents without generating N8N workflows.

---

## Quick Start

### Using the Python Script

```bash
# Run the interactive agent creator/manager
python scripts/create-agent-from-template.py
```

Follow the prompts to:
1. **Select mode**: Create new agent OR Edit existing agent
2. **Configure agent details**: Name, purpose, category, personality, capabilities
3. **Customize UI**: Emoji, tagline, specialization, pinned status
4. **Choose workflow generation**: Optional N8N workflow creation/update
5. **Deploy (optional)**: Deploy workflow to N8N if generated

### Edit Existing Agent

```bash
python scripts/create-agent-from-template.py
# Select mode 2, choose agent, update properties
```

---

## Agent Configuration Options

### Mode Selection

**Create New Agent:**
- Agent name (human-readable)
- Agent ID (auto-generated from name or custom)
- Agent purpose (what the agent does)
- Category (MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL)
- Personality configuration:
  - Tone: professional, friendly, casual, enthusiastic, formal
  - Style: helpful, concise, detailed, trendy, supportive
  - Approach: proactive, consultative, data_driven, solution_focused
- Capabilities (3-5 recommended)
- UI customization:
  - Emoji (default 🤖)
  - Tagline (optional)
  - Specialization (optional)
  - Pinned status
  - Enabled status

**Edit Existing Agent:**
- List all existing agents from `agents/` folder
- Load current configuration
- All prompts show current values
- Press Enter to keep, type to change
- Optional workflow regeneration

### Personality Configuration

The script allows detailed personality customization:

- **Tone**: How the agent sounds (professional, friendly, casual, etc.)
- **Style**: How the agent interacts (helpful, concise, detailed, etc.)
- **Approach**: How the agent works (proactive, consultative, etc.)

These values are saved to the agent's `config.yaml` and influence the generated system prompt.

---

## Script Workflow

### Agent Creation Flow

1. **Mode Selection** - Choose create new or edit existing
2. **Agent Configuration** - Interactive prompts for all agent properties
3. **Summary Review** - Show all configured values before proceeding
4. **File Generation** - Save `config.yaml` and `system_prompt.md`
5. **Workflow Choice** - Ask whether to generate N8N workflow
6. **Template Processing** - If yes: fetch, customize, save workflow
7. **Optional Deployment** - Deploy to N8N if user chooses

### Agent Editing Flow

1. **List Agents** - Show available agents in `agents/` folder
2. **Select Agent** - User chooses which agent to edit
3. **Load Configuration** - Read existing `config.yaml` and `system_prompt.md`
4. **Interactive Updates** - Show current values, prompt for changes
5. **File Updates** - Save modified configuration files
6. **Workflow Choice** - Ask whether to regenerate N8N workflow
7. **Optional Regeneration** - If yes: process and save new workflow

### File Structure

All agents maintain this structure:

```
agents/{agent_id}/
├── config.yaml          # Agent metadata, capabilities, personality
├── system_prompt.md     # Detailed behavior instructions
└── n8n_workflow.json    # Optional N8N workflow (if generated)
```

---

## N8N Workflow Generation (Optional)

The Python script can generate N8N workflows using the standard template. This is **optional** - you can create and edit agents without generating workflows.

### Template Customization

When workflow generation is enabled, the script:

1. **Downloads template** `ijDtq0ljM2atxA0E` from your N8N instance
2. **Customizes workflow**:
   - Replaces `<<agent_id>>` placeholders with actual agent ID
   - Updates webhook path to `/{agent_id}`
   - Renames workflow to "Squidgy_{Agent_Name}_Workflow"
3. **Remaps credentials** from template values to your instance
4. **Saves workflow** to `agents/{agent_id}/n8n_workflow.json`
5. **Optionally deploys** to N8N with your confirmation

### Credential Mapping

The script automatically remaps credentials:

```python
CREDENTIAL_MAP = {
    "Claude_Demo_SMM"  : "your-openrouter-cred-id",
    "Neon Postgres"    : "your-neon-cred-id",
    "Supabase account" : "your-supabase-cred-id",
}
```

Update this mapping if your template uses different credential names.

### Manual N8N Steps

After automatic deployment, you must:

1. **Open workflow in N8N editor** - Use the provided URL
2. **Verify credentials** - Check all flagged nodes
3. **Publish workflow** - Click "Publish" to activate
4. **Move to folder** - Place in appropriate Squidgy folder

---

## Command Line Options

### Basic Usage

```bash
# Interactive mode (default)
python scripts/create-agent-from-template.py

# With pre-filled values
python scripts/create-agent-from-template.py \
  --agent-name "Social Media Manager" \
  --agent-id "social_media_manager"
```

### Options

- `--agent-name` - Human-readable agent name
- `--agent-id` - Snake_case agent ID (auto-generated if omitted)
- `--activate` - Activate N8N workflow immediately after creation
- `--dry-run` - Show what would be created without deploying

### Environment Variables

Required in `.env` file:

```bash
VITE_N8N_WEBHOOK_URL=https://n8n.theaiteam.uk
VITE_N8N_TOKEN=your-n8n-api-token
```

---

## File Generation Details

### config.yaml Structure

```yaml
agent:
  id: agent_id
  emoji: "🤖"
  name: "Agent Name"
  category: "MARKETING"
  description: "Agent purpose"
  pinned: false
  enabled: true
  capabilities:
    - "Capability 1"
    - "Capability 2"
  tagline: "Optional tagline"
  specialization: "Optional specialization"
  recent_actions:
    - "Recent action 1"
    - "Recent action 2"

n8n:
  webhook_url: "https://n8n.theaiteam.uk/webhook/agent_id"

ui_use:
  page_type: single_page
  pages:
    - name: "Agent Dashboard"
      path: "agent-dashboard"
      order: 1
      validated: true

interface:
  type: chat
  features:
    - text_input
    - suggestion_buttons

suggestions:
  - "Help me with capability 1"
  - "What can you do?"
  - "Show me examples"

personality:
  tone: "friendly"
  style: "helpful"
  approach: "proactive"
```

### system_prompt.md Structure

Generated based on agent configuration:

```markdown
# Agent Name | Category

Agent description and purpose

## PRIMARY RESPONSIBILITIES

- Capability 1 description
- Capability 2 description

## COMMUNICATION STYLE

- Tone: [tone]
- Style: [style]
- Approach: [approach]

## WORKFLOW

1. Understand user request
2. Use available tools when needed
3. Provide clear, actionable responses
4. Follow up to ensure satisfaction
```

### n8n_workflow.json (Optional)

Customized template with:
- Webhook path set to `/{agent_id}`
- All `<<agent_id>>` placeholders replaced
- Credentials remapped to your instance
- Workflow renamed to "Squidgy_{Agent_Name}_Workflow"

---

## Troubleshooting

### Python Script Issues

**Error: Missing Python packages**
```bash
pip install requests python-dotenv pyyaml
```

**Error: Missing VITE_N8N_TOKEN**
- Add `VITE_N8N_TOKEN` to your `.env` file
- Get token from N8N Settings → API

**Error: Template not found**
- Verify template ID `ijDtq0ljM2atxA0E` exists in your N8N instance
- Check you have access to the template
- This only affects workflow generation (agent creation still works)

**Error: HTTP 400 from N8N**
- Credential IDs may be incorrect
- Update `CREDENTIAL_MAP` with your instance's credential IDs
- Run `python scripts/list_n8n_credentials.py` to see available credentials

### Agent Editing Issues

**Error: Agent not found in list**
- Verify agent exists in `agents/` folder
- Check folder structure matches expected format

**Error: Config file corrupted**
- Delete corrupted `config.yaml` and recreate agent
- Or manually fix YAML syntax errors

### N8N Workflow Issues

**Credentials not working in N8N**
- Open workflow in N8N editor
- Manually reconnect credentials on flagged nodes
- Click "Publish" to save

**Workflow not triggering**
- Verify webhook URL matches expected format
- Check workflow is activated (published)
- Test with curl or Postman

---

## Best Practices

### Agent Creation

✅ **Good agent characteristics:**
- Clear, specific purpose (not "help with everything")
- 3-5 well-defined capabilities
- Consistent personality (tone, style, approach)
- Appropriate category assignment
- Meaningful emoji and optional tagline

❌ **Avoid agents with:**
- Vague purposes
- Too many or too few capabilities
- Inconsistent personality traits
- Wrong category assignment

### Agent Editing

✅ **Good editing practices:**
- Review current values before making changes
- Update related properties together (e.g., purpose and capabilities)
- Test changes after editing
- Keep personality consistent with purpose

❌ **Avoid when editing:**
- Changing agent ID (breaks references)
- Making unrelated changes in single edit
- Forgetting to update dependent files

### Capability Definition

Be specific with capabilities:

✅ **Good**: `"Schedule and publish social media posts"`
❌ **Vague**: `"Social media"`

✅ **Good**: `"Generate brand guidelines and messaging"`
❌ **Vague**: `"Branding"`

### System Prompt Generation

The script automatically generates system prompts that include:
- Agent name and purpose
- List of capabilities
- Communication style (tone, style, approach)
- Workflow instructions
- Response format expectations

Review generated prompts and customize if needed.

---

## Related Documentation

- **[Agent Creation Scripts](../scripts/README.md)** - Python script usage and examples
- **[Agent Folder Structure](./agent-folder-structure.md)** - File organization and structure
- **[Agent Creation Guide](../agents/README.md)** - Manual agent creation process
- **[N8N Agent Setup](./n8n-agent-setup.md)** - Manual N8N workflow configuration
- **[Integration Helpers](../integration-helpers/README.md)** - Platform integration automation

---

**Last Updated**: 2026-03-06
**Squidgy Version**: 1.0.0
