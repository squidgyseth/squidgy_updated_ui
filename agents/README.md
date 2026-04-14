# Squidgy AI Agents

This directory contains all AI agent configurations for the Squidgy platform. Each agent is a specialized AI assistant designed for specific business tasks.

---

## 📁 Agent Folder Structure

Each agent **MUST** have its own folder with the following structure:

```
agents/
├── shared/                          # Shared resources for all agents
│   ├── base_system_prompt.md        # Base prompt automatically added to ALL agents
│   ├── agent_template.yaml          # Template for creating new agents
│   └── skills/                       # Shared skills for all agents
│       └── shared_skill.md          # Reusable skill documentation
│
├── your_agent_id/                   # Individual agent folder
│   ├── config.yaml                  # Agent configuration (REQUIRED)
│   ├── system_prompt.md             # Agent-specific instructions (REQUIRED)
│   └── skills/                       # Agent-specific skills
│       ├── skill_name.md           # Skill documentation files
│       └── another_skill.md
│
└── another_agent/
    ├── config.yaml
    ├── system_prompt.md
    └── skills/
        └── agent_skill.md
```

**Note:** Agents can also be created dynamically via the `agent_builder` tool. These agents are automatically backed up to the filesystem by the build script.

---

## 🔧 Creating a New Agent

### Recommended: Use the Python Script

The easiest way to create agents is with the Python agent management script:

```bash
python scripts/create-agent-from-template.py
```

**⚠️ Prerequisites:**
- Add N8N API token to `.env` file:
  ```
  N8N_API_KEY=your_n8n_api_token_here
  ```
- Install required Python packages (see `scripts/requirements.txt`)

**Features:**
- ✅ Interactive wizard for agent creation and editing
- ✅ Generates all required files automatically
- ✅ Creates proper folder structure
- ✅ Optionally generates N8N workflows
- ✅ Handles all YAML formatting and validation
- ✅ Supports editing existing agents
- ✅ Deploys workflows to N8N via API

**Usage:**
```bash
# Create new agent
python scripts/create-agent-from-template.py

# Edit existing agent
python scripts/create-agent-from-template.py --edit
```

See **[Agent Creation Scripts](../scripts/README.md)** for detailed usage and configuration.

### Manual Creation (Not Recommended)

⚠️ **Manual creation is discouraged** - use the Python script above for consistency and automatic workflow generation.

If you must create agents manually:

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
# Metadata (automatically managed by build script)
updated_at: null  # ISO 8601 timestamp, automatically updated when agent is modified

agent:
  id: your_agent_id                    # Unique identifier (snake_case)
  name: "Name | Agent Title"           # Display name
  category: MARKETING                  # MARKETING, SALES, GENERAL, HR, SUPPORT, OPERATIONS, ADMIN
  description: "What this agent does"  # Brief description
  avatar: "/path/to/avatar.png"        # Avatar image path
  enabled: true                        # Platform-level enable/disable
  
# Skills that this agent uses (optional)
skills:
  - name: Skill Name                   # Display name of the skill
    description: >
      Brief description of when this skill is used.
      Keep it concise and action-oriented.
    file: skill_file.md                # Path to skill file in skills/ folder
  
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

Run the build process to sync agents to database:

```bash
node scripts/build-agents.js
```

This will:
- ✅ Parse all agent YAML configs from `agents/` folder
- ✅ Sync metadata (add missing `updated_at` fields silently)
- ✅ Sync agent_builder-created agents from database to filesystem
- ✅ Upload all agents to Supabase `agents` table (sets `last_modified_by = 'admin'`)
- ✅ Update system prompts with skills tables
- ✅ Upload skills to Neon database
- ✅ Combine `base_system_prompt.md` + `system_prompt.md`
- ✅ Upload compiled prompts to Neon database

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

### 1. Agent Creation Methods

**Manual Creation:**
- Create folder in `agents/` directory
- Add `config.yaml` and `system_prompt.md`
- Run build script to sync to database
- `last_modified_by = 'admin'` in database

**Agent Builder Creation:**
- Created dynamically via `agent_builder` tool
- Stored directly in database
- `last_modified_by = 'agent_builder'` in database
- Build script automatically backs up to filesystem
- After backup, `last_modified_by` changes to `'admin'`

### 2. Build Script Sync Flow

```
1. Parse agents from agents/ folder
2. Sync metadata (add missing updated_at fields)
3. Sync agent_builder agents:
   - NEW agents (not in folder) → Backup to filesystem
   - EXISTING agents (in folder) → Update if DB is newer
4. Re-scan agents/ folder (includes newly backed up agents)
5. Upload ALL agents to database (last_modified_by = 'admin')
6. Sync skills and system prompts to Neon
```

### 3. Platform-Level Control (`agents` table)

Agents must be enabled in the `agents` table with `is_enabled = true` to be available platform-wide.

```sql
SELECT agent_id, name, is_enabled, last_modified_by, updated_at
FROM agents 
WHERE is_enabled = true;
```

### 4. User-Level Control (`assistant_personalizations` table)

Users must enable agents individually through onboarding:

```sql
SELECT assistant_id, is_enabled 
FROM assistant_personalizations 
WHERE user_id = 'user_id' AND is_enabled = true;
```

### 5. Display Logic

Agents appear in the UI only if **BOTH** conditions are met:
- ✅ Platform-enabled (`agents.is_enabled = true`)
- ✅ User-enabled (`assistant_personalizations.is_enabled = true`)

**Exception:** `personal_assistant` is always shown (hardcoded in frontend).

---

## 🎯 Skills System

### What are Skills?

Skills are reusable best-practice documents that contain detailed instructions for specific tasks. Each agent can have multiple skills that define how to perform different aspects of their work.

### Skills Structure

```yaml
skills:
  - name: Post Creation Workflow
    description: >
      Creating, scheduling, or publishing any post or story.
      The primary orchestration skill — consult first.
    file: post_creation_workflow.md
  
  - name: Caption & Copywriting
    description: >
      Writing captions, hooks, CTAs, headlines, carousel slide copy,
      or any text on/alongside a post.
    file: caption_copywriting.md
```

### Skill Files

Each skill has a corresponding markdown file in the agent's `skills/` folder:

```
agents/social_media/skills/
├── post_creation_workflow.md
├── caption_copywriting.md
├── template_image_generation.md
└── content_strategy_design.md
```

**Skill file structure:**
```markdown
# Skill Name

Brief description of what this skill covers.

=======================================================================
## SECTION NAME

Detailed instructions and best practices...
```

### Skills in System Prompts

During build, skills are automatically injected into the agent's system prompt as a table:

```markdown
=======================================================================
## SKILLS

The agent has skills containing best practices for each area of responsibility. Before executing a task, consult the relevant skill file and follow its instructions. Multiple skills may apply to a single task.

| Skill_name | Use When |
|-------|----------|
| Post Creation Workflow | Creating, scheduling, or publishing any post or story. The primary orchestration skill — consult first. |
| Caption & Copywriting | Writing captions, hooks, CTAs, headlines, carousel slide copy, or any text on/alongside a post. |
```

### Skills Database Storage

Skills are also stored in the `agent_skills` table in Neon database:

```sql
CREATE TABLE agent_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_name TEXT NOT NULL,
  brief TEXT NOT NULL,
  skill_content TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Shared Skills

Skills can be shared across multiple agents by placing them in `agents/shared/skills/` and referencing them from multiple agent configs.

### Skills Narration

Agents must narrate when consulting skills (per base system prompt):
- "Let me review my best practices for this..."
- "Checking my workflow guide..."
- "Loading my design strategy notes..."

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
| `admin` | Admin | Platform Assistant | ADMIN | ⚠️ |
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
   node scripts/build-agents.js
   ```

### System prompt not updating?

The system prompt is compiled during build. After editing `system_prompt.md`:

```bash
node scripts/build-agents.js
```

This syncs the updated prompt to Neon database.

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

## 🗄️ Database Schema

### Agents Table

The `agents` table stores complete agent configurations:

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  agent_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  -- ... other fields ...
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),  -- Auto-updated by trigger
  last_modified_by TEXT DEFAULT 'admin' -- 'admin' or 'agent_builder'
);
```

**Key Fields:**
- `updated_at` - Automatically updated on every change (trigger)
- `last_modified_by` - Tracks who last modified the agent:
  - `'admin'` - Manual changes or build script uploads
  - `'agent_builder'` - Modified by agent_builder tool

### Metadata Sync

The `updated_at` field in `config.yaml` is synced with the database:
- Build script adds missing `updated_at` fields from database
- Used to compare timestamps and detect newer versions
- Ensures consistency across different systems

---

**Last Updated:** 2026-03-24
