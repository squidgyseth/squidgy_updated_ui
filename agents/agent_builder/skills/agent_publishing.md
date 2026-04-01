# Agent Publishing

Publish agent configuration, system prompt, and skills to database tables using API tools. Optionally create files for user records.

=======================================================================
## PUBLISHING OVERVIEW

**CRITICAL:** Publishing an agent means inserting/updating records in database tables using API endpoints. This is what makes the agent live and accessible.

**Two-Step Process:**
1. **Create Files (Recommended)** - Generate config.yaml, system_prompt.md, and skills as files for:
   - Full access to all created content before publishing
   - User records and version control
   - Easy review and modification
   - Backup reference

2. **Publish to Database (Required)** - Use available tools to send configuration to database:
   - Agent configuration publishing tool
   - System prompt publishing tool
   - Skills publishing tool

**The agent is PUBLISHED when configuration is successfully inserted into database tables.**

=======================================================================
## WHAT GETS PUBLISHED

Publishing involves sending three types of data using tools:

**1. Agent Configuration**
- Complete agent metadata (name, emoji, category, description, capabilities, etc.)
- Skills metadata (name, description, file references)
- UI configuration, personality, suggestions
- Tool: Agent configuration publishing tool

**2. System Prompt**
- Full system prompt text (agent-specific instructions)
- Tool: Database publishing tool (handles storage automatically)

**3. Skills Content**
- Individual skill files with full markdown content
- Tool: Database publishing tool (handles storage automatically)

=======================================================================
## PUBLISHING PROCESS

### STEP 1: Create Files (Recommended)

**Before publishing to database, create files for records and user reference.**

**1.1 Create config.yaml file:**
```
Tool: write_to_file
TargetFile: {workspace_root}/agents/{agent_id}/config.yaml
CodeContent: [Complete YAML content from Step 3]
```

**1.2 Create system_prompt.md file:**
```
Tool: write_to_file
TargetFile: {workspace_root}/agents/{agent_id}/system_prompt.md
CodeContent: [Complete system prompt content from Step 4]
```

**1.3 Create skill files (if needed):**
```
Tool: write_to_file
TargetFile: {workspace_root}/agents/{agent_id}/skills/{skill_name}.md
CodeContent: [Complete skill content from Step 5]
```

**Benefits of creating files first:**
- ✅ You have full access to review all content before publishing
- ✅ User receives files as records for version control
- ✅ Easy to modify if needed before database insert
- ✅ Backup reference if database sync fails

### STEP 2: Publish Agent Configuration

**Use the agent configuration publishing tool to publish the agent.**

**Tool:** Agent configuration publishing tool

**Configuration Structure:**
```json
{
  "agent_id": "social_media_manager",
  "name": "Social Media Manager | Content Expert",
  "emoji": "📱",
  "category": "MARKETING",
  "description": "AI agent that helps create and manage social media content",
  "specialization": "Social Media Strategy",
  "tagline": "Create. Schedule. Engage.",
  "avatar_url": "/Squidgy AI Assistants Avatars/15.png",
  "pinned": false,
  "enabled": true,
  "admin_only": false,
  "initial_message": "Hey! 👋 I'm your Social Media Manager...",
  "sidebar_greeting": "Hi! I help you create amazing social media content.",
  "capabilities": [
    "Content creation and scheduling",
    "Engagement analytics",
    "Multi-platform posting"
  ],
  "recent_actions": [
    "Created viral LinkedIn post for tech startup",
    "Scheduled 2-week content calendar for Instagram"
  ],
  "skills": [
    {
      "name": "Content Creation",
      "description": "Create engaging social media posts",
      "file": "content_creation.md"
    }
  ],
  "ui_config": {},
  "interface_config": {
    "type": "chat",
    "features": ["text_input", "file_upload"]
  },
  "suggestions": [
    "Create a post",
    "Schedule content",
    "Analyze engagement"
  ],
  "personality": {
    "tone": "creative",
    "style": "energetic",
    "approach": "collaborative"
  },
  "webhook_url": "https://n8n.theaiteam.uk/webhook/social_media_manager",
  "uses_conversation_state": false,
  "platforms": {},
  "domain_config": {}
}
```

**How to publish:**
- Use agent configuration publishing tool
- Provide complete agent configuration data
- Tool handles database insertion automatically

**Success Response:**
```json
{
  "success": true,
  "message": "Agent 'Social Media Manager' created successfully",
  "agent": { /* full agent record */ }
}
```

### STEP 3: Publish System Prompt

**Use database publishing tool to insert system prompt.**

**What to provide:**
- Agent ID
- Full system prompt text (agent-specific content from Step 4)

**Tool handles automatically:**
- Database insertion
- Combining with base system prompt if needed
- Updating existing prompts if agent already exists

**Note:** Use the available database publishing tool - it handles all storage details.

### STEP 4: Publish Skills

**Use database publishing tool to insert each skill.**

**For each skill, provide:**
- Agent ID
- Skill name
- Skill description (brief)
- Full skill content (markdown)

**Tool handles automatically:**
- Database insertion
- Updating existing skills if agent already exists
- Proper indexing and relationships

### STEP 5: Verify Publication

**Check that agent is successfully published:**

1. **Verify API response:**
   - Check for success: true in response
   - Confirm no error messages

2. **Verify agent availability:**
   - Agent should appear in UI agent list
   - Agent should be selectable
   - Webhook should be configured

3. **Ask user about zip file (optional):**
   - "Would you like me to create a zip file of all agent files for your records or sharing with others?"
   - If yes → Proceed to Step 6
   - If no → Skip to final confirmation message

### STEP 6: Create Zip File (Optional - User Choice)

**Only execute this step if user requests a zip file.**

**Why users might want a zip file:**
- Easy sharing with team members
- Backup for version control
- Offline record of agent configuration
- Deployment to other environments

**Zip file contents:**
- config.yaml
- system_prompt.md
- skills/ folder (if applicable)
- All skill .md files

**Zip file naming:**
- Format: `{agent_id}_agent_package_{timestamp}.zip`
- Example: `social_media_manager_agent_package_20260325.zip`

**After creating zip:**
- Provide download link or file path to user
- Include in final confirmation message

=======================================================================
## PUBLICATION CONFIRMATION MESSAGE

After successfully publishing to database, provide this message to the user:

```markdown
✅ **Agent Published: [Agent Name | Title]**

🎉 Your agent is now LIVE in the database and ready to use!

**Published to Database:**
- ✅ Agent configuration published successfully
- ✅ System prompt published successfully
[- ✅ {X} skills published successfully]

**Files Created for Your Records:**
- 📄 config.yaml → `agents/{agent_id}/config.yaml`
- 📄 system_prompt.md → `agents/{agent_id}/system_prompt.md`
[- 📄 {X} skill files → `agents/{agent_id}/skills/`]
[- 📦 Zip package → `{agent_id}_agent_package_{timestamp}.zip` (if requested)]

**N8N Workflow:**
🔗 **[Click here to activate your workflow]({workflow_editor_url})**

**Next Steps:**
1. **Activate N8N Workflow:**
   - Click the workflow link above
   - Review the workflow nodes
   - Verify credentials are connected (OpenRouter, Postgres, Supabase)
   - Click the **Activate** toggle in N8N

2. **Test Your Agent:**
   - Navigate to the Squidgy UI
   - Find your agent in the agent list
   - Send a test message
   - Verify the agent responds correctly

---

**Want to Start Using This Agent?**
Would you like me to activate this agent for you so you can start using it right away?

**Agent Details:**
- **ID:** {agent_id}
- **Category:** {CATEGORY}
- **Capabilities:** {count} specialized capabilities
- **Complexity:** Tier {X}
- **Status:** Published & Live ✅

**Files Location:**
All agent files are saved in `agents/{agent_id}/` for your records and version control.

**Need Adjustments?**
Let me know if you'd like to modify any configuration, add more capabilities, or create additional skills!
```

=======================================================================
## IMPORTANT NOTES

**1. Database Publishing is Required**
- Publishing means using tools to insert configuration into database
- Files alone do NOT publish the agent
- Agent is live only after successful tool execution
- Use agent configuration publishing tool
- Use system prompt and skills publishing tools

**2. File Creation is Recommended**
- Create files BEFORE publishing to database
- Files serve as records and backups
- User can review files before they go live
- Files enable version control and modifications
- Files can be shared with user for reference

**3. Publishing Order**
- Step 1: Create files (config, system_prompt, skills)
- Step 2: Publish agent config using publishing tool
- Step 3: Publish system prompt using publishing tool
- Step 4: Publish skills using publishing tool
- Step 5: Verify publication
- Step 6: Ask user if they want zip file (optional)
- Step 7: Create zip file if requested (optional)
- Final: Confirm to user with all details

**4. Tools Available**
- Agent configuration publishing tool
- System prompt publishing tool
- Skills publishing tool
- All tools handle database details automatically

**6. Validation Before Publishing**
- ✅ All required fields are present
- ✅ YAML syntax is valid
- ✅ No placeholders or TODOs remain
- ✅ Skills match config.yaml references
- ✅ Webhook URL is correct
- ✅ Agent ID is unique and valid

=======================================================================
## ERROR HANDLING

**Common Issues:**

**1. Agent ID already exists:**
- Error: `Agent with ID "xxx" already exists`
- Solution: Choose a different agent_id or update existing agent instead

**2. Missing required fields:**
- Error: `Missing required fields`
- Solution: Ensure all required fields are provided (agent_id, name, category, description, webhook_url)

**3. Publishing failure:**
- Error: `Failed to create agent` or similar
- Solution: Check error message, verify all data is valid, retry if needed

**4. Invalid category:**
- Error: Category validation failure
- Solution: Use valid categories: MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL

**5. File creation failure (optional step):**
- Error: "Cannot write file" or "Permission denied"
- Solution: This doesn't block publishing - files are for records only

=======================================================================
## VALIDATION CHECKLIST

Before publishing:
- ✅ Agent ID is valid snake_case format
- ✅ Agent ID is unique (not already published)
- ✅ All required fields are present (agent_id, name, category, description, webhook_url)
- ✅ Category is valid (MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL)
- ✅ Capabilities array has 3-5 items
- ✅ Skills metadata matches skill files created
- ✅ System prompt is complete and production-ready
- ✅ No placeholders or TODOs remain
- ✅ Webhook URL matches agent_id
- ✅ N8N workflow was created successfully

After publishing:
- ✅ Tool responses show success
- ✅ No error messages returned
- ✅ Agent appears in UI agent list
- ✅ Files created for user records (optional but recommended)
- ✅ N8N workflow URL provided to user
- ✅ User has clear activation and testing steps

=======================================================================
## WORKFLOW INTEGRATION

**Remember:** N8N workflow is created in Step 6, BEFORE publishing.

**Complete workflow order:**
1. Step 1-5: Gather info, infer requirements, create config, system prompt, skills
2. Step 6: Create N8N workflow via API → Get workflow URL and workflow_id
3. Step 7: Publish Agent:
   - 7.1: Create files (config.yaml, system_prompt.md, skills/*.md)
   - 7.2: Publish agent config to database via API
   - 7.3: Publish system prompt to database
   - 7.4: Publish skills to database
   - 7.5: Verify and confirm to user

**The workflow URL must be included in the final message to the user.**

=======================================================================
## SAVE TO KNOWLEDGE BASE

After successful publication, save these details to KB:

**Agent Publication Record:**
- Agent ID: {agent_id}
- Agent Name: {agent_name}
- Publication Date: {timestamp}
- Publication Method: API and database tools
- Published Components:
  - Agent configuration
  - System prompt
  - Skills (if applicable)
- Files Created (for records):
  - config.yaml location
  - system_prompt.md location
  - skills/ folder location (if applicable)
  - List of skill files (if applicable)
- N8N Workflow URL: {workflow_editor_url}
- N8N Workflow ID: {workflow_id}
- Status: PUBLISHED ✅
- Next Steps: Activate N8N workflow, test agent in UI

This record allows you to reference the agent in future conversations.

=======================================================================
## ZIP FILE CREATION (OPTIONAL)

**Always ask the user if they want a zip file after publishing.**

**When to create a zip file:**
- User wants to share agent with team members
- User wants offline backup for records
- User wants to deploy agent to another environment
- User wants easy version control package

**When to skip zip file:**
- User only needs agent live in current system
- Files in agents folder are sufficient
- User doesn't need to share or backup

**Zip file structure:**
```
{agent_id}_agent_package_{timestamp}.zip
├── config.yaml
├── system_prompt.md
└── skills/
    ├── skill_1.md
    └── skill_2.md
```

**Best Practice:** Always ask user - don't assume they want or don't want a zip file.

=======================================================================
## ALTERNATIVE: Publish Without Creating Files

**You CAN publish directly to database without creating files first, but it's NOT recommended.**

**Why create files first:**
- You have full visibility into what you're publishing
- User gets files as records and backups
- Easier to debug if something goes wrong
- Enables version control and future modifications
- Enables zip file creation if user wants it

**When to skip file creation:**
- User explicitly requests no files
- Quick testing or prototyping
- Agent will be modified immediately after creation

**If publishing without files:**
1. Prepare all configuration data in memory
2. Use publishing tool for configuration
3. Use publishing tool for system prompt
4. Use publishing tool for skills
5. Verify publication
6. Inform user that no files were created (zip file not possible)

**Best Practice:** Always create files first, then publish using tools.
