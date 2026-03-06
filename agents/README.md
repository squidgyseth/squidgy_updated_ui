# Squidgy AI Agents

This directory contains all AI agent configurations for the Squidgy platform. Each agent is a specialized AI assistant designed for specific business tasks.

---

## 📁 Agent Folder Structure

Each agent **MUST** have its own folder with the following structure:

```
agents/
├── shared/                          # Shared resources for all agents
│   ├── base_system_prompt.md        # Base prompt automatically added to ALL agents
│   └── agent_template.yaml          # Template for creating new agents
│
├── your_agent_id/                   # Individual agent folder
│   ├── config.yaml                  # Agent configuration (REQUIRED)
│   └── system_prompt.md             # Agent-specific instructions (REQUIRED)
│
└── another_agent/
    ├── config.yaml
    └── system_prompt.md
```

---

## 🔧 Creating a New Agent

### Recommended: Use the Python Script

The easiest way to create agents is with the Python agent management script:

```bash
python scripts/create-agent-from-template.py
```

This script:
- ✅ Guides you through interactive prompts
- ✅ Generates all required files automatically
- ✅ Creates proper folder structure
- ✅ Optionally generates N8N workflows
- ✅ Handles all YAML formatting and validation
- ✅ Supports editing existing agents

See **[Agent Creation Scripts](../scripts/README.md)** for detailed usage.

### Manual Creation (Advanced)

If you prefer to create agents manually:

#### Step 1: Create Agent Folder

Create a new folder with your agent's ID (use snake_case):

```bash
mkdir agents/your_agent_id
```

#### Step 2: Create `config.yaml`

Copy the template and customize:

```bash
cp agents/shared/agent_template.yaml agents/your_agent_id/config.yaml
```

**Required fields in `config.yaml`:**

```yaml
agent:
  id: your_agent_id                    # Unique identifier (snake_case)
  name: "Name | Agent Title"           # Display name
  category: MARKETING                  # MARKETING, SALES, GENERAL, HR, SUPPORT, OPERATIONS, ADMIN
  description: "What this agent does"  # Brief description
  avatar: "/path/to/avatar.png"        # Avatar image path
  enabled: true                        # Platform-level enable/disable
  
n8n:
  webhook_url: https://n8n.theaiteam.uk/webhook/your_agent_id

personality:
  tone: professional                   # professional, friendly, casual, formal
  style: helpful                       # helpful, direct, consultative
  approach: proactive                  # proactive, reactive, collaborative
```

#### Step 3: Create `system_prompt.md`

Create agent-specific instructions:

```bash
touch agents/your_agent_id/system_prompt.md
```

**⚠️ IMPORTANT: Avoid Duplication**

The `base_system_prompt.md` is **automatically prepended** to every agent's system prompt during the build process. 

**DO NOT duplicate these in your agent's `system_prompt.md`:**
- Core principles (KB FIRST, SILENT EXECUTION, etc.)
- Response format rules
- Security guidelines
- General tone and behavior rules
- Error handling patterns

**Your `system_prompt.md` should ONLY contain:**
- Agent-specific tasks and responsibilities
- Unique workflows and processes
- Specialized tool usage instructions
- Domain-specific knowledge
- Agent-specific routing rules

**Example structure:**

```markdown
# Your Agent Name

Brief description of what this agent does.

=======================================================================
## PRIMARY RESPONSIBILITIES

1. **Task 1** - Specific responsibility
2. **Task 2** - Another responsibility

=======================================================================
## WORKFLOWS

### Workflow Name
1. Step 1
2. Step 2
3. Step 3

=======================================================================
## TOOL USAGE

Specific instructions for using tools unique to this agent.

=======================================================================
## ROUTING RULES

When to route to other agents or escalate.
```

#### Step 4: Build and Deploy

Run the build process to compile agents and sync to database:

```bash
# Use the build process for your platform
[build command for your system]
```

This will:
- ✅ Compile all YAML configs
- ✅ Sync agents to database
- ✅ Combine `base_system_prompt.md` + `system_prompt.md`
- ✅ Upload compiled prompts

#### Step 5: Restart Dev Server

```bash
npm run dev
```

---

## 📊 Agent Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **MARKETING** | Brand, content, social media | Brandy, Social Media Manager |
| **SALES** | Lead generation, quotes | Solar Sales Agent |
| **GENERAL** | Multi-purpose, onboarding | Personal Assistant |
| **HR** | Recruitment, employee management | HR Assistant |
| **SUPPORT** | Customer service, help desk | Support Agent |
| **OPERATIONS** | Project management, workflows | Project Architect |
| **ADMIN** | System administration, debugging | Admin tools (restricted) |

---

## 🔄 Agent Lifecycle

### 1. Platform-Level Control (`agents` table)

Agents must be enabled in the `agents` table with `is_enabled = true` to be available platform-wide.

```sql
SELECT agent_id, name, is_enabled 
FROM agents 
WHERE is_enabled = true;
```

### 2. User-Level Control (`assistant_personalizations` table)

Users must enable agents individually through onboarding:

```sql
SELECT assistant_id, is_enabled 
FROM assistant_personalizations 
WHERE user_id = 'user_id' AND is_enabled = true;
```

### 3. Display Logic

Agents appear in the UI only if **BOTH** conditions are met:
- ✅ Platform-enabled (`agents.is_enabled = true`)
- ✅ User-enabled (`assistant_personalizations.is_enabled = true`)

**Exception:** `personal_assistant` is always shown (hardcoded in frontend).

---

## 🧠 System Prompt Compilation

During build, the final system prompt is created as:

```
base_system_prompt.md
---
your_agent_id/system_prompt.md
```

**Example:**

```markdown
# Base System Prompt
[Core principles, response format, security rules...]

---

# Your Agent Name
[Agent-specific instructions...]
```

This compiled prompt is stored in the `agent_system_prompts` table in Neon database.

---

## 🔍 Available Agents

Current agents in the system:

| Agent ID | Name | Category | Status |
|----------|------|----------|--------|
| `personal_assistant` | Pia \| Personal Assistant | GENERAL | Always enabled |
| `social_media` | Sophia \| Social Media Superhero | MARKETING | ✅ |
| `brandy` | Brandy \| Brand Advisor | MARKETING | ✅ |
| `agent_builder` | Ace \| Agent Creation Expert | ADMIN | ✅ |
| `project_architect` | Project Architect | OPERATIONS | ✅ |
| `content_repurposer` | Rita \| Repurposing Maestro | MARKETING | ⚠️ |
| `newsletter_multi` | Nina \| Newsletter Specialist | MARKETING | ⚠️ |
| `social_media_scheduler` | Social Media Scheduler | MARKETING | ⚠️ |
| `SOL` | Stella \| Solar Sales Specialist | SALES | ⚠️ |

---

## 🛠️ Troubleshooting

### Agent not appearing in production?

1. **Check platform-level enablement:**
   ```sql
   SELECT agent_id, is_enabled FROM agents WHERE agent_id = 'your_agent_id';
   ```
   If `is_enabled = false`, update it:
   ```sql
   UPDATE agents SET is_enabled = true WHERE agent_id = 'your_agent_id';
   ```

2. **Check user-level enablement:**
   ```sql
   SELECT assistant_id, is_enabled 
   FROM assistant_personalizations 
   WHERE user_id = 'your_user_id' AND assistant_id = 'your_agent_id';
   ```

3. **Rebuild agents:**
   ```bash
   [build command for your system]
   ```

### System prompt not updating?

The system prompt is compiled during build. After editing `system_prompt.md`:

```bash
[build command for your system]
```

This syncs the updated prompt to database.

### Agent showing duplicate content?

Check if you're duplicating base prompt rules in your `system_prompt.md`. Remove any content that's already in `base_system_prompt.md`.

---

## 📚 Related Documentation

- **[Agent Creation Scripts](../scripts/README.md)** - Python script for agent creation and management
- **[Agent Template](./shared/agent_template.yaml)** - YAML configuration template
- **[Base System Prompt](./shared/base_system_prompt.md)** - Shared prompt for all agents
- **[N8N Template-Based Agent Creation](../docs/n8n-template-based-agent-creation.md)** - Workflow integration guide
- **[Agent Architecture](../docs/AGENT_ARCHITECTURE_PLAN.md)** - System architecture overview
- **[Agent Folder Structure](../docs/agent-folder-structure.md)** - Detailed file organization

---

**Last Updated:** 2026-03-06
