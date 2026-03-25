# Package & Deployment

Create complete agent packages with zip files for sharing with team members or deploying to other environments.

=======================================================================
## PACKAGE CONTENTS

**IMPORTANT: N8N workflows are created via tools, NOT as files!**

**Always Included:**
1. `config.yaml` - Agent configuration
2. `system_prompt.md` - Agent-specific instructions
3. `skills/` folder - Skill files (if Tier 2+ agents)
   - `skill_1.md`
   - `skill_2.md`
   - etc.

**Optional (Ask User):**
4. `README.md` - Deployment guide for sharing with others
   - **Ask:** "Would you like me to include a README.md deployment guide? This is helpful if you're sharing the agent with team members or deploying to other environments."
   - Only create if user says yes

**N8N Workflow:**
- Created via `POST /api/n8n/clone-workflow` endpoint
- User receives direct link to edit and activate in N8N
- No JSON file generation needed

=======================================================================
## WHEN TO CREATE README

**Ask user before creating README.md:**
- "Would you like me to include a README.md deployment guide?"
- "This is helpful if you're sharing the agent with team members or deploying to other environments."

**Create README if:**
- User wants to share agent with team members
- User is deploying to another environment
- User wants detailed deployment instructions
- User explicitly requests it

**Skip README if:**
- User only needs agent for personal use
- Agent is already published to database (no sharing needed)
- User says no or doesn't need it

=======================================================================
## DEPLOYMENT README TEMPLATE

**Only use this template if user wants README.md:**

```markdown
# [Agent Name] - Deployment Guide

Complete deployment package for the [Agent Name] AI agent.

=======================================================================
## QUICK START

1. **Extract Files**
   ```bash
   # Extract this zip to your agents directory
   unzip [agent_id]_agent_package.zip -d agents/[agent_id]/
   ```

2. **Build Agent**
   ```bash
   # Run the build script to compile and sync
   node scripts/build-agents.js
   ```

3. **Activate N8N Workflow**
   - The N8N workflow was created automatically during agent setup
   - Click the workflow link provided by the agent builder
   - Review the workflow nodes
   - Verify credentials are connected:
     - OpenRouter API (Claude)
     - Neon Postgres
     - Supabase (if used)
   - Click the **Activate** toggle in N8N

4. **Test Agent**
   ```bash
   # Start development server
   npm run dev
   ```
   - Navigate to agent in UI
   - Send test message
   - Verify response

=======================================================================
## CONFIGURATION

**Agent Details:**
- **Agent ID:** [agent_id]
- **Name:** [Agent Name | Title]
- **Category:** [CATEGORY]
- **Emoji:** [emoji]

**Webhook:**
- **URL:** https://n8n.theaiteam.uk/webhook/[agent_id]
- **Method:** POST
- **Response:** JSON

**Capabilities:**
[List all capabilities from config]

**Personality:**
- **Tone:** [tone]
- **Style:** [style]
- **Approach:** [approach]

=======================================================================
## FILE STRUCTURE

```
agents/[agent_id]/
├── config.yaml              # Agent configuration
├── system_prompt.md         # Agent instructions
├── README.md                # This file
└── skills/                  # Optional skills folder
    ├── skill_1.md
    └── skill_2.md
```

**Note:** N8N workflow is created via API and lives in your N8N instance, not as a file.

=======================================================================
## TROUBLESHOOTING

**Agent not appearing in UI:**
1. Check `agents` table in Supabase:
   ```sql
   SELECT agent_id, is_enabled FROM agents WHERE agent_id = '[agent_id]';
   ```
2. If not enabled, update:
   ```sql
   UPDATE agents SET is_enabled = true WHERE agent_id = '[agent_id]';
   ```
3. Enable in user settings (Onboarding page)

**N8N workflow not responding:**
1. Open the workflow link provided during agent creation
2. Verify workflow is activated in N8N (toggle switch should be ON)
3. Check webhook URL matches agent_id: `/webhook/[agent_id]`
4. Verify all credentials are connected (no warning icons)
5. Test webhook directly:
   ```bash
   curl -X POST https://n8n.theaiteam.uk/webhook/[agent_id] \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```
6. Check N8N execution logs for errors

**System prompt not loading:**
1. Verify build script ran successfully
2. Check Neon database:
   ```sql
   SELECT agent_id, LENGTH(system_prompt) 
   FROM agent_system_prompts 
   WHERE agent_id = '[agent_id]';
   ```
3. Re-run build script if missing

**Skills not working:**
1. Verify skills are in `skills/` folder
2. Check config.yaml has `skills` section
3. Re-run build script to upload skills to database

=======================================================================
## NEXT STEPS

**Optional Enhancements:**
1. **Custom Avatar** - Add avatar image to `/public/Squidgy AI Assistants Avatars/`
2. **Additional Skills** - Create more skill files in `skills/` folder
3. **Integration Setup** - Configure OAuth or API keys for external platforms
4. **Custom UI** - Add custom UI components if needed (Tier 4)

**Production Deployment:**
1. Test thoroughly in development
2. Update `enabled: true` in config.yaml
3. Deploy to production environment
4. Monitor initial usage and feedback
5. Iterate based on user needs

=======================================================================
## SUPPORT

**Documentation:**
- [Agent README](../README.md)
- [Agent Architecture](../../docs/AGENT_ARCHITECTURE_PLAN.md)
- [N8N Setup Guide](../../docs/n8n-agent-setup.md)

**Issues:**
- Check N8N execution logs
- Review Supabase database tables
- Test webhook connectivity
- Verify credentials are valid

=======================================================================

**Package Generated:** [timestamp]
**Platform Version:** Squidgy AI v2.0
```

=======================================================================
## ZIP FILE CREATION

**Before creating zip, ask user about README:**
- "Would you like me to include a README.md deployment guide in the zip file?"
- Only create README.md if user confirms

**Process:**
1. Create temporary directory structure
2. Copy all generated files to structure
3. Create README.md (only if user requested it)
4. Create zip archive
5. Clean up temporary files

**Naming Convention:**
- Format: `[agent_id]_agent_package_[timestamp].zip`
- Example: `email_marketing_agent_package_20260313.zip`

**Directory Structure in Zip:**
```
[agent_id]/
├── config.yaml
├── system_prompt.md
├── README.md (optional - only if user requested)
└── skills/
    ├── skill_1.md
    └── skill_2.md
```

**Note:** N8N workflow is not included in zip - it's created via workflow creation tool.

=======================================================================
## ZIP FILE DELIVERY

**Zip file is created locally and provided to user.**

**Naming Convention:**
- Format: `[agent_id]_agent_package_[timestamp].zip`
- Example: `email_marketing_agent_package_20260325.zip`

**File Location:**
- Save in project root or user-specified location
- Provide full file path to user

**What's included in zip:**
- config.yaml (always)
- system_prompt.md (always)
- skills/ folder (if agent has skills)
- README.md (only if user requested it)

=======================================================================
## USER DELIVERY MESSAGE

After creating zip file, provide this message to user:

```markdown
✅ **Agent Package Created: [Agent Name | Title]**

📦 **Zip File Location:** `[full_file_path]`

**What's Included:**
- Complete agent configuration (config.yaml)
- System prompt with [X] workflows
[- X skill files (if applicable)]
[- Deployment guide (README.md) - if user requested]

**Package Contents:**
- config.yaml
- system_prompt.md
[- skills/ folder with X skill files]
[- README.md deployment guide]

**Agent Details:**
- **ID:** [agent_id]
- **Category:** [CATEGORY]
- **Capabilities:** [count] specialized capabilities
- **Complexity:** Tier [X]

**Sharing Instructions:**
1. Share the zip file with team members
2. They extract to `agents/[agent_id]/` directory
3. Run `node scripts/build-agents.js` to sync to database
[4. Follow README.md instructions (if included)]

**Need Adjustments?**
Let me know if you'd like to modify any configuration, add more capabilities, or create additional skills!
```

=======================================================================
## VALIDATION CHECKLIST

Before creating package:
- ✅ All required files generated
- ✅ config.yaml is valid YAML
- ✅ system_prompt.md is complete
- ✅ N8N workflow created via workflow creation tool
- ✅ Workflow editor URL obtained and provided to user
- ✅ Asked user about README.md (don't create by default)
- ✅ README.md has correct agent_id references (if user requested it)
- ✅ Skills folder created (if needed)
- ✅ All files use UTF-8 encoding
- ✅ No placeholder values remain
- ✅ Directory structure is correct

After creating zip:
- ✅ Zip file created successfully
- ✅ File path provided to user
- ✅ File size is reasonable (<10MB)
- ✅ User message is formatted correctly
- ✅ README.md only included if user requested it
