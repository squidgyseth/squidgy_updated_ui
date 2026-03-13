# Package & Deployment

Create complete agent packages with zip files and upload to Supabase for user download.

=======================================================================
## PACKAGE CONTENTS

Every agent package must include:

**Required Files:**
1. `config.yaml` - Agent configuration
2. `system_prompt.md` - Agent-specific instructions
3. `n8n_workflow.json` - N8N workflow definition
4. `README.md` - Deployment guide

**Optional Files:**
5. `skills/` folder - Skill files (if Tier 2+)
   - `skill_1.md`
   - `skill_2.md`
   - etc.

=======================================================================
## DEPLOYMENT README TEMPLATE

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

3. **Import N8N Workflow**
   - Open N8N: https://n8n.theaiteam.uk
   - Go to Workflows → Import from File
   - Select `n8n_workflow.json`
   - Click Import

4. **Configure Credentials**
   - Open the imported workflow
   - Verify credentials are connected:
     - OpenRouter API (Claude)
     - Neon Postgres
     - Supabase (if used)
   - Save and activate workflow

5. **Test Agent**
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
├── n8n_workflow.json        # N8N workflow
├── README.md                # This file
└── skills/                  # Optional skills folder
    ├── skill_1.md
    └── skill_2.md
```

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
1. Verify workflow is activated in N8N
2. Check webhook URL matches agent_id
3. Test webhook directly:
   ```bash
   curl -X POST https://n8n.theaiteam.uk/webhook/[agent_id] \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```
4. Check N8N execution logs for errors

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

**Process:**
1. Create temporary directory structure
2. Copy all generated files to structure
3. Create zip archive
4. Clean up temporary files

**Naming Convention:**
- Format: `[agent_id]_agent_package_[timestamp].zip`
- Example: `email_marketing_agent_package_20260313.zip`

**Directory Structure in Zip:**
```
[agent_id]/
├── config.yaml
├── system_prompt.md
├── n8n_workflow.json
├── README.md
└── skills/
    ├── skill_1.md
    └── skill_2.md
```

=======================================================================
## SUPABASE UPLOAD

**Storage Bucket:**
- Bucket name: `agent-packages`
- Public access: Yes
- Cache control: 7 days (604800 seconds)

**Upload Process:**
```javascript
// 1. Upload zip file
const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const filename = `${agent_id}_agent_package_${timestamp}.zip`;

const { data, error } = await supabase.storage
  .from('agent-packages')
  .upload(filename, zipFile, {
    cacheControl: '604800',
    upsert: false,
    contentType: 'application/zip'
  });

if (error) {
  console.error('Upload failed:', error);
  return null;
}

// 2. Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('agent-packages')
  .getPublicUrl(filename);

return publicUrl;
```

**Error Handling:**
- If upload fails, retry once
- If retry fails, save zip locally and notify user
- Log error details for debugging

=======================================================================
## USER DELIVERY MESSAGE

After successful upload, provide this message to user:

```markdown
✅ **Agent Created: [Agent Name | Title]**

📦 **Download Package:** [Supabase Public URL]

**What's Included:**
- Complete agent configuration (config.yaml)
- System prompt with [X] workflows
- N8N workflow template
[- X skill files (if applicable)]
- Deployment guide with step-by-step instructions

**Quick Deploy:**
1. Download and extract the zip file
2. Place in `agents/[agent_id]/` directory
3. Run `node scripts/build-agents.js`
4. Import `n8n_workflow.json` to N8N
5. Activate workflow and test!

**Agent Details:**
- **ID:** [agent_id]
- **Category:** [CATEGORY]
- **Capabilities:** [count] specialized capabilities
- **Complexity:** Tier [X]

**Need Adjustments?**
Let me know if you'd like to modify any configuration, add more capabilities, or create additional skills!

---
*Package expires in 7 days. Download and deploy soon!*
```

=======================================================================
## VALIDATION CHECKLIST

Before creating package:
- ✅ All required files generated
- ✅ config.yaml is valid YAML
- ✅ system_prompt.md is complete
- ✅ n8n_workflow.json is valid JSON
- ✅ README.md has correct agent_id references
- ✅ Skills folder created (if needed)
- ✅ All files use UTF-8 encoding
- ✅ No placeholder values remain
- ✅ Directory structure is correct

After upload:
- ✅ Zip file uploaded successfully
- ✅ Public URL is accessible
- ✅ File size is reasonable (<10MB)
- ✅ Download link works
- ✅ User message is formatted correctly
