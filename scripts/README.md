# Agent Creation Scripts

## Create Agent from N8N Template

**Script**: `create-agent-from-template.py`

**This is the ONLY agent creation script.** It creates complete agents by cloning the standard N8N workflow template and generating all necessary files with an interactive wizard.

### Prerequisites

1. **Python 3.10+** with packages:
   ```bash
   pip install requests python-dotenv pyyaml
   ```

2. **Environment variables** in `.env`:
   ```bash
   VITE_N8N_WEBHOOK_URL=https://n8n.theaiteam.uk
   VITE_N8N_TOKEN=your-n8n-api-token
   ```

3. **N8N Template**: Template ID `ijDtq0ljM2atxA0E` must exist in your N8N instance

### Usage

#### Interactive Mode

```bash
python scripts/create-agent-from-template.py
```

The script will prompt you for:
- Agent name (e.g., "Social Media Manager")
- Agent ID (auto-generated or custom)
- Agent purpose (with examples)
- Category (MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL)
- Personality (tone, style, approach)
- Capabilities (3-5 recommended)
- UI customization (emoji, color, tagline)
- Pinned status
- Review summary before creation

#### Command Line Mode

```bash
python scripts/create-agent-from-template.py \
  --agent-name "Social Media Manager" \
  --agent-id "social_media_manager"
```

#### Options

- `--agent-name` - Human-readable agent name
- `--agent-id` - Snake_case agent ID (auto-generated if omitted)
- `--activate` - Activate the workflow immediately after creation
- `--dry-run` - Show what would be created without deploying

### What It Does

The script performs 6 steps:

1. **Agent Configuration** - Collects agent details
2. **Fetch Template** - Downloads N8N workflow template `ijDtq0ljM2atxA0E`
3. **Process Workflow** - Replaces `<<agent_id>>` placeholders and remaps credentials
4. **Save Workflow** - Saves customized workflow to `agents/{agent_id}/n8n_workflow.json`
5. **Generate Files** - Creates `config.yaml` and `system_prompt.md`
6. **Deploy to N8N** - Optionally deploys workflow to N8N

### Files Created

```
agents/{agent_id}/
├── config.yaml          # Agent YAML configuration
├── system_prompt.md     # Agent system prompt
└── n8n_workflow.json    # Customized N8N workflow
```

### Example

```bash
$ python scripts/create-agent-from-template.py

============================================================
  Squidgy Agent Workflow Cloner
  Instance  : https://n8n.theaiteam.uk
  Template  : ijDtq0ljM2atxA0E
============================================================

[1/6] Agent Configuration
────────────────────────────────────────────────────────────
  Agent name (e.g. "Social Media Manager"): Weather Advisor
  Generated ID: "weather_advisor"  — use this? (Y/n): y
  Agent purpose (what does it do?): Provides weather forecasts and alerts
  
  Categories: MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL
  Category: GENERAL
  
  Enter agent capabilities (one per line, empty line to finish):
    Capability 1: Check weather forecasts
    Capability 2: Send weather alerts
    Capability 3: 

  Agent Name    : Weather Advisor
  Agent ID      : weather_advisor
  Purpose       : Provides weather forecasts and alerts
  Category      : GENERAL
  Capabilities  : 2
  Workflow Name : Squidgy_Weather_Advisor_Workflow

[2/6] Fetching Template
────────────────────────────────────────────────────────────
  Downloading 'ijDtq0ljM2atxA0E' ...
  Found  : "Squidgy_AgentTemplate_Workflow"
  Nodes  : 14

[3/6] Processing Workflow
────────────────────────────────────────────────────────────
  Replacing '<<agent_id>>' → 'weather_advisor' (3 occurrence(s)) ...
  ✓  All occurrences replaced
  ✓  Workflow renamed to "Squidgy_Weather_Advisor_Workflow"
  
  Remapping credentials ...
  ✓  [OpenRouter Chat Model] 'Claude_Demo_SMM'  abc123 → 7hB3eGzzdDVoxaV5
  ✓  [Get system prompt] 'Neon Postgres'  def456 → 9VZuQcfK90oMX16w
  ✓  [Postgres Chat Memory] 'Neon Postgres'  def456 → 9VZuQcfK90oMX16w
  ✓  [Write in Tool Log] 'Supabase account'  ghi789 → uk8y8Aw346FSXNbw
  ✓  All credentials remapped

[4/6] Saving Workflow to Agent Folder
────────────────────────────────────────────────────────────
  ✓  Workflow saved: agents\weather_advisor\n8n_workflow.json

[5/6] Generating Agent Files
────────────────────────────────────────────────────────────
  ✓  Config saved: agents\weather_advisor\config.yaml
  ✓  System prompt saved: agents\weather_advisor\system_prompt.md

[6/6] Deploying to N8N
────────────────────────────────────────────────────────────
  Deploy workflow to N8N now? (Y/n): y
  Creating "Squidgy_Weather_Advisor_Workflow" ...
  ✓  Created!  ID: xyz789

============================================================
  Done!
  Agent ID      : weather_advisor
  Workflow ID   : xyz789
  Editor URL    : https://n8n.theaiteam.uk/workflow/xyz789

  Files Created:
    ✓ agents\weather_advisor\n8n_workflow.json
    ✓ agents\weather_advisor\config.yaml
    ✓ agents\weather_advisor\system_prompt.md
============================================================

  Manual steps required in N8N UI:
  1. Open the workflow in the editor
  2. Verify credentials on flagged nodes
  3. Click Publish to activate
```

### After Creation

1. **Open workflow in N8N** - Click the Editor URL
2. **Set credentials** - Configure OpenRouter, Neon Postgres, Supabase
3. **Publish workflow** - Click "Publish" to activate
4. **Build agent** - Run `node scripts/build-agents.js` to compile
5. **Test agent** - Use the agent in your application

### Credential Mapping

The script automatically remaps credentials from the template to your instance. Update `CREDENTIAL_MAP` in the script if needed:

```python
CREDENTIAL_MAP = {
    "Claude_Demo_SMM"  : "your-openrouter-cred-id",
    "Neon Postgres"    : "your-neon-cred-id",
    "Supabase account" : "your-supabase-cred-id",
}
```

To find your credential IDs, run:
```bash
python scripts/List_n8n_ids.py
```

### Troubleshooting

**Error: Missing VITE_N8N_TOKEN**
- Add `VITE_N8N_TOKEN` to your `.env` file
- Get token from N8N Settings → API

**Error: Template not found**
- Verify template ID `ijDtq0ljM2atxA0E` exists in your N8N instance
- Check you have access to the template

**Error: HTTP 400 from N8N**
- Credential IDs may be incorrect
- Update `CREDENTIAL_MAP` with your instance's credential IDs

**Credentials not working in N8N**
- Open workflow in N8N editor
- Manually reconnect credentials on flagged nodes
- Click "Publish" to save

### Related Scripts

- `List_n8n_ids.py` - List all credential IDs from your N8N instance
- `build-agents.js` - Compile agents and upload to Neon database

### Documentation

- [Agent Folder Structure](../docs/agent-folder-structure.md)
- [N8N Template-Based Agent Creation](../docs/n8n-template-based-agent-creation.md)
- [Agent Creation Guide](../agents/README.md)
