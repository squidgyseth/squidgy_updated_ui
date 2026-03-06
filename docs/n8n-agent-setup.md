# N8N Agent Workflow Setup Guide

**Purpose**: Complete guide for configuring N8N workflows for Squidgy agents - from simple code-based agents to full AI-powered workflows.

**Last Updated**: 2026-02-21 (verified working with Brandy agent)

---

## Table of Contents

1. [End-to-End Checklist](#end-to-end-checklist)
2. [Architecture Overview](#architecture-overview)
3. [Workflow Types](#workflow-types)
4. [Respond to Webhook Configuration (CRITICAL)](#respond-to-webhook-configuration-critical)
5. [Simple Code-Based Workflow (Brandy Pattern)](#simple-code-based-workflow-brandy-pattern)
6. [AI-Powered Workflow](#ai-powered-workflow)
7. [Conversation State](#conversation-state)
8. [Frontend Integration Requirements](#frontend-integration-requirements)
9. [Deploying via N8N API](#deploying-via-n8n-api)
10. [Publishing in N8N UI](#publishing-in-n8n-ui)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)
13. [Working Examples](#working-examples)

---

## End-to-End Checklist

Every step needed to get an agent working. Miss any of these and it breaks:

- [ ] **N8N Workflow created** with 3 nodes minimum: Webhook, Code, Respond to Webhook
- [ ] **Webhook node**: `httpMethod: "POST"`, `responseMode: "responseNode"`, `path: "agent-name"`
- [ ] **Code node**: reads data from `$input.first().json.body` (NOT `.json`)
- [ ] **Code node**: returns `agent_response` field in the output
- [ ] **Respond to Webhook node**: uses `respondWith: "json"` with explicit `responseBody` template (see [CRITICAL section](#respond-to-webhook-configuration-critical))
- [ ] **Agent YAML** (`/agents/configs/agent-name.yaml`): has `n8n.webhook_url` pointing to production URL
- [ ] **Agent YAML**: has `uses_conversation_state: true` if agent needs multi-turn state
- [ ] **DynamicAgentDashboard.tsx**: passes `uses_conversation_state` in `agentInfo` object (line ~163)
- [ ] **Agents rebuilt**: `node scripts/build-agents.js` run after YAML changes
- [ ] **No conflicting webhook paths**: no other workflow uses the same webhook path
- [ ] **Workflow published** in N8N UI (click the Publish button, NOT a toggle)
- [ ] **Workflow in Squidgy folder**: move to `https://n8n.theaiteam.uk/projects/2qFbZc2MGPXfvV52/folders/dB9FNUPQgULkfv7d/workflows`

---

## Architecture Overview

```
User types message in Squidgy UI
        |
        v
N8nChatInterface.tsx
  - Calls sendToN8nWorkflowStreaming()
  - Sends POST to webhook_url from agent YAML
  - Includes: user_id, user_mssg, session_id, agent_name, request_id, state
        |
        v
N8N Webhook (production URL: /webhook/agent-name)
  - Receives POST body
  - Data available at: $input.first().json.body
        |
        v
Code Node (Format Response / AI Agent / etc.)
  - Processes message
  - MUST return object with agent_response field
        |
        v
Respond to Webhook Node
  - Sends JSON response back to frontend
  - MUST use respondWith: "json" with explicit responseBody template
        |
        v
N8nChatInterface.tsx receives response
  - Extracts agent_response for display
  - Saves state if isMultiTurnAgent() === true
  - State saved to Supabase AND conversationStateRef
  - State sent back on next message as payload.state
```

---

## Workflow Types

### Type 1: Simple Code-Based (No AI)

**Use for**: Wizard flows, deterministic logic, simple routing

**Nodes**: Webhook -> Code -> Respond to Webhook (3 nodes)

**Example**: Brandy brand advisor wizard (see `/n8n/brandy_workflow_DEPLOYED.json`)

### Type 2: AI-Powered (With LLM)

**Use for**: Free-form conversation, content generation, complex reasoning

**Nodes**: Webhook -> Extract Data -> AI Agent -> Format Response -> Respond to Webhook (5+ nodes)

**Plus**: OpenRouter Chat Model (ai_languageModel), Conversation Memory (ai_memory)

**Example**: FK Personal Assistant v5

---

## Respond to Webhook Configuration (CRITICAL)

This is the #1 thing that breaks agents. The exact configuration matters.

### VERIFIED WORKING Pattern (from FK Personal Assistant v5 + Brandy)

```json
{
  "respondWith": "json",
  "responseBody": "={\n  \"user_id\": \"{{ $json.user_id }}\",\n  \"session_id\": \"{{ $json.session_id }}\",\n  \"agent_name\": \"{{ $json.agent_name }}\",\n  \"timestamp_of_call_made\": \"{{ $json.timestamp_of_call_made }}\",\n  \"request_id\": \"{{ $json.request_id }}\",\n  \"agent_response\": {{ JSON.stringify($json.agent_response) }},\n  \"agent_status\": \"{{ $json.agent_status }}\",\n  \"state\": {{ JSON.stringify($json.state) }}\n}",
  "options": {}
}
```

**typeVersion**: `1.1`

**Why this works**:
- `respondWith: "json"` with explicit `responseBody` gives full control over the output
- `{{ $json.field }}` for string fields (wrapped in quotes)
- `{{ JSON.stringify($json.field) }}` for fields that may contain objects, arrays, or special characters (agent_response, state)
- No wrapping in array - returns a single JSON object

### DOES NOT WORK

| Config | Problem |
|--------|---------|
| `respondWith: "allIncomingItems"` with typeVersion 1.4 | Returns `[{...}]` array, NOT `{...}` object. Frontend can sometimes handle this but it's unreliable |
| `respondWith: "text"` with `responseBody: "={{ $json }}"` | Returns `[object Object]` as text, NOT valid JSON |
| `respondWith: "allIncomingItems"` with typeVersion 1.1 | Returns empty response (0 bytes) |

---

## Simple Code-Based Workflow (Brandy Pattern)

This is the minimal working pattern. 3 nodes, no AI, deterministic responses.

### Node 1: Webhook

```json
{
  "httpMethod": "POST",
  "path": "agent-name",
  "responseMode": "responseNode",
  "options": {}
}
```

- **type**: `n8n-nodes-base.webhook`
- **typeVersion**: `2`
- `responseMode: "responseNode"` is REQUIRED - without it you get "Unused Respond to Webhook" error

### Node 2: Format Response (Code)

```javascript
// CRITICAL: data is at .body NOT at root
const data = $input.first().json.body;

// Your logic here...
const resp = "Hello! I'm your agent.";

return [{
  json: {
    user_id: data.user_id,
    session_id: data.session_id,
    agent_name: 'agent-name',
    timestamp_of_call_made: new Date().toISOString(),
    request_id: data.request_id,
    agent_response: resp,          // REQUIRED - frontend displays this
    agent_status: 'Ready',         // 'Ready' or 'Waiting'
    state: {                       // Optional - for multi-turn agents
      phase: 'default'
    }
  }
}];
```

**CRITICAL**:
- Data comes from `$input.first().json.body` - NOT `$input.first().json`
- The `agent_response` field is REQUIRED - without it the frontend shows "encountered an issue processing the response"
- Return an array with a single `{ json: {...} }` object

### Node 3: Respond to Webhook

See [CRITICAL section above](#respond-to-webhook-configuration-critical).

### Connections

```json
{
  "Webhook": {
    "main": [[{"node": "Format Response", "type": "main", "index": 0}]]
  },
  "Format Response": {
    "main": [[{"node": "Respond to Webhook", "type": "main", "index": 0}]]
  }
}
```

---

## AI-Powered Workflow

For agents that need LLM reasoning. Adds OpenRouter + Memory nodes.

### Additional Node: AI Agent

```json
{
  "promptType": "define",
  "text": "={{ $json.user_mssg }}",
  "options": {
    "systemMessage": "You are [Agent Name]... respond naturally in plain text, NOT JSON."
  }
}
```

- **type**: `@n8n/n8n-nodes-langchain.agent`
- **typeVersion**: `1.8`

### Additional Node: OpenRouter Chat Model

```json
{
  "model": "anthropic/claude-3-haiku",
  "options": {}
}
```

- **type**: `@n8n/n8n-nodes-langchain.lmChatOpenRouter`
- **typeVersion**: `1`
- **credentials**: Must have OpenRouter API credential configured in N8N
- **Connection**: `ai_languageModel` to AI Agent

### Additional Node: Conversation Memory

```json
{
  "sessionIdType": "customKey",
  "sessionKey": "={{ $('Extract Data').item.json.session_id }}",
  "contextWindowLength": 100
}
```

- **type**: `@n8n/n8n-nodes-langchain.memoryBufferWindow`
- **typeVersion**: `1.3`
- **Connection**: `ai_memory` to AI Agent

### Format Response for AI workflows

```javascript
const webhookData = $('Extract Data').first().json;
const aiData = $('AI Agent').first().json;

let aiResponse = "Default message";
if (aiData.output) {
  aiResponse = typeof aiData.output === 'string'
    ? aiData.output
    : (aiData.output.response || JSON.stringify(aiData.output));
}

return [{
  json: {
    user_id: webhookData.user_id,
    session_id: webhookData.session_id,
    agent_name: 'agent-name',
    timestamp_of_call_made: webhookData.timestamp_of_call_made,
    request_id: webhookData.request_id,
    agent_response: aiResponse,
    agent_status: 'Ready',
    state: {}
  }
}];
```

---

## Conversation State

For multi-turn agents (wizards, multi-step flows), state must persist between messages.

### How State Flows

1. User sends message -> frontend includes `state` in POST body (from previous response)
2. N8N workflow reads `data.state` from the incoming body
3. Workflow processes message, updates state
4. Workflow returns updated `state` in response
5. Frontend receives response, saves state to:
   - `conversationStateRef.current` (immediate, for next message)
   - React `useState` (for re-renders)
   - Supabase `agent_conversation_state` table (for persistence across page reloads)
6. Next message: frontend sends updated state back to N8N

### Requirements for State to Work

**ALL of these must be true:**

1. **Agent YAML**: `uses_conversation_state: true`
2. **DynamicAgentDashboard.tsx**: `agentInfo` object includes `uses_conversation_state: agentConfig.agent.uses_conversation_state`
3. **N8N workflow**: reads state from `data.state || data.conversation_state`
4. **N8N workflow**: returns `state` object in response
5. **Frontend**: `isMultiTurnAgent()` returns `true` (checks `agent.uses_conversation_state`)

If ANY of these are missing, state will not persist and the agent will reset every message.

### Reading State in N8N Code Node

```javascript
const data = $input.first().json.body;

// Read state from BOTH possible field names
let conversationState = {};
try {
  const rawState = data.state || data.conversation_state;
  if (rawState) {
    conversationState = typeof rawState === 'string'
      ? JSON.parse(rawState)
      : rawState;
  }
} catch(e) {
  conversationState = {};
}

let phase = conversationState.phase || 'default';
// ... use state ...
```

### Returning State from N8N

```javascript
const state = {
  phase: 'wizard',
  wizard_step: 2,
  // ... any custom fields
};

return [{
  json: {
    // ... other fields ...
    agent_response: resp,
    agent_status: 'Waiting',
    state: state  // Frontend will save this and send it back next message
  }
}];
```

---

## Frontend Integration Requirements

### Required Response Fields

The frontend (`N8nChatInterface.tsx` line ~597) extracts the display message like this:

```typescript
let displayMessage = response.agent_response || response.response ||
  'I received your message but encountered an issue processing the response.';
```

So `agent_response` MUST be present in the response. Without it, the user sees the error fallback.

### Full Response Schema

```typescript
interface N8nResponse {
  user_id: string;
  session_id: string;
  agent_name: string;
  timestamp_of_call_made: string;
  request_id: string;
  agent_response: string;    // REQUIRED - displayed to user
  agent_status: 'Ready' | 'Waiting';
  state?: object;            // For multi-turn agents
}
```

### Frontend Files Involved

| File | Role |
|------|------|
| `client/lib/n8nService.ts` | Sends POST to webhook, parses response, passes `state` in payload |
| `client/components/chat/N8nChatInterface.tsx` | Chat UI, manages conversationStateRef, calls sendToN8nWorkflowStreaming |
| `client/pages/DynamicAgentDashboard.tsx` | Builds `agentInfo` object - MUST include `uses_conversation_state` |
| `client/services/conversationStateService.ts` | Saves/loads state from Supabase |
| `client/types/n8n.types.ts` | TypeScript interfaces for request/response |
| `client/data/agents.ts` | Compiled agent configs (generated by build-agents.js) |
| `agents/configs/*.yaml` | Agent source configs |

### The DynamicAgentDashboard Bug (Fixed 2026-02-21)

The `agentInfo` object at line ~163 must include ALL fields the chat interface needs:

```typescript
const agentInfo = {
  id: agentConfig.agent.id,
  name: agentConfig.agent.name,
  tagline: agentConfig.agent.tagline || agentConfig.agent.description,
  avatar: agentConfig.agent.avatar,
  introMessage: generateIntroMessage(...),
  suggestionButtons: agentConfig.suggestions || [],
  uses_conversation_state: agentConfig.agent.uses_conversation_state || false  // DO NOT FORGET THIS
};
```

If `uses_conversation_state` is missing, `isMultiTurnAgent()` returns `false` and state is NEVER saved or sent.

---

## Deploying via N8N API

### Create Workflow

```bash
curl -X POST "https://n8n.theaiteam.uk/api/v1/workflows" \
  -H "X-N8N-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary "@/path/to/workflow.json"
```

### Update Workflow

```bash
curl -X PUT "https://n8n.theaiteam.uk/api/v1/workflows/$WORKFLOW_ID" \
  -H "X-N8N-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary "@/path/to/workflow.json"
```

### API Limitations

- **Cannot publish** workflows via API (`active` field is read-only)
- **Cannot set folder** via API (must move in UI)
- **Cannot set tags** on create (tags field is read-only on create)
- **Settings restrictions**: only these fields allowed: `saveDataErrorExecution`, `saveDataSuccessExecution`, `saveManualExecutions`, `callerPolicy`, `errorWorkflow`, `timezone`, `saveExecutionProgress`, `executionOrder`

### N8N API Key

Stored in: project environment / CLAUDE.md context
Base URL: `https://n8n.theaiteam.uk/api/v1/`

---

## Publishing in N8N UI

**Terminology**: N8N uses "Publish" (button), NOT "Activate" (toggle).

1. Open workflow in N8N UI
2. Click the **Publish** button (top-right area)
3. Move workflow to **Squidgy folder**: `https://n8n.theaiteam.uk/projects/2qFbZc2MGPXfvV52/folders/dB9FNUPQgULkfv7d/workflows`

### Test URL vs Production URL

| URL | When it works |
|-----|--------------|
| `/webhook-test/agent-name` | Only after clicking "Test Workflow" in canvas. Response goes to canvas, returns 0 bytes to HTTP caller |
| `/webhook/agent-name` | After workflow is published. Returns actual response to HTTP caller |

**Important**: Test URL (`/webhook-test/`) ALWAYS returns 0 bytes to the HTTP caller when using `responseMode: "responseNode"`. The response only appears in the N8N canvas. Use the production URL (`/webhook/`) for actual testing.

---

## Testing

### Test with curl (Production URL)

```bash
curl -s -X POST "https://n8n.theaiteam.uk/webhook/agent-name" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","user_mssg":"Hi","session_id":"test-sess","agent_name":"agent-name","timestamp_of_call_made":"2026-02-21T15:00:00Z","request_id":"req-001"}'
```

### Expected Response

```json
{
  "user_id": "test",
  "session_id": "test-sess",
  "agent_name": "agent-name",
  "timestamp_of_call_made": "2026-02-21T20:18:37.123Z",
  "request_id": "req-001",
  "agent_response": "Hello! I'm your agent...",
  "agent_status": "Ready",
  "state": {"phase": "default"}
}
```

### Test State Persistence

Send a second message with the state from the first response:

```bash
curl -s -X POST "https://n8n.theaiteam.uk/webhook/agent-name" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","user_mssg":"next step","session_id":"test-sess","agent_name":"agent-name","timestamp_of_call_made":"2026-02-21T15:01:00Z","request_id":"req-002","state":{"phase":"wizard","wizard_step":1}}'
```

Verify the response advances to the next step (not back to the beginning).

### Check N8N Execution Data

```bash
# Get latest executions
curl -s -H "X-N8N-API-KEY: $API_KEY" \
  "https://n8n.theaiteam.uk/api/v1/executions?workflowId=$WF_ID&limit=5"

# Get execution with full data (see what payload was received)
curl -s -H "X-N8N-API-KEY: $API_KEY" \
  "https://n8n.theaiteam.uk/api/v1/executions/$EXEC_ID?includeData=true"
```

---

## Troubleshooting

### "I received your message but encountered an issue processing the response"

**Cause**: Response doesn't contain `agent_response` field.

**Fix**: Ensure Code node returns `agent_response` in the JSON output AND the Respond to Webhook node includes it in the `responseBody` template.

### 200 OK but 0 bytes (empty response)

**Causes** (in order of likelihood):
1. Using test URL (`/webhook-test/`) - always returns 0 bytes to caller
2. Code node reads `$input.first().json` instead of `$input.first().json.body`
3. Respond to Webhook using wrong `respondWith` mode
4. Multiple workflows with same webhook path

### 404 "webhook not registered"

**Causes**:
1. Workflow not published
2. Wrong webhook path
3. Another workflow has the same path and is intercepting
4. API-created workflow not yet published via UI

### State resets every message (wizard goes back to step 1)

**Causes** (in order of likelihood):
1. `uses_conversation_state` not in `agentInfo` object in `DynamicAgentDashboard.tsx`
2. `uses_conversation_state: true` missing from agent YAML
3. `agents.ts` not rebuilt after YAML change (`node scripts/build-agents.js`)
4. Code node not reading `data.state` from incoming body
5. Code node not returning `state` in response

**Debug**: Add to browser console check:
- Open browser DevTools (F12) > Console
- Look for `isMultiTurnAgent` - must be `true`
- Look for state being sent - must NOT be `undefined`

### Multiple workflows with same webhook path

Only ONE published workflow can use a given webhook path. If two workflows use `/brandy`, N8N will fail silently.

**Fix**: Change the webhook path on the old/broken workflow, or unpublish it.

---

## Working Examples

### Brandy (Simple Code-Based Wizard)

**File**: `/n8n/brandy_workflow_DEPLOYED.json`

**Deployed at**: `https://n8n.theaiteam.uk/webhook/brandy`

**Workflow ID**: `EuCOoyT1Tk22hm68`

**Pattern**: 3 nodes (Webhook -> Code -> Respond to Webhook), no AI, uses conversation state for 6-step wizard flow

### FK Personal Assistant v5 (AI-Powered)

**Workflow ID**: `Xku5blRWCqhUJDHV`

**Pattern**: Full AI workflow with OpenRouter, Memory, multiple Respond to Webhook nodes

### SA Content Questions (AI-Powered)

**Workflow ID**: `Tn6QDF39oaS8dA6a`

**Pattern**: AI workflow with Supabase integration, uses `respondWith: "json"` with explicit responseBody

---

## Version History

- **2026-02-21**: Complete rewrite based on Brandy deployment. Added: Respond to Webhook critical config, state persistence end-to-end, DynamicAgentDashboard bug fix, test vs production URL behavior, working examples.
