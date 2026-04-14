# N8N Workflow Generation

Create N8N workflows using the N8N workflow creation tool that clones and deploys workflows directly to N8N.

=======================================================================
## WORKFLOW CREATION PROCESS

**CRITICAL: Use the workflow creation tool, NOT file generation!**

Instead of generating JSON files, use the N8N workflow creation tool:
- **Tool:** N8N workflow creation tool
- Provide agent_id and agent_name
- Tool handles all backend communication automatically

Every N8N workflow automatically includes:
1. **Webhook Trigger** - Entry point for agent requests at `/webhook/{agent_id}`
2. **System Prompt Loader** - Fetches agent's system prompt from database
3. **AI Agent Node** - Main conversation handler with Claude
4. **Response Formatter** - Structures output for frontend
5. **Credential Mapping** - Automatically remaps credentials to your instance

=======================================================================
## TOOL USAGE FORMAT

Use the N8N workflow creation tool with these parameters:

```json
{
  "agent_id": "social_media_manager",
  "agent_name": "Social Media Manager",
  "activate": false
}
```

**Required Parameters:**
- `agent_id` (string) - Snake_case agent identifier
- `agent_name` (string) - Human-readable agent name
- `activate` (boolean) - Whether to activate workflow immediately (default: false)

**Optional Parameters:**
- `template_id` (string) - Custom template ID (uses default if omitted)

=======================================================================
## TOOL RESPONSE FORMAT

Successful response from tool:

```json
{
  "success": true,
  "workflow_id": "abc123xyz",
  "workflow_name": "Squidgy_Social_Media_Manager_Workflow",
  "editor_url": "https://n8n.theaiteam.uk/workflow/abc123xyz",
  "message": "Workflow created successfully. ID: abc123xyz",
  "warnings": []
}
```

**Response Fields:**
- `success` - Boolean indicating success/failure
- `workflow_id` - The new workflow ID in N8N
- `workflow_name` - Generated workflow name
- `editor_url` - **IMPORTANT:** Direct link to edit and publish the workflow
- `message` - Success message
- `warnings` - Array of any credential mapping warnings

=======================================================================
## WHAT THE TOOL DOES

The N8N workflow creation tool automatically handles all N8N workflow complexity:
- Clones the standard template workflow
- Replaces agent_id placeholders throughout
- Configures webhook, database, AI agent, and response nodes
- Maps credentials to your N8N instance
- Deploys and returns editor URL

**You don't need to know the technical details - just use the tool!**

=======================================================================
## IMPLEMENTATION STEPS

**Step 1: Use N8N Workflow Creation Tool**

Use the available N8N workflow creation tool with:
- agent_id
- agent_name
- activate: false (default)

**Step 2: Extract Editor URL**

The tool returns the workflow editor URL:
```javascript
const editorUrl = result.editor_url;
// Example: "https://n8n.theaiteam.uk/workflow/abc123xyz"
```

**Step 3: Present to User**
Provide the editor URL as a clickable link in your response:

```markdown
✅ **N8N Workflow Created Successfully!**

🔗 **[Click here to open and publish your workflow]({editor_url})**

**Important:** You must click the link above and:
1. Review the workflow nodes
2. Verify credentials are connected
3. Click the **Activate** button in N8N
4. Test the workflow

Workflow ID: {workflow_id}
```

=======================================================================
## USER INSTRUCTIONS

Always provide these instructions after creating a workflow:

**What to do next:**
1. **Click the workflow link** above to open it in N8N
2. **Review the workflow** - Check all nodes are properly configured
3. **Verify credentials** - Ensure Claude, Postgres, and Supabase credentials are connected
4. **Activate the workflow** - Click the toggle switch in the top right
5. **Test it** - Send a test message to your agent in the Squidgy UI

**Troubleshooting:**
- If credentials show warnings, reconnect them in N8N
- If the workflow doesn't activate, check for any error messages
- Test the webhook URL directly if needed

=======================================================================
## VALIDATION CHECKLIST

Before using the tool:
- ✅ Agent ID is valid snake_case format
- ✅ Agent name is descriptive and clear

After tool execution:
- ✅ Tool response shows success: true
- ✅ `workflow_id` is present
- ✅ `editor_url` is valid and accessible
- ✅ Present editor URL as clickable link to user
- ✅ Provide clear instructions to activate workflow

=======================================================================
## ERROR HANDLING

**Common Errors:**

1. **N8N credentials missing:**
   - Error: "N8N configuration missing"
   - Solution: Ensure VITE_N8N_WEBHOOK_URL and VITE_N8N_TOKEN are set

2. **Template not found:**
   - Error: "Template workflow not found"
   - Solution: Verify template ID exists in N8N instance

3. **Credential mapping warnings:**
   - Check `warnings` array in response
   - User must manually reconnect credentials in N8N editor

4. **Tool execution errors:**
   - Retry the tool once
   - If fails again, inform user and check error message
