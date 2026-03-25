# Agent Creation Workflow

Complete step-by-step workflow for creating agents with N8N integration via API.

=======================================================================
## OVERVIEW

**CRITICAL: N8N workflows are created via API, not as files!**

This workflow ensures every agent is created with:
1. Complete configuration (config.yaml)
2. Comprehensive system prompt (system_prompt.md)
3. **Live N8N workflow via workflow creation tool**
4. Optional skills (for Tier 2+ agents)
5. Deployment package for user

=======================================================================
## STEP-BY-STEP WORKFLOW

### Step 1: Gather Requirements
- Agent name and purpose
- Category detection (MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL)
- Capabilities extraction (3-5 specific capabilities)
- Personality traits (tone, style, approach)
- UI customization (emoji, tagline, etc.)

**Skill Reference:** `intelligent_inference.md`

### Step 2: Generate Configuration
- Create complete config.yaml with all required fields
- Include webhook URL: `https://n8n.theaiteam.uk/webhook/{agent_id}`
- Add interface features based on capabilities
- Generate suggestion buttons
- Set personality traits

**Skill Reference:** `config_generation.md`

### Step 3: Generate System Prompt
- Create agent-specific system_prompt.md
- Include PRIMARY RESPONSIBILITIES (4-6 items)
- Define WORKFLOWS (2-4 workflows)
- Specify TOOL USAGE
- Set COMMUNICATION STYLE
- Add KEY RULES (5-7 rules)

**Skill Reference:** `system_prompt_generation.md`

### Step 4: Create N8N Workflow ⭐
**THIS IS THE CRITICAL STEP - DO NOT SKIP!**

Use the N8N workflow creation tool to create the workflow:

**Tool Parameters:**
```json
{
  "agent_id": "agent_id",
  "agent_name": "Agent Name",
  "activate": false
}
```

**Expected Tool Response:**
```json
{
  "success": true,
  "workflow_id": "abc123xyz",
  "workflow_name": "Squidgy_Agent_Name_Workflow",
  "editor_url": "https://n8n.theaiteam.uk/workflow/abc123xyz",
  "message": "Workflow created successfully",
  "warnings": []
}
```

**Skill Reference:** `n8n_workflow_generation.md`

### Step 5: Generate Optional Skills
For Tier 2+ agents, create skill files in `skills/` folder:
- Domain-specific knowledge
- Best practices
- Tool usage guides
- Workflow templates

**Skill Reference:** `skills_generation.md`

### Step 6: Create Deployment Package
- Generate README.md with deployment instructions
- Create zip file with all agent files (config, prompt, skills)
- **DO NOT include n8n_workflow.json file**
- Upload zip to Supabase storage
- Get public download URL

**Skill Reference:** `package_deployment.md`

### Step 7: Present to User
Provide complete summary with:
- Agent details and capabilities
- Download link for deployment package
- **🔗 Clickable N8N workflow editor URL**
- Clear activation instructions

=======================================================================
## USER DELIVERY MESSAGE TEMPLATE

```markdown
✅ **Agent Created Successfully: {agent_name}**

**📦 Download Package:** [Download Link]

**🔗 N8N Workflow:** [Click here to open and activate your workflow]({workflow_editor_url})

---

## What's Included
- Complete agent configuration (config.yaml)
- System prompt with {workflow_count} workflows
- {skill_count} skill files
- Deployment guide

## Quick Start

### 1. Download & Extract
Download the package above and extract to `agents/{agent_id}/`

### 2. Build Agent
```bash
node scripts/build-agents.js
```

### 3. Activate N8N Workflow ⭐
**IMPORTANT:** Click the N8N workflow link above and:
1. Review the workflow nodes
2. Verify credentials are connected:
   - ✅ OpenRouter API (Claude)
   - ✅ Neon Postgres
   - ✅ Supabase
3. Click the **Activate** toggle (top right)
4. Test the workflow

### 4. Test Your Agent
Start your dev server and test the agent in the UI!

---

## Agent Details
- **ID:** {agent_id}
- **Category:** {category}
- **Capabilities:** {capability_count}
- **Complexity:** Tier {tier}

## Need Help?
- Workflow not responding? Check it's activated in N8N
- Credentials showing warnings? Reconnect them in the workflow editor
- Agent not appearing? Run the build script again

**Need adjustments?** Let me know if you'd like to modify capabilities or add features!
```

=======================================================================
## ERROR HANDLING

### N8N Workflow Tool Fails
1. Log the error details
2. Retry once
3. If still fails, inform user:
   ```
   ⚠️ Unable to create N8N workflow automatically.
   
   Please create it manually:
   1. Go to N8N: https://n8n.theaiteam.uk
   2. Import the template workflow
   3. Replace <<agent_id>> with: {agent_id}
   4. Activate the workflow
   ```

### Package Upload Fails
1. Save zip file locally
2. Provide local file path to user
3. Log error for debugging

### Build Script Fails
1. Check file permissions
2. Verify directory structure
3. Provide manual deployment instructions

=======================================================================
## VALIDATION CHECKLIST

Before presenting to user:
- ✅ config.yaml is valid and complete
- ✅ system_prompt.md is comprehensive
- ✅ **N8N workflow created via API (not as file)**
- ✅ **Workflow editor URL obtained and tested**
- ✅ Skills generated (if Tier 2+)
- ✅ Deployment package created
- ✅ Package uploaded to Supabase
- ✅ Download link is accessible
- ✅ **N8N workflow link is clickable and prominent**
- ✅ User instructions are clear and actionable

=======================================================================
## TIER COMPLEXITY GUIDE

**Tier 1 - Basic Chat**
- Standard 4-node workflow (Webhook → Load Prompt → AI Agent → Response)
- No additional skills needed
- Simple config.yaml

**Tier 2 - Platform Integrated**
- Standard workflow + platform integrations
- 2-3 skill files for integrations
- Enhanced config with file_upload feature

**Tier 3 - Domain Expert**
- Custom workflow nodes for specialized tasks
- 4-6 skill files with domain knowledge
- Advanced tool usage instructions

**Tier 4 - Multi-Modal**
- Complex workflow with routing and state management
- 6+ skill files
- Custom UI components
- Advanced conversation state handling

=======================================================================
## IMPORTANT REMINDERS

1. **ALWAYS create N8N workflow using workflow creation tool**
2. **NEVER generate n8n_workflow.json files**
3. **ALWAYS provide clickable workflow editor URL to user**
4. **ALWAYS instruct user to activate workflow manually**
5. **ALWAYS verify API response before proceeding**
6. **ALWAYS include workflow link in final delivery message**
7. **NEVER skip the N8N workflow creation step**

=======================================================================
## AUTOMATION SERVICE URL

Get the backend URL from **N8N Workflow Creation:**
- Use the N8N workflow creation tool
- Tool handles all backend communication
- No need to know endpoint details
