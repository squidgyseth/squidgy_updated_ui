# N8N Conversation State Integration

**Purpose**: How multi-turn conversation state works end-to-end in Squidgy agents.

**Last Updated**: 2026-02-21

---

## Quick Setup

To enable conversation state for any agent, you need ALL of these:

1. **Agent YAML** (`/agents/configs/agent-name.yaml`):
```yaml
agent:
  uses_conversation_state: true
```

2. **Rebuild agents**: `node scripts/build-agents.js`

3. **DynamicAgentDashboard.tsx** (line ~163) - `agentInfo` must include:
```typescript
uses_conversation_state: agentConfig.agent.uses_conversation_state || false
```

4. **N8N workflow** must read state from body and return state in response

If ANY of these are missing, state will silently not work and the agent will reset every message.

---

## Currently Enabled Agents

- `brandy` - Brand advisor wizard (6-step flow)
- `newsletter_multi` - Multi-topic newsletter
- `content_repurposer_multi` - Multi-topic content repurposer

---

## How State Flows (End-to-End)

```
1. User sends message
   Frontend: sendToN8nWorkflowStreaming() in n8nService.ts
   Payload includes: { ..., state: conversationStateRef.current }
   (state is undefined on first message, populated on subsequent)

2. N8N receives POST
   Code node reads: data.state || data.conversation_state
   Processes message based on current state
   Returns updated state in response

3. Frontend receives response
   N8nChatInterface.tsx line ~582:
   if (response.state && isMultiTurnAgent()) {
     setConversationState(response.state);           // React state
     conversationStateRef.current = response.state;  // Ref (immediate)
     // Also saves to Supabase for persistence
   }

4. User sends next message
   conversationStateRef.current now has the updated state
   Gets included in next POST payload as "state"
```

---

## Database Table

Table: `agent_conversation_state`

```sql
session_id    TEXT    -- Unique session identifier
agent_id      TEXT    -- Agent identifier (e.g., 'brandy')
firm_user_id  UUID    -- User ID
state         JSONB   -- The conversation state (any structure)
status        TEXT    -- 'active', 'completed', or 'abandoned'
created_at    TIMESTAMP
updated_at    TIMESTAMP
expires_at    TIMESTAMP
```

Migration: `supabase/migrations/20250116_agent_conversation_state.sql`

---

## N8N Code Node: Reading State

```javascript
const data = $input.first().json.body;

// Read state from BOTH possible field names (frontend sends as "state")
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

// Use state
let phase = conversationState.phase || 'default';
let step = conversationState.step || 0;
```

---

## N8N Code Node: Returning State

```javascript
const state = {
  phase: 'wizard',
  wizard_step: 2,
  wizard_data: { atmosphere: 'energised' }
};

return [{
  json: {
    user_id: data.user_id,
    session_id: data.session_id,
    agent_name: 'agent-name',
    timestamp_of_call_made: new Date().toISOString(),
    request_id: data.request_id,
    agent_response: 'Your response text here',
    agent_status: 'Waiting',
    state: state  // Frontend saves this and sends it back next message
  }
}];
```

---

## Frontend Files

| File | Role |
|------|------|
| `client/lib/n8nService.ts` line ~425 | Includes `state` in POST payload: `...(conversationState && { state: conversationState })` |
| `client/components/chat/N8nChatInterface.tsx` line ~65 | `conversationStateRef` - ref for immediate state access |
| `client/components/chat/N8nChatInterface.tsx` line ~129 | `isMultiTurnAgent()` - checks `agent.uses_conversation_state` |
| `client/components/chat/N8nChatInterface.tsx` line ~582 | Saves response state to ref + Supabase |
| `client/pages/DynamicAgentDashboard.tsx` line ~163 | `agentInfo` object - MUST include `uses_conversation_state` |
| `client/services/conversationStateService.ts` | Supabase CRUD for state persistence |

---

## Brandy State Schema (Example)

```json
{
  "phase": "assessment|wizard|import|summary|bible|advisor",
  "brand_exists": false,
  "wizard_step": 0,
  "wizard_data": {
    "atmosphere": "energised and hopeful",
    "rebellious_edge": "we use AI to code 100x faster",
    "enemy_statement": "agencies that overcharge",
    "visual_direction": "bold, neon, dark backgrounds",
    "hook_style": "provocative questions",
    "voice_messaging": "direct, no fluff"
  },
  "import_status": null
}
```

---

## Debugging State Issues

### Check 1: Is isMultiTurnAgent true?

Open browser console, look for:
```
BRANDY DEBUG: isMultiTurnAgent: true
```

If `false`: `uses_conversation_state` is not being passed in `agentInfo`.

### Check 2: Is state being sent?

Browser console:
```
BRANDY DEBUG: Sending message with state: {"phase":"wizard",...}
```

If `undefined`: state is not being saved from previous response.

### Check 3: Is N8N receiving state?

Check execution data via API:
```bash
curl -s -H "X-N8N-API-KEY: $KEY" \
  "https://n8n.theaiteam.uk/api/v1/executions/$ID?includeData=true" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d['data']['resultData']['runData']['Webhook'][0]['data']['main'][0][0]['json']['body']))"
```

---

## Version History

- **2026-02-21**: Complete rewrite. Documented end-to-end state flow, DynamicAgentDashboard bug, debugging steps, Brandy state schema.
