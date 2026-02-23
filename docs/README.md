# Squidgy Documentation

Developer documentation for building and maintaining the Squidgy platform.

---

## Operational Guides (How-To)

These are step-by-step guides for common development tasks:

- **[N8N Agent Workflow Setup](./n8n-agent-setup.md)** ⭐ NEW
  - Complete guide for configuring N8N workflows for agents
  - Node configuration and common mistakes
  - Testing and troubleshooting

---

## Architecture Documentation

- **[AI Agents Guide](../agents/README.md)** ⭐ ESSENTIAL
  - Complete guide for creating and managing AI agents
  - Agent folder structure and configuration
  - System prompt compilation and best practices
  - Platform and user-level enablement logic

- **[Agent Architecture Plan](./AGENT_ARCHITECTURE_PLAN.md)**
  - Overview of how agents work in Squidgy

- **[N8N Conversation State Integration](./n8n-conversation-state-integration.md)**
  - How conversation state is managed in N8N workflows

---

## File Organization

```
docs/
├── README.md                           # This file - documentation index
├── n8n-agent-setup.md                  # N8N workflow setup guide
├── AGENT_ARCHITECTURE_PLAN.md          # Agent architecture overview
└── n8n-conversation-state-integration.md  # Conversation state guide

agents/
└── README.md                           # AI Agents creation and management guide
```

---

## Contributing Documentation

When you learn something new about Squidgy's internals, document it!

### Format

Use Markdown (`.md`) files with:
- Clear headings
- Code examples
- Troubleshooting sections
- "Last Updated" date

### Naming Convention

- Operational guides: `topic-name-guide.md` or `topic-name-setup.md`
- Architecture docs: `TOPIC_NAME.md` (all caps)
- Reference docs: `topic-reference.md`

---

## For AI Assistants

These docs are automatically loaded into Claude's context when:
- You're working in the `/docs/` directory
- You're asked about agent setup, N8N configuration, or architecture
- You encounter errors related to documented topics

**How to use**:
```
Check the N8N agent setup guide for the correct webhook configuration
```

---

**Last Updated**: 2026-02-23
