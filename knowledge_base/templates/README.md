# Agent Templates

This folder contains templates for creating new Squidgy agents.

## Quick Start

### 1. Determine Agent Type

| Type | Description | Files Needed |
|------|-------------|--------------|
| **User-Only** | Uses user's KB data, no domain expertise | `instructions.md` |
| **Domain Expert** | Needs industry knowledge (Solar, Legal, Medical) | `instructions.md` + `domain_knowledge.md` |
| **Routing Agent** | Guides users, routes to other agents (like PA) | `instructions.md` + `onboarding_flow.md` |

### 2. Copy Templates

```bash
# Create agent folder
mkdir knowledge_base/agents/{agent_id}

# Copy instructions template (REQUIRED)
cp knowledge_base/templates/instructions.template.md knowledge_base/agents/{agent_id}/instructions.md

# Copy domain knowledge (IF domain expert)
cp knowledge_base/templates/domain_knowledge.template.md knowledge_base/agents/{agent_id}/domain_knowledge.md

# Copy onboarding flow (IF routing agent)
cp knowledge_base/templates/onboarding_flow.template.md knowledge_base/agents/{agent_id}/onboarding_flow.md

# Copy custom instructions (IF needed)
cp knowledge_base/templates/custom_instructions.template.md knowledge_base/agents/{agent_id}/custom_instructions.md
```

### 3. Fill in Templates

1. Replace all `{PLACEHOLDERS}` with actual values
2. Delete sections marked `[DELETE IF NOT NEEDED]`
3. Remove HTML comments after filling
4. Run through token counter (aim for <500 tokens per file)

### 4. Register Agent

Add to database:
```sql
INSERT INTO personal_assistant_config
(code, display_name, description, emoji, category, config_type, is_enabled)
VALUES
('{agent_id}', '{Display Name}', '{Description}', '{emoji}', '{Category}', 'assistants', true);
```

### 5. Add to Load Instructions

Edit `n8n_workflows/SA_Load_Instructions.json`:
```javascript
{ agent_id: '{agent_id}', source_file: 'instructions.md', url: `${baseUrl}/agents/{agent_id}/instructions.md` },
// Add other files if applicable
```

### 6. Deploy

1. Commit and push changes to GitHub
2. Run `SA_Load_Instructions` workflow in N8N
3. Test the agent

---

## Template Files

| File | Purpose | Token Budget |
|------|---------|--------------|
| `AGENT_TEMPLATE.md` | Full documentation of structure | Reference only |
| `instructions.template.md` | Core agent behavior | 300-500 tokens |
| `onboarding_flow.template.md` | Multi-step user flows | 400-600 tokens |
| `domain_knowledge.template.md` | Industry expertise | 300-500 tokens |
| `custom_instructions.template.md` | Advanced features | 200-400 tokens |

---

## Token Budget Summary

| Agent Type | Max Total Tokens |
|------------|------------------|
| Simple (Newsletter, Email) | ~300 |
| Standard (SMM, Content) | ~600 |
| Routing (PA-style) | ~900 |
| Domain Expert (Solar, Legal) | ~1000 |

**Plus shared files loaded via RAG:** ~200-400 tokens

---

## Examples

### User-Only Agent: Newsletter Creator
```
agents/newsletter_multi/
├── instructions.md        # 400 tokens
└── custom_instructions.md # 200 tokens
Total: ~600 tokens
```

### Domain Expert Agent: SOL (Solar Sales)
```
agents/sol/
├── instructions.md        # 400 tokens
├── custom_instructions.md # 200 tokens
└── domain_knowledge.md    # 400 tokens
Total: ~1000 tokens
```

### Routing Agent: Personal Assistant
```
agents/personal_assistant/
├── instructions.md        # 300 tokens
└── onboarding_flow.md     # 500 tokens
Total: ~800 tokens
```

---

## Need Help?

- Check `AGENT_TEMPLATE.md` for detailed documentation
- Look at existing agents for examples
- Keep it concise - less is more!
