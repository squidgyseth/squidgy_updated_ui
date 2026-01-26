# Agent Template Structure

**Version:** 1.0
**Based on:** Personal Assistant (Master Agent)
**Last Updated:** 2026-01-26

---

## Overview

This template defines the standard structure for all Squidgy agents. Following this structure ensures:
- Consistent behavior across all agents
- Token-efficient instruction loading
- Easy onboarding of new agents
- Maintainable codebase

---

## File Structure

```
knowledge_base/
├── shared/                           # Shared by ALL agents (loaded via RAG)
│   ├── security_rules.md             # ~60 tokens - Security constraints
│   ├── button_patterns.md            # ~50 tokens - UI button syntax
│   ├── response_format.md            # ~80 tokens - JSON response structure
│   ├── actions_format.md             # ~80 tokens - Actions tracking format
│   └── content_previews.md           # ~300 tokens - Preview formats (RAG-loaded)
│
├── templates/                        # Templates for creating new agents
│   ├── AGENT_TEMPLATE.md             # This file - structure documentation
│   ├── instructions.template.md      # Template for instructions.md
│   └── onboarding_flow.template.md   # Template for onboarding (PA-style agents only)
│
└── agents/
    └── {agent_id}/                   # Each agent has its own folder
        ├── instructions.md           # REQUIRED - Core behavior (~300-500 tokens)
        ├── custom_instructions.md    # OPTIONAL - User customizations
        ├── onboarding_flow.md        # OPTIONAL - For master/routing agents
        └── domain_knowledge.md       # OPTIONAL - For domain-expert agents
```

---

## Required Files

### 1. instructions.md (REQUIRED for all agents)

**Purpose:** Defines the agent's role, capabilities, and core behavior.

**Token Budget:** 300-500 tokens (keep it concise!)

**Structure:**
```markdown
# {Agent Name}

## ROLE
{One paragraph describing who this agent is and what it does}

## PRIMARY RESPONSIBILITIES
1. {responsibility_1}
2. {responsibility_2}
3. {responsibility_3}

## CAPABILITIES
{List what this agent can do}

## WORKFLOW
{Step-by-step process the agent follows}

## USER CONTEXT
{What user data the agent uses - references to config variables}

## OUTPUT FORMAT
{Expected output format - usually JSON reference}

## CRITICAL RULES
{Non-negotiable rules the agent must follow}
```

---

## Optional Files

### 2. custom_instructions.md (OPTIONAL)

**Purpose:** Agent-specific customizations, advanced features, edge cases.

**When to use:** When the agent has complex logic that doesn't fit in main instructions.

**Token Budget:** 200-400 tokens

### 3. onboarding_flow.md (OPTIONAL - PA-style agents only)

**Purpose:** Structured onboarding flow for agents that guide users through setup.

**When to use:** Only for master/routing agents like Personal Assistant.

**Token Budget:** 400-600 tokens

### 4. domain_knowledge.md (OPTIONAL - Domain-expert agents only)

**Purpose:** Industry-specific knowledge, terminology, regulations.

**When to use:** For agents that need domain expertise (Solar, Legal, Medical, etc.)

**Token Budget:** 300-500 tokens

---

## Variable References

All agents can reference these variables (injected by N8N Pre-Process):

### User Config (from vw_personal_assistant_config_llm)
| Variable | Description |
|----------|-------------|
| `{{ enabled_agents }}` | List of user's enabled agents |
| `{{ assistants }}` | All available assistants |
| `{{ values_not_enabled }}` | Agents not yet enabled |
| `{{ agent_department_value }}` | Agent name → ID mapping |
| `{{ website_analysis_info }}` | Company info from website analysis |
| `{{ brand_voices }}` | Brand voice options |
| `{{ target_audiences }}` | Target audience options |
| `{{ primary_goals }}` | Primary goal options |
| `{{ calendar_types }}` | Calendar connection options |
| `{{ notification_options }}` | Notification options |
| `{{ has_completed_onboarding }}` | Boolean - onboarding status |

### Request Context (from webhook)
| Variable | Description |
|----------|-------------|
| `{{ user_id }}` | User's UUID |
| `{{ session_id }}` | Current session ID |
| `{{ user_mssg }}` | User's message |
| `{{ agent_name }}` | Current agent ID |

---

## Token Budget Guidelines

| Agent Type | instructions.md | custom_instructions.md | domain_knowledge.md | Total |
|------------|-----------------|------------------------|---------------------|-------|
| Simple (Newsletter, Email) | 300 tokens | - | - | ~300 |
| Standard (SMM, Content) | 400 tokens | 200 tokens | - | ~600 |
| Complex (PA, Routing) | 400 tokens | - | 500 (onboarding) | ~900 |
| Domain Expert (Solar, Legal) | 400 tokens | 200 tokens | 400 tokens | ~1000 |

**Target:** Keep total agent-specific instructions under 1000 tokens.

---

## Shared Files (Auto-Loaded)

These are loaded automatically based on context:

| File | When Loaded | Tokens |
|------|-------------|--------|
| security_rules.md | ALWAYS (Tier 1) | ~60 |
| button_patterns.md | ALWAYS (Tier 2) | ~50 |
| response_format.md | Keywords: redirect, route, format, json | ~80 |
| actions_format.md | Keywords: done, completed, next, pending | ~80 |
| content_previews.md | Keywords: preview, draft, create, generate | ~300 |

---

## Loading Tiers

### Tier 1: Always Loaded
- `shared/security_rules.md`
- `agents/{agent_id}/instructions.md`
- `agents/{agent_id}/onboarding_flow.md` (if exists)

### Tier 2: RAG/Keyword Loaded
- `shared/button_patterns.md` (always included in Tier 2)
- `shared/response_format.md` (keyword match)
- `shared/content_previews.md` (keyword match)
- `shared/actions_format.md` (keyword match)
- `agents/{agent_id}/custom_instructions.md` (if exists)
- `agents/{agent_id}/domain_knowledge.md` (if exists)

---

## Creating a New Agent: Checklist

### Step 1: Classify the Agent
- [ ] User-Only Agent (no domain expertise needed)
- [ ] Domain Expert Agent (needs industry knowledge)
- [ ] Routing Agent (like PA, guides to other agents)

### Step 2: Create Files
- [ ] Create folder: `knowledge_base/agents/{agent_id}/`
- [ ] Create `instructions.md` using template
- [ ] Create `custom_instructions.md` if needed
- [ ] Create `domain_knowledge.md` if domain expert
- [ ] Create `onboarding_flow.md` if routing agent

### Step 3: Database Setup
- [ ] Add entry to `personal_assistant_config` table
- [ ] Set `config_type = 'assistants'`
- [ ] Set appropriate `category` (Marketing, Sales, Support, etc.)

### Step 4: N8N Setup
- [ ] Add files to `SA_Load_Instructions.json` file list
- [ ] Run `SA_Load_Instructions` workflow
- [ ] Test the agent

### Step 5: Frontend Setup
- [ ] Add to AgentMappingService (if needed)
- [ ] Add icon/emoji mapping
- [ ] Test navigation

---

## Example: Personal Assistant Structure

```
agents/personal_assistant/
├── instructions.md      # 300 tokens - Core behavior
│   ├── ROLE
│   ├── PRIMARY RESPONSIBILITIES
│   ├── INTENT DETECTION (USE vs SETUP)
│   ├── DECISION FLOW
│   ├── ROUTING FORMAT
│   ├── AVAILABLE AGENTS (references config)
│   ├── KB TOOLS
│   ├── TONE & BEHAVIOR
│   └── CRITICAL RULES
│
└── onboarding_flow.md   # 500 tokens - Structured onboarding
    ├── PHASE DETECTION
    ├── FLOW DECISION
    ├── FIRST TIME USER FLOW (Steps 1-7)
    ├── ADDITIONAL AGENT FLOW (shortened)
    ├── ENABLEMENT JSON FORMAT
    ├── URL DETECTION
    ├── SKIP HANDLING
    ├── CRITICAL RULES
    └── DATA REFERENCES
```

---

## Anti-Patterns (What NOT to do)

1. **DON'T** duplicate shared format info in agent instructions
2. **DON'T** exceed 500 tokens for instructions.md
3. **DON'T** include examples that aren't essential
4. **DON'T** reference tools that don't exist for this agent
5. **DON'T** hardcode user data - always use variables
6. **DON'T** include verbose explanations - be concise

---

## Quick Reference: instructions.md Sections

| Section | Required | Description |
|---------|----------|-------------|
| ROLE | ✅ Yes | One paragraph - who is this agent |
| PRIMARY RESPONSIBILITIES | ✅ Yes | 3-5 bullet points |
| CAPABILITIES | ✅ Yes | What the agent can do |
| WORKFLOW | ✅ Yes | Step-by-step process |
| USER CONTEXT | ✅ Yes | What config variables to use |
| OUTPUT FORMAT | ✅ Yes | Expected response format |
| CRITICAL RULES | ✅ Yes | Non-negotiable constraints |
| TOOLS | ⚪ Optional | If agent has special tools |
| EXAMPLES | ⚪ Optional | Only if essential, keep minimal |

---

## Next Steps

1. Use `instructions.template.md` to create new agent instructions
2. Follow the checklist above for each new agent
3. Run SA_Load_Instructions after adding files
4. Test thoroughly before deploying
