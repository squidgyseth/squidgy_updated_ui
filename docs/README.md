# Squidgy Documentation

Developer documentation for building and maintaining the Squidgy platform.

---

## Operational Guides (How-To)

These are step-by-step guides for common development tasks:

- **[N8N Template-Based Agent Creation](./n8n-template-based-agent-creation.md)** ⭐ ESSENTIAL
  - Complete guide for creating and editing agents with Python script
  - Interactive wizard for agent configuration
  - N8N workflow generation (optional)
  - Agent editing and lifecycle management

- **[N8N Agent Workflow Overview](./n8n-agent-setup.md)**
  - High-level overview of automated N8N workflow generation
  - Post-generation requirements and limitations
  - What not to do with generated workflows

- **[N8N Conversation State Overview](./n8n-conversation-state-integration.md)**
  - How conversation state works in multi-turn agents
  - Automatic configuration by Python script
  - Database storage and persistence

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

- **[Agent Folder Structure](./agent-folder-structure.md)**
  - Detailed file organization and structure

---

## File Organization

```
docs/
├── README.md                           # This file - documentation index
├── n8n-template-based-agent-creation.md # Agent creation with Python script
├── n8n-agent-setup.md                  # N8N workflow overview
├── AGENT_ARCHITECTURE_PLAN.md          # Agent architecture overview
├── n8n-conversation-state-integration.md  # Conversation state overview
└── agent-folder-structure.md           # File organization details

agents/
└── README.md                           # AI Agents creation and management guide

scripts/
└── README.md                           # Python scripts for agent management
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

**Last Updated**: 2026-03-06
