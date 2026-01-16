# N8N Conversation State Integration

This document explains how to integrate conversation state persistence with your N8N agent workflows.

## Enabling State Persistence for an Agent

To enable conversation state persistence for any agent, add this to the agent's YAML config:

```yaml
agent:
  id: your_agent_id
  name: Your Agent Name
  # ... other config ...
  uses_conversation_state: true  # <-- Add this line
```

Currently enabled for:
- `newsletter` - Single-topic newsletter
- `newsletter_multi` - Multi-topic newsletter
- `content_repurposer` - Content repurposer
- `content_repurposer_multi` - Multi-topic content repurposer

To add more agents, simply add `uses_conversation_state: true` to their YAML config and run `npm run build:agents`.

## Overview

The `agent_conversation_state` table stores the conversation state between messages, allowing the AI to maintain context across multiple turns.

## Database Table

The table is created by running the migration: `supabase/migrations/20250116_agent_conversation_state.sql`

```sql
-- Key columns:
session_id    TEXT    -- Unique session identifier
agent_id      TEXT    -- Agent identifier (e.g., 'newsletter_multi')
firm_user_id  UUID    -- User ID
state         JSONB   -- The conversation state
status        TEXT    -- 'active', 'completed', or 'abandoned'
```

## N8N Workflow Structure

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Webhook        │ --> │  Get State       │ --> │   AI Agent      │ --> │  Save State      │
│  (Receive Msg)  │     │  (Code Node)     │     │  (Newsletter)   │     │  (Code Node)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────────┘
```

---

## Code Node 1: Get Previous State (BEFORE AI Agent)

Add this Code node after your Webhook and before the AI Agent node.

```javascript
// Get Previous Conversation State
// Place this BEFORE the AI Agent node

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials (add these to your N8N credentials or environment)
const supabaseUrl = $env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = $env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get input from webhook
const input = $input.first().json;
const session_id = input.session_id;
const agent_id = input.agent_id || 'newsletter_multi';
const user_id = input.user_id || input.firm_user_id;
const user_message = input.user_mssg || input.message;

// Default state for this agent type
const defaultState = {
  phase: 'topic_selection',
  selected_topics: [],
  current_topic_index: 0,
  current_question_index: 0,
  answers: {}
};

let conversationState = defaultState;

try {
  // Query for existing state
  const { data, error } = await supabase
    .from('agent_conversation_state')
    .select('state, status')
    .eq('session_id', session_id)
    .eq('agent_id', agent_id)
    .eq('status', 'active')
    .single();

  if (data && !error) {
    conversationState = data.state;
    console.log('Found existing state:', conversationState);
  } else {
    // Create new state record
    await supabase
      .from('agent_conversation_state')
      .insert({
        session_id: session_id,
        agent_id: agent_id,
        firm_user_id: user_id,
        state: defaultState,
        status: 'active'
      });
    console.log('Created new state record');
  }
} catch (err) {
  console.error('Error getting state:', err);
}

// Pass everything to the next node
return {
  json: {
    ...input,
    session_id: session_id,
    agent_id: agent_id,
    user_id: user_id,
    user_mssg: user_message,
    conversation_state: conversationState
  }
};
```

---

## Code Node 2: Save New State (AFTER AI Agent)

Add this Code node after your AI Agent node to save the new state.

```javascript
// Save Conversation State After AI Response
// Place this AFTER the AI Agent node

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = $env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = $env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get input (includes original data + AI response)
const input = $input.first().json;
const session_id = input.session_id;
const agent_id = input.agent_id || 'newsletter_multi';

// Get AI output - adjust based on your AI Agent node output
let aiOutput = input.output || input.response || input.text;

// Parse AI response to extract state
let newState = null;
let aiStatus = 'Waiting';
let responseText = '';

try {
  // If AI output is a string, try to parse as JSON
  if (typeof aiOutput === 'string') {
    // Try to extract JSON from the response
    const jsonMatch = aiOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      newState = parsed.state;
      aiStatus = parsed.Status || 'Waiting';
      responseText = parsed.response || aiOutput;
    }
  } else if (typeof aiOutput === 'object') {
    newState = aiOutput.state;
    aiStatus = aiOutput.Status || 'Waiting';
    responseText = aiOutput.response || '';
  }
} catch (parseError) {
  console.error('Error parsing AI response:', parseError);
  responseText = aiOutput;
}

// Save state if we have one
if (newState) {
  try {
    const status = aiStatus === 'Ready' ? 'completed' : 'active';

    await supabase
      .from('agent_conversation_state')
      .update({
        state: newState,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', session_id)
      .eq('agent_id', agent_id);

    console.log('State saved successfully:', newState);
    console.log('Conversation status:', status);
  } catch (saveError) {
    console.error('Error saving state:', saveError);
  }
}

// Return the response to send back to the user
return {
  json: {
    response: responseText,
    status: aiStatus,
    state: newState,
    session_id: session_id,
    agent_id: agent_id
  }
};
```

---

## Frontend Integration

The frontend already has `conversationStateService.ts` that can be used to:

1. **Get or create state when starting a conversation:**
```typescript
import { conversationStateService } from './services/conversationStateService';

// When user opens chat
const state = await conversationStateService.getOrCreateState(
  sessionId,
  'newsletter_multi',
  userId
);
```

2. **Save state after receiving AI response:**
```typescript
// After receiving webhook response
await conversationStateService.saveStateFromAIResponse(
  sessionId,
  'newsletter_multi',
  aiResponse
);
```

3. **Include session_id in webhook calls:**
```typescript
// When sending message to N8N
const payload = {
  session_id: sessionId,
  agent_id: 'newsletter_multi',
  user_id: userId,
  user_mssg: userMessage,
  // ... other data
};
```

---

## Webhook Payload Structure

Ensure your webhook includes these fields:

```json
{
  "session_id": "user123_newsletter_multi_1705123456789_abc123",
  "agent_id": "newsletter_multi",
  "user_id": "uuid-of-user",
  "user_mssg": "User's message here",
  "website_url": "https://example.com",
  "knowledge_base_summary": "...",
  "available_topics_display": "..."
}
```

---

## State Structure

The state object follows this structure:

```json
{
  "phase": "topic_selection | gathering | ready",
  "selected_topics": ["industry_insights", "education", "events"],
  "current_topic_index": 0,
  "current_question_index": 1,
  "answers": {
    "industry_insights": {
      "q1": "SaaS and cloud computing",
      "q2": "CTOs and technical leaders"
    },
    "education": {},
    "events": {}
  }
}
```

---

## Environment Variables for N8N

Add these to your N8N environment:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

Note: Use the **service role key** (not anon key) in N8N so it can bypass RLS policies.

---

## Testing

1. Run the SQL migration to create the table
2. Set up the N8N workflow with the code nodes
3. Start a conversation - you should see a new row in `agent_conversation_state`
4. Send follow-up messages - the state should update
5. Check that the AI receives the correct `conversation_state` on each turn
