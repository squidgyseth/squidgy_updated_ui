# N8N Workflow Patterns and Best Practices

## The Proven 10-Node AI Agent Pattern

Every Squidgy AI agent follows this architecture:

```
1. Webhook (POST)
2. Supabase getAll (fetch user data)
3. Code - Prepare Data (merge inputs)
4. AI Agent (with 3 sub-nodes)
   - OpenRouter Chat Model
   - Simple Memory
   - Structured Output Parser
5. If Ready (status check)
6. Respond - Waiting
7. Respond - Ready
```

### Node Configuration Reference

#### 1. Webhook Node

```json
{
  "httpMethod": "POST",
  "path": "{agent_id}",
  "responseMode": "responseNode",
  "options": {}
}
```

- Use `/webhook/{agent_id}` in production (NOT `/webhook-test/`)
- `responseMode: 'responseNode'` delegates response to Respond nodes

#### 2. Supabase Node (CRITICAL CONFIGURATION)

**The configuration that WORKS:**

```json
{
  "operation": "getAll",
  "tableId": "TABLE_NAME",
  "returnAll": false,
  "limit": 1,
  "filters": {
    "conditions": [{
      "keyName": "user_id",
      "condition": "eq",
      "keyValue": "={{ $json.body.user_id }}"
    }]
  },
  "alwaysOutputData": true,
  "onError": "continueRegularOutput"
}
```

**Why each field matters:**

- `operation: "getAll"` - Returns empty array on no match (safe). Using `get` crashes the workflow.
- `condition: "eq"` - REQUIRED. Parser fails without it: `failed to parse logic tree`.
- `alwaysOutputData: true` - Ensures downstream nodes run even with empty results.
- `onError: "continueRegularOutput"` - Swallows errors, passes empty result downstream.
- `filters.conditions` array - DO NOT use `filterString` (it sends literal expression text instead of evaluating).

**What breaks:**
- Using `get` operation → crashes on no row found
- Missing `condition: "eq"` → parser error
- Missing `alwaysOutputData: true` → empty results produce 0 output items, flow stops
- Using `filterString` → literal `{{ $json.body.user_id }}` sent to Supabase

#### 3. Code - Prepare Data Node

**Purpose:** Merge webhook body + Supabase data + conversation state into flat JSON for AI agent.

**Handle getAll array safely:**

```javascript
// Input from webhook
const webhookData = $input.first().json.body;

// Input from Supabase (array from getAll)
const supabaseResult = $('Supabase').first().json;
const dbData = Array.isArray(supabaseResult)
  ? (supabaseResult[0] || {})
  : (supabaseResult || {});

// Check if data exists
const dataExists = Object.keys(dbData).length > 0 && dbData.user_id;

// Merge into flat structure
return {
  json: {
    user_id: webhookData.user_id,
    user_message: webhookData.user_mssg,
    session_id: webhookData.session_id,
    request_id: webhookData.request_id,
    conversation_state: webhookData.state || {},
    data_exists: dataExists,
    // Spread DB fields if they exist
    ...(dataExists ? dbData : {})
  }
};
```

**Field naming critical:**
- Frontend sends `state` (lowercase)
- Read at `$input.first().json.body.state` (NOT `conversation_state`)
- Pass to AI as `conversation_state` in merged JSON

#### 4. AI Agent Node

**System Prompt Structure:**

```
You are {agent name} - {specialization}.

# Current Context

User ID: {{ $json.user_id }}
Session ID: {{ $json.session_id }}
Data Exists: {{ $json.data_exists }}
Conversation State: {{ JSON.stringify($json.conversation_state) }}

# Your Role

{agent description and personality}

# Instructions

{agent-specific guidance}

# Response Format

Respond with valid JSON matching this schema:
{
  "response": "Your conversational message",
  "Status": "Waiting" or "Ready",
  "state": { updated conversation state }
}

IMPORTANT: Keep responses under 1500 words. For large outputs, split across multiple turns.
```

**Mustache variables available:**
- `{{ $json.user_id }}`
- `{{ $json.session_id }}`
- `{{ $json.user_message }}`
- `{{ $json.data_exists }}`
- `{{ JSON.stringify($json.conversation_state) }}`
- Any other fields from Code node output

#### 5. OpenRouter Chat Model (Sub-node)

```json
{
  "model": "anthropic/claude-3-5-sonnet",
  "credentials": "OpenRouterApi"
}
```

Connection type: `ai_languageModel` (NOT `main`)

#### 6. Simple Memory (Sub-node)

```json
{
  "contextWindowLength": 100,
  "sessionIdType": "customKey",
  "sessionKey": "={{ $json.session_id }}"
}
```

Connection type: `ai_memory`

#### 7. Structured Output Parser (Sub-node)

**Schema (EXACT FORMAT):**

```json
{
  "response": {
    "type": "string",
    "description": "The conversational message to the user"
  },
  "Status": {
    "type": "string",
    "enum": ["Waiting", "Ready"],
    "description": "Waiting if gathering info, Ready when task complete"
  },
  "state": {
    "type": "object",
    "description": "Updated conversation state to send back to frontend"
  }
}
```

**CRITICAL:** Capital "S" in `Status`. The If Ready node checks this exact casing.

Configuration:
```json
{
  "schemaType": "manual",
  "jsonSchema": "{ ... }",
  "autoFix": true
}
```

Connection type: `ai_outputParser`

#### 8. If Ready Node

```json
{
  "conditions": {
    "string": [
      {
        "value1": "={{ $json.output.Status }}",
        "operation": "equals",
        "value2": "Ready"
      }
    ]
  }
}
```

- True branch → Respond - Ready
- False branch → Respond - Waiting

#### 9/10. Respond to Webhook Nodes

**Both nodes use:**

```json
{
  "respondWith": "json",
  "responseBody": "={{ ... }}",
  "options": {
    "responseCode": 200,
    "responseHeaders": {}
  },
  "typeVersion": 1.1
}
```

**Response body template:**

```javascript
{{
  {
    "user_id": $('Code - Prepare Data').item.json.user_id,
    "session_id": $('Code - Prepare Data').item.json.session_id,
    "agent_name": "{agent_id}",
    "agent_response": $('AI Agent - {Name}').item.json.output.response,
    "agent_status": $('AI Agent - {Name}').item.json.output.Status,
    "state": JSON.stringify($('AI Agent - {Name}').item.json.output.state)
  }
}}
```

**Pattern:**
- IDs from Code node (stable identifiers)
- AI output from AI Agent node (generated content)
- `typeVersion: 1.1` required (1.0 has different response handling)

## Common N8N Gotchas

### 1. Test vs Production Webhooks

**NEVER use `/webhook-test/` in production YAML configs.**

- Test webhooks only work when workflow editor is open
- Production must use `/webhook/`
- Agent builder validator catches this error

### 2. The Capital "S" Status Field

`Status` (capital S) is intentional, not a typo.

- Output parser schema uses `Status`
- If Ready node checks `$json.output.Status`
- Using lowercase `status` breaks the If condition

### 3. State Field Naming

Frontend sends `state` (lowercase), not `conversation_state`.

- Read from webhook: `$input.first().json.body.state`
- Pass to AI as `conversation_state` in Code node
- AI returns as `state` in output
- Frontend receives and persists as `state`

### 4. Empty Response (0 Bytes)

If curl returns HTTP 200 with 0 bytes, the Respond node never fired.

**Debugging steps:**
1. Check N8N execution log - which nodes ran?
2. Look for red error nodes
3. Check if flow branched away from Respond nodes
4. Verify If Ready condition matches output schema

### 5. Supabase Errors Killing Workflow

Using `get` operation fails silently when no row exists.

**Solution:** Always use `getAll` with:
- `limit: 1`
- `condition: "eq"`
- `alwaysOutputData: true`
- `onError: "continueRegularOutput"`

### 6. Response Size Limits

Structured Output Parser can overflow on very long responses (e.g., brand bibles).

**Limits:**
- Keep responses under 1500 words
- For large content, split across multiple turns tracked by state
- System prompt includes explicit instruction to split long outputs

### 7. Respond Node Version

Always use `typeVersion: 1.1` with `respondWith: "json"`.

Version 1.0 has different response body handling that may not work with the frontend.

## N8N API Limitations

### What the API CAN Do

- Create workflows: `POST https://n8n.theaiteam.uk/api/v1/workflows`
- Accepts: `name`, `nodes`, `connections`, `settings`
- Returns: Created workflow with assigned `id`

### What the API CANNOT Do (UI Only)

| Action | Must Do In N8N UI |
|--------|-------------------|
| Set credentials | Select OpenRouter + Supabase credentials per node |
| Activate workflow | Click "Publish" button |
| Set tags | Add tags via UI |
| Move to folder | Drag to folder |

### API Request Format

```bash
N8N_KEY=$(cat /Users/sethward/GIT/Squidgy/.n8n-api-key | tr -d '\n')

curl -X POST https://n8n.theaiteam.uk/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agent Name",
    "nodes": [...],
    "connections": {...},
    "settings": {...}
  }'
```

**Do NOT include:** `active`, `tags`, `id`, `staticData`, `pinData`, `createdAt`, `updatedAt`, `versionId`

## Testing Workflows via Curl

**Basic test:**

```bash
N8N_KEY=$(cat /Users/sethward/GIT/Squidgy/.n8n-api-key | tr -d '\n')

curl -s -X POST https://n8n.theaiteam.uk/webhook/{agent_id} \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "user_id": "00000000-0000-0000-0000-000000000001",
      "user_mssg": "hello",
      "session_id": "test-session",
      "request_id": "test-request",
      "state": {}
    }
  }' | python3 -m json.tool
```

**Check response body size:**

```bash
curl -s -X POST https://n8n.theaiteam.uk/webhook/{agent_id} \
  -H "Content-Type: application/json" \
  -d '{"body":{"user_id":"test","user_mssg":"hello","session_id":"test","request_id":"test"}}' \
  | wc -c
```

If result is `0`, Respond node never fired.

**Use UUIDs for test data:** Supabase `user_id` fields are UUID type. Use `00000000-0000-0000-0000-000000000001` for testing.

## N8N Workflow Versioning

**Golden rule:** NEVER modify a working workflow directly. Duplicate first.

**Version tracking example (Brandy):**

| Workflow | N8N ID | Status | Notes |
|----------|--------|--------|-------|
| Brandy JS-only | EuCOoyT1Tk22hm68 | INACTIVE | Pure JS, no AI |
| Brandy AI v1 | D7hqn6HStORy687Y | BROKEN | Supabase `get` fails for new users |
| Brandy AI v2 | 4mUkvAI8vgjLttpT | ACTIVE | getAll + alwaysOutputData + condition:eq |

**Backup pattern:**
- Save workflow JSON to `squidgy_updated_ui/n8n/{agent_id}_workflow_v{N}.json`
- Track last-known-good version
- Include version notes in filename or adjacent README

## Cache Invalidation

After updating Pia's system prompt, restart the N8N Personal Assistant workflow.

Pia caches her system prompt. Changes are invisible until the workflow reloads.

**Steps:**
1. Update `system_prompt.md`
2. Open Pia's workflow in N8N UI
3. Click "Deactivate" then "Activate" (or just restart)
4. Test routing to verify changes took effect

## Connection Types Reference

LangChain sub-nodes use special connection types:

| Sub-node | Connection Type |
|----------|-----------------|
| OpenRouter Chat Model | `ai_languageModel` |
| Simple Memory | `ai_memory` |
| Structured Output Parser | `ai_outputParser` |

Standard nodes use `main` connection type.

## Debugging Checklist

1. **Empty response (0 bytes):**
   - Check N8N execution log - did Respond node run?
   - Check If Ready condition - does it match output Status?
   - Check AI Agent output - does `output.response` exist?

2. **Supabase errors:**
   - Using `get` instead of `getAll`?
   - Missing `condition: "eq"`?
   - Missing `alwaysOutputData: true`?

3. **Workflow won't activate:**
   - Are credentials set on all nodes?
   - Is workflow saved?
   - Check for node configuration errors (red indicators)

4. **State not persisting:**
   - Check YAML: `uses_conversation_state: true`?
   - Frontend sending `state` field in body?
   - Code node reading from `$input.first().json.body.state`?

5. **Memory not working:**
   - Check session_id is being passed correctly
   - Verify `sessionKey` in Memory node: `={{ $json.session_id }}`
   - Check Memory node is connected via `ai_memory` type
