# Agent Creation and Deployment Pipeline

## Overview

The complete agent lifecycle from idea to production involves:
1. Interactive CLI wizard (TypeScript)
2. YAML config generation
3. N8N workflow generation (10-node pattern)
4. Pia system prompt updates (3 tables)
5. N8N API deployment
6. Manual credential setup in N8N UI
7. Frontend sync via build-agents.js
8. Testing and verification

## The 9-Step Interactive Wizard

**Command:** `cd squidgy_agent_builder && npm run create`

**File:** `src/scripts/create-agent-interactive.js` (536 lines)

**Phases:**

1. **Purpose** - What does the agent do?
2. **Category** - MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL
3. **Naming** - Display name + auto-generated agent_id
4. **Personality** - Tone, style, approach
5. **Capabilities** - Features and integrations
6. **Platforms** - Social media, CRM, etc.
7. **UI** - Custom UI needs (Figma-based)
8. **AI Config** - Conversation state, Supabase table, system prompt
9. **Pia Config** - Relevance rules, routing keywords

**Output:** AgentBuilderConversation object passed to service

## AgentBuilderService Pipeline

**File:** `src/services/agentBuilderService.ts` (1198 lines)

**Entry point:** `saveAgent(conversation)` orchestrates all steps.

### Step 1: Generate YAML Config

**Method:** `generateYAML(conversation)`

**Output:** `squidgy_updated_ui/agents/configs/{agent_id}.yaml`

**Schema:**

```yaml
agent:
  id: agent_id                    # Snake_case from display name
  emoji: "🤖"
  name: "Display Name"
  category: CATEGORY              # MARKETING, SALES, etc.
  description: "..."
  specialization: "..."
  tagline: "..."
  avatar: "/Squidgy AI Assistants Avatars/N.png"
  pinned: true/false
  enabled: true
  uses_conversation_state: true   # REQUIRED for wizard agents
  initial_message: "..."
  sidebar_greeting: "..."
  capabilities: [...]
  recent_actions: [...]

n8n:
  webhook_url: https://n8n.theaiteam.uk/webhook/{agent_id}

ui_use:
  page_type: single_page
  pages:
    - name: Dashboard
      path: dashboard
      order: 1
      validated: true

interface:
  type: chat
  features:
    - text_input
    - file_upload            # Added for Tier 2+
    - suggestion_buttons
    - voice_input            # Added for Tier 3+

suggestions:
  - "Option 1"
  - "Option 2"

personality:
  tone: friendly/professional/casual
  style: direct/consultative/educational
  approach: collaborative/guided/automated
```

**Tier detection:**
- Tier 1: Basic chat (text_input, suggestion_buttons)
- Tier 2: + file_upload (multi-platform or multiple integrations)
- Tier 3: + voice_input (calculator/maps/external_api/regional_config)
- Tier 4: + Figma UI (needsCustomUI: true)

### Step 2: Generate N8N Workflow

**Method:** `generateN8NWorkflow(conversation)`

**Output:** `squidgy_updated_ui/n8n/{agent_id}_workflow.json`

**Structure:** 10 nodes with specific connections (see n8n_patterns.md)

**Key generated components:**

1. **Prepare Data Code** - `generateAIPrepareDataCode()`
   - Merges webhook body + Supabase + state
   - Handles getAll array safely
   - Checks data_exists flag

2. **AI Agent System Prompt** - `generateAIAgentSystemPrompt(conversation)`
   - 1000+ words tailored to agent
   - Includes mustache variables
   - Personality and instructions
   - Response format rules

3. **Output Parser Schema** - `generateOutputParserSchema()`
   - `{ response, Status, state }`
   - Capital "S" in Status
   - autoFix: true

4. **Respond Body** - `generateRespondBody(agentId, agentName)`
   - References Code node for IDs
   - References AI Agent for output
   - JSON.stringify for state

### Step 3: Update Pia System Prompt

**Method:** `updatePiaSystemPrompt(conversation)`

**Target:** `squidgy_updated_ui/knowledge_base/agents/personal_assistant/system_prompt.md`

**Updates 3 tables:**

#### Table 1: Agent Relevance Rules (~line 215)

```markdown
| Display Name | Show When |
|--------------|-----------|
| Existing agents... | ... |
| New Agent Name | {piaRelevanceRule from conversation} |
```

#### Table 2: Agent IDs (~line 262)

```markdown
| Display Name | `agent_id` |
|--------------|------------|
| Existing agents... | ... |
| New Agent Name | `new_agent_id` |
```

#### Table 3: Routing Table (~line 284)

```markdown
| User request keywords | Route To |
|-----------------------|----------|
| Existing routes... | ... |
| {piaRoutingKeywords} | New Agent Name |
```

**How it works:**
- `insertTableRow(lines, headerText, newRow)` finds section by header
- Searches for last `|`-prefixed line in table
- Checks for duplicates by searching for agent_id
- Splices new row after last existing row

**CRITICAL:** After this step, Pia's N8N workflow MUST be restarted to pick up changes.

### Step 4: Deploy to N8N

**Method:** `deployToN8N(workflow, apiKey, baseUrl)`

**API call:**

```javascript
POST https://n8n.theaiteam.uk/api/v1/workflows
Headers:
  X-N8N-API-KEY: {key from file}
  Content-Type: application/json
Body:
  {
    "name": "Agent Name",
    "nodes": [...],
    "connections": {...},
    "settings": {...}
  }
```

**What gets deployed:**
- Workflow definition (nodes, connections, settings)
- Name

**What does NOT get deployed (manual steps):**
- Credentials (must be set in UI)
- Active status (workflow created as inactive)
- Tags
- Folder placement

**Returns:** `DeployResult` with `workflowId`, `webhookUrl`, `success`, `manualSteps[]`

### Step 5: Run build-agents.js

**Command:** `cd squidgy_updated_ui && node scripts/build-agents.js`

**What it does:**

1. **Reads all YAML configs** from `agents/configs/*.yaml`
2. **Generates agents.ts** (or similar) - typed agent registry for frontend
3. **Syncs to Supabase:**
   - `agents` table - agent metadata
   - `personal_assistant_config` table - enablement per user

**Database schema:**

```sql
-- agents table
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  description TEXT,
  enabled BOOLEAN,
  ...
);

-- personal_assistant_config table
CREATE TABLE personal_assistant_config (
  config_type TEXT,
  code TEXT,
  display_name TEXT,
  emoji TEXT,
  is_enabled BOOLEAN,
  PRIMARY KEY (config_type, code)
);
```

**Upsert pattern:**
```javascript
await supabase
  .from('personal_assistant_config')
  .upsert(agentData, { onConflict: 'config_type,code' });
```

**Frontend requirements:**

After this step, the frontend can:
- Import agent data from generated TypeScript file
- Query agents from Supabase
- Display agents in sidebar
- Route chat to agent webhook

## Manual N8N UI Steps (REQUIRED)

After deployment, in N8N web interface:

1. **Find the new workflow** (search by name or check recent)
2. **Set credentials on nodes:**
   - Supabase node → Select Supabase credential
   - OpenRouter Chat Model → Select OpenRouter credential
3. **Activate workflow** - Click "Publish" button
4. **Optional:** Add tags, move to folder

**Why these are manual:**
- N8N API cannot set credentials (security limitation)
- N8N API cannot activate workflows
- N8N API cannot manage tags or folders

## Testing the Deployed Agent

### Step 1: Test Webhook Directly

```bash
N8N_KEY=$(cat /Users/sethward/GIT/Squidgy/.n8n-api-key | tr -d '\n')

curl -s -X POST https://n8n.theaiteam.uk/webhook/{agent_id} \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "user_id": "00000000-0000-0000-0000-000000000001",
      "user_mssg": "Hello, can you help me?",
      "session_id": "test-session-123",
      "request_id": "test-req-456",
      "state": {}
    }
  }' | python3 -m json.tool
```

**Expected response:**

```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "session_id": "test-session-123",
  "agent_name": "agent_id",
  "agent_response": "Hi! I'm [Agent Name]...",
  "agent_status": "Waiting",
  "state": "{...}"
}
```

**If response body is 0 bytes:**
- Respond node never fired
- Check N8N execution log
- Likely issue: missing credentials or Supabase error

### Step 2: Check in Frontend

1. Open app in browser
2. Login as test user
3. Check sidebar - agent should appear
4. Click agent - chat should open
5. Send test message
6. Verify response appears

### Step 3: Verify Supabase Sync

```sql
-- Check agents table
SELECT * FROM agents WHERE id = 'agent_id';

-- Check personal_assistant_config
SELECT * FROM personal_assistant_config
WHERE code = 'agent_id';
```

### Step 4: Test Pia Routing

1. Chat with Pia (personal_assistant)
2. Use routing keywords from Pia config
3. Verify Pia suggests the new agent
4. Click enable/open agent
5. Verify redirection works

## Post-Deployment Checklist

- [ ] YAML config exists at `agents/configs/{agent_id}.yaml`
- [ ] N8N workflow JSON saved at `n8n/{agent_id}_workflow.json`
- [ ] Pia system prompt updated (3 tables)
- [ ] N8N workflow deployed (returned workflow ID)
- [ ] Credentials set in N8N UI
- [ ] Workflow activated in N8N UI
- [ ] `build-agents.js` ran successfully
- [ ] Supabase `agents` table has row
- [ ] Supabase `personal_assistant_config` has row
- [ ] Webhook test returns valid JSON (not 0 bytes)
- [ ] Agent appears in frontend sidebar
- [ ] Chat with agent works
- [ ] Pia routing mentions agent (if applicable)
- [ ] Pia's workflow restarted (if prompt changed)

## Common Issues and Fixes

### Agent Not Appearing in Sidebar

**Symptom:** YAML exists, but sidebar doesn't show agent.

**Fix:**
1. Check if `build-agents.js` ran
2. Query Supabase - does agent exist in DB?
3. Check frontend console for errors
4. Verify agent `enabled: true` in YAML

### Webhook Returns 0 Bytes

**Symptom:** curl returns HTTP 200 but body is empty.

**Fix:**
1. Check N8N execution log - which nodes ran?
2. Verify credentials set on all nodes
3. Check Supabase node - is it using getAll with alwaysOutputData?
4. Check If Ready condition - does it match Status field?

### Pia Doesn't Route to Agent

**Symptom:** Pia doesn't mention agent when using routing keywords.

**Fix:**
1. Verify Pia's system_prompt.md was updated (all 3 tables)
2. Restart Pia's N8N workflow (cache invalidation)
3. Test with exact routing keywords from config
4. Check Pia's execution log for routing decision

### State Not Persisting

**Symptom:** Agent forgets previous wizard steps.

**Fix:**
1. Check YAML: `uses_conversation_state: true`?
2. Verify frontend sends `state` field in webhook body
3. Check Code node reads from `$input.first().json.body.state`
4. Check AI output includes `state` field
5. Verify Respond node includes state in response

## YAML Config Schema Reference

**Required fields:**

```yaml
agent:
  id: string (lowercase, underscores only)
  name: string
  category: MARKETING|SALES|HR|SUPPORT|OPERATIONS|GENERAL
  description: string
  enabled: boolean

n8n:
  webhook_url: string (must be /webhook/, not /webhook-test/)
```

**Conversation state fields:**

```yaml
agent:
  uses_conversation_state: boolean  # REQUIRED for wizard agents

# Optional wizard configuration
wizardPhases:
  - name: string
    fields: [...]

conversationStateSchema:
  phase: string
  wizard_step: number
  wizard_data: object

databaseSchema:
  table: string
  columns: [...]
```

## Validation Command

**Before deployment:**

```bash
cd squidgy_agent_builder
npm run validate

# Or validate single file:
npx tsx src/scripts/validate-agent.js agents/configs/{agent_id}.yaml
```

**Validation rules:**
- Required fields exist
- ID format: `[a-z0-9_]+`
- Valid category
- No `/webhook-test/` URLs
- Filename matches agent ID

## Brandy Reference Implementation

**Location:** `squidgy_agent_builder/examples/brandy/`

**Files:**
- `config/brandy.yaml` - Complete YAML with wizard phases
- `knowledge_base/instructions.md` - Agent instructions
- `knowledge_base/wizard_flow.md` - 6-element punk branding wizard
- `knowledge_base/brand_methodology.md` - Domain knowledge
- `database/brands_table.sql` - Supabase schema
- `n8n/brandy_workflow.json` - Deployed workflow

**Active workflow:** N8N ID `4mUkvAI8vgjLttpT`

**Use Brandy as ground truth** when in doubt about implementation details.

## Quick Reference Commands

```bash
# Create new agent
cd squidgy_agent_builder && npm run create

# Validate all configs
cd squidgy_agent_builder && npm run validate

# Build agents (sync to frontend)
cd squidgy_updated_ui && node scripts/build-agents.js

# Test webhook
N8N_KEY=$(cat /Users/sethward/GIT/Squidgy/.n8n-api-key | tr -d '\n')
curl -s -X POST https://n8n.theaiteam.uk/webhook/{agent_id} \
  -H "Content-Type: application/json" \
  -d '{"body":{"user_id":"test","user_mssg":"hello","session_id":"test","request_id":"test"}}' \
  | python3 -m json.tool
```
