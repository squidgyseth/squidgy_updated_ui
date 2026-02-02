# Squidgy Agent Architecture Plan

## Overview

This document outlines the redesigned architecture for Personal Assistant (Master Agent) and Newsletter Multi workflows.

---

## 1. Core Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Routing Behavior | Redirect response | UI handles navigation to child agents, cleaner separation |
| Session Cache | N8N built-in memory | No external dependency, session_id as key |
| Instructions Storage | .md files in repo | Cached at workflow start, version controlled |
| Request Processing | **ALL requests go through LLM** | LLM understands intent, decides action |

---

## 2. Personal Assistant - Master Agent

### 2.1 Key Principle: LLM Decides Everything

**Why LLM for all requests?**

The LLM must understand user intent to make intelligent decisions:

| User Says | Looks Like | Actually Is | LLM Decision |
|-----------|------------|-------------|--------------|
| "Help me with newsletter" | Routing | USE newsletter agent | Redirect to `/chat/newsletter_multi` |
| "I want to enable newsletter" | Routing | SETUP newsletter agent | Stay in PA, run onboarding |
| "What's my company name?" | Simple query | RAG lookup needed | Search KB, synthesize answer |
| "Update my phone to 123" | CRUD | Extract entity + value | Update KB, confirm to user |
| "Something complex..." | Unknown | Needs reasoning | Full agent processing |

**Pattern matching alone cannot distinguish these cases. LLM intelligence is required.**

### 2.2 Workflow Structure

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         PERSONAL ASSISTANT WORKFLOW                           │
│                                                                               │
│  Principle: ALL meaningful requests go through LLM for intent understanding  │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Webhook   │───▶│ Load Instructions│───▶│  Get User Config │───▶│ Pre-Process │
│   (POST)    │    │   (HTTP/File)    │    │   (Supabase)     │    │ (Code Node) │
└─────────────┘    └─────────────────┘    └──────────────────┘    └──────┬──────┘
                                                                          │
                   ┌──────────────────────────────────────────────────────┘
                   │
                   ▼
          ┌────────────────┐     ┌─────────────────────────────────────────────┐
          │  Cache Check   │────▶│ Cache HIT: Return cached response (rare)    │
          │  (Code Node)   │     └─────────────────────────────────────────────┘
          └───────┬────────┘
                  │ Cache MISS (most requests)
                  ▼
          ┌────────────────────────────────────────────────────────────────────┐
          │                      PA AI AGENT (LLM)                              │
          │                                                                     │
          │  LLM receives:                                                      │
          │  - User message                                                     │
          │  - User config (enabled agents, preferences)                        │
          │  - Available agents list with descriptions                          │
          │  - Conversation history (session memory)                            │
          │  - Instructions from .md file                                       │
          │                                                                     │
          │  LLM decides and outputs:                                           │
          │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
          │  │   ANSWER    │  │  REDIRECT   │  │  ONBOARD    │  │   CLARIFY   │ │
          │  │  (RAG/CRUD) │  │ (to agent)  │  │   (setup)   │  │   (ask Q)   │ │
          │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
          │                                                                     │
          │  Tools available to LLM:                                            │
          │  - Vector Search (RAG)      - Save to KB (CRUD)                     │
          │  - Get Assistants           - Update Assistant                      │
          │  - Web Analysis             - Check Previous Runs                   │
          └───────────────────────────────────────────────────────────────────┬─┘
                                                                              │
                  ┌───────────────────────────────────────────────────────────┘
                  │
                  ▼
          ┌────────────────┐
          │Response Builder│  ← Formats LLM output into standard response
          │  (Code Node)   │
          └───────┬────────┘
                  │
                  ▼
          ┌────────────────┐
          │Respond Webhook │
          └────────────────┘
```

### 2.3 What's Deterministic vs What Needs LLM

| Stage | Type | What It Does |
|-------|------|--------------|
| Pre-Process | **Deterministic** | Parse request, extract user_id, session_id, validate input |
| Load Instructions | **Deterministic** | Fetch .md file (cached at workflow start) |
| Get User Config | **Deterministic** | Query Supabase for user settings |
| Cache Check | **Deterministic** | Check if exact query was answered recently |
| **Intent Understanding** | **LLM Required** | Understand what user actually wants |
| **Decision Making** | **LLM Required** | Answer, redirect, onboard, or clarify? |
| **Entity Extraction** | **LLM Required** | For CRUD: what to update, what value |
| **Response Synthesis** | **LLM Required** | For RAG: synthesize readable answer from data |
| **Routing Decision** | **LLM Required** | Which agent? Is it USE or SETUP? |
| Response Builder | **Deterministic** | Format JSON response structure |

### 2.4 LLM System Prompt Structure

The LLM receives instructions that tell it:

```markdown
## YOUR ROLE
You are the Personal Assistant (Master Agent). You help users and route them
to specialized agents when appropriate.

## AVAILABLE AGENTS (from user config)
{{ $json.enabled_agents }}

| Agent | ID | Description | When to Redirect |
|-------|-----|-------------|------------------|
| Newsletter Multi | newsletter_multi | Creates multi-topic newsletters | User wants to CREATE/SEND newsletter |
| Content Repurposer | content_repurposer | Transforms content formats | User wants to REPURPOSE content |
| SOL | SOL | Solar sales assistant | User asks about LEADS/DEALS/SALES |

## DECISION RULES

1. **Can I answer this from Knowledge Base?**
   → Use Vector Search tool, synthesize answer, respond

2. **Is user asking to USE an enabled agent?**
   → Return redirect response with target_agent and target_url

3. **Is user asking to SETUP/ENABLE an agent?**
   → Stay here, run onboarding flow

4. **Is this a CRUD operation (update/save/delete)?**
   → Use appropriate tool, confirm action, respond

5. **Not sure what user wants?**
   → Ask clarifying question

## RESPONSE FORMAT
Always return structured response with:
- message: Human readable response
- routing: { should_redirect, target_agent, target_url } if redirecting
- actions_performed: What you did
- actions_todo: What needs user action
```

### 2.5 Pre-Process Node (Deterministic)

```javascript
// Code Node: Pre-Process
// This is the ONLY deterministic processing before LLM

const body = $input.first().json.body;

// Extract and validate required fields
const userId = body.user_id;
const sessionId = body.session_id;
const userMessage = body.user_mssg?.trim() || '';
const agentName = body.agent_name || 'personal_assistant';
const requestId = body.request_id || crypto.randomUUID();

// Basic validation (deterministic)
if (!userId || !userMessage) {
  return {
    json: {
      error: true,
      message: 'Missing required fields: user_id or user_mssg'
    }
  };
}

// Pass everything to LLM - no classification here
return {
  json: {
    user_id: userId,
    session_id: sessionId,
    user_mssg: userMessage,
    agent_name: agentName,
    request_id: requestId,
    timestamp: new Date().toISOString(),
    // LLM will decide what to do with this
  }
};
```

### 2.3 Instructions Loading

**File Structure:**
```
/agents/prompts/
├── personal_assistant_master.md      # Main PA instructions
├── personal_assistant_onboarding.md  # Onboarding flow
├── newsletter_multi.md               # Newsletter agent
├── content_repurposer.md             # Content repurposer
└── shared/
    ├── response_format.md            # Common response rules
    ├── button_patterns.md            # Button formatting
    └── kb_categories.md              # 12 KB categories
```

**Loading Mechanism (HTTP Request Node):**
```
URL: https://raw.githubusercontent.com/Squidgy-AI/squidgy_updated_ui/main/agents/prompts/personal_assistant_master.md
Method: GET
Cache: Workflow-level (loaded once at start)
```

### 2.4 Redirect Response Structure

When routing to a child agent:

```json
{
  "user_id": "uuid",
  "session_id": "uuid",
  "agent_name": "personal_assistant",
  "request_id": "uuid",
  "timestamp": "2025-01-16T10:30:00Z",

  "response": {
    "message": "I'll connect you with the Newsletter Agent to help with that.",
    "type": "redirect"
  },

  "actions_performed": [
    {"action": "intent_detection", "detected": "newsletter_creation", "confidence": 0.95}
  ],

  "actions_todo": [],

  "routing": {
    "should_redirect": true,
    "target_agent": "newsletter_multi",
    "target_url": "/chat/newsletter_multi",
    "context_to_pass": {
      "original_request": "Create a newsletter about AI trends",
      "user_preferences": {
        "tone": "professional",
        "audience": "b2b"
      }
    }
  }
}
```

### 2.5 Session Memory Configuration

**N8N Memory Node Settings:**
```
Type: Window Buffer Memory
Session Key: {{ $json.body.session_id }}
Context Window: 10 messages
```

**Memory Scope:**
- Persists within N8N execution context
- Cleared when session expires (handled by session_id rotation)
- No external storage dependency

---

## 3. Newsletter Multi Workflow

### 3.1 Current vs Proposed Flow

**Current:**
```
Webhook → Supabase View → Prepare Data → AI Agent → Structured Output → Generator
```

**Proposed:**
```
Webhook → Load Instructions → Get Config → Check Cache → AI Agent → Response Builder → Webhook
                                              │
                                              ▼ (cache miss)
                                         Full Processing
```

### 3.2 Improvements

| Area | Current | Proposed |
|------|---------|----------|
| Instructions | Embedded in system prompt | Loaded from .md file |
| Response Format | Custom per-agent | Standardized with actions_performed |
| Caching | None | Session-scoped for repeated queries |
| State Management | Conversation state in Supabase | N8N memory + state object |

### 3.3 Newsletter Response Example

```json
{
  "user_id": "uuid",
  "session_id": "uuid",
  "agent_name": "newsletter_multi",
  "request_id": "uuid",
  "timestamp": "2025-01-16T10:30:00Z",

  "response": {
    "message": "I've drafted your newsletter! Here's a preview:\n\n**Subject:** AI Trends This Week\n\n[Preview content...]\n\n$**Approve & Send**$\n$**Edit Subject**$\n$**Change Tone**$",
    "type": "text",
    "preview": {
      "type": "newsletter",
      "subject": "AI Trends This Week",
      "sections": 3,
      "word_count": 450
    }
  },

  "actions_performed": [
    {"action": "topic_research", "topics": ["AI", "Machine Learning"], "sources": 5},
    {"action": "content_generation", "sections": 3, "tone": "professional"},
    {"action": "rag_search", "category": "messaging_positioning", "used_for": "brand_voice"}
  ],

  "actions_todo": [
    {"action": "user_approval", "required": true, "options": ["approve", "edit", "regenerate"]},
    {"action": "schedule_send", "optional": true, "default": "immediate"}
  ],

  "routing": {
    "should_redirect": false,
    "target_agent": null
  }
}
```

---

## 4. UI Changes Required

Based on the new response structure, the UI needs to handle:

### 4.1 Redirect Responses

```typescript
// In chat message handler
if (response.routing?.should_redirect) {
  // Show brief message
  displayMessage(response.response.message);

  // Navigate to target agent
  setTimeout(() => {
    window.location.href = response.routing.target_url;
  }, 1500);
}
```

### 4.2 Actions Display (Optional Enhancement)

```typescript
// Show what the agent did
if (response.actions_performed?.length > 0) {
  displayActionsPerformed(response.actions_performed);
}

// Show pending items
if (response.actions_todo?.length > 0) {
  displayActionsTodo(response.actions_todo);
}
```

### 4.3 Preview Rendering

```typescript
// Render content previews
if (response.response.preview) {
  switch (response.response.preview.type) {
    case 'newsletter':
      renderNewsletterPreview(response.response.preview);
      break;
    case 'social_post':
      renderSocialPreview(response.response.preview);
      break;
    // ... more types
  }
}
```

---

## 5. Implementation Phases

### Phase 1: Foundation
- [ ] Create .md instruction files for PA and Newsletter
- [ ] Implement standardized response structure in N8N
- [ ] Update PA AI Agent system prompt with decision rules
- [ ] Update UI to handle redirect responses

### Phase 2: LLM Decision Logic
- [ ] Implement LLM-based routing (USE vs SETUP detection)
- [ ] Add agent list and descriptions to LLM context
- [ ] Configure session memory in N8N
- [ ] Test PA → Newsletter routing with various intents

### Phase 3: Enhanced Responses
- [ ] Add actions_performed to all agent responses
- [ ] Add actions_todo for pending items
- [ ] Implement preview objects for content types
- [ ] UI components for actions display (optional)

### Phase 4: Optimization
- [ ] Add caching layer for repeated exact queries
- [ ] Performance testing and tuning
- [ ] Error handling improvements
- [ ] Documentation

---

## 6. File Changes Summary

### N8N Workflows to Modify:
1. `FK_Personal_Assistant` - Update system prompt with decision rules, add instructions loading
2. `CRA_Newsletter_Multi` - Standardize response, add instructions loading

### Frontend Files to Modify:
1. `client/services/agentService.ts` - Handle redirect responses
2. `client/components/chat/ChatMessage.tsx` - Render actions, previews
3. `client/components/chat/InteractiveMessageButtons.tsx` - Already handles buttons

### New Files to Create:
1. `agents/prompts/personal_assistant_master.md` - Full PA instructions with decision rules
2. `agents/prompts/newsletter_multi_instructions.md` - Newsletter agent instructions
3. `agents/prompts/shared/response_format.md` - Common response format rules
4. `client/components/chat/ActionsDisplay.tsx` (optional)
5. `client/components/chat/ContentPreview.tsx` (optional)

---

## 7. Questions / Decisions Needed

1. **Preview Components**: Should we build preview components now or defer?
2. **Actions Display**: Visible to user or just for debugging?
3. **Context Passing**: When routing, how much context to pass to child agent?
4. **Error Handling**: Fallback behavior if routing target is unavailable?
5. **Agent Descriptions**: Where to store agent descriptions that LLM uses for routing decisions?

---

## Approval

- [ ] Architecture approved
- [ ] Response structure approved
- [ ] Implementation phases approved
- [ ] Ready to begin implementation
