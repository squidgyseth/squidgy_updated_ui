# N8N API Configuration Guide

**Purpose**: Configure N8N API access for template-based agent creation.

**Last Updated**: 2026-03-06

---

## Overview

The template-based agent creation system requires N8N API access to:
- Download workflow templates
- Deploy customized workflows
- List available workflows

---

## Setup Steps

### 1. Get Your N8N API Key

1. **Navigate to N8N**:
   - URL: https://n8n.theaiteam.uk

2. **Access API Settings**:
   - Click on your profile/settings
   - Go to **Settings** → **API**

3. **Generate API Key**:
   - Click **"Create API Key"** or **"Generate New Key"**
   - Copy the generated key

### 2. Configure Environment Variable

Add the API key to your `.env` file:

```bash
# N8N INTEGRATION
VITE_N8N_TOKEN=your-n8n-api-key-here
VITE_N8N_WEBHOOK_URL=https://n8n.theaiteam.uk/webhook
```

**Example `.env` file**:
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# N8N Integration
VITE_N8N_TOKEN=n8n_api_1234567890abcdef
VITE_N8N_WEBHOOK_URL=https://n8n.theaiteam.uk/webhook

# Other configs...
```

### 3. Verify Configuration

Run a test to verify the API key works:

```bash
node -e "
const { N8NTemplateService } = require('./server/services/n8nTemplateService.ts');
const service = N8NTemplateService.getInstance();
service.listWorkflows().then(workflows => {
  console.log('✓ N8N API connected successfully!');
  console.log('Available workflows:', workflows.length);
}).catch(error => {
  console.error('✗ N8N API connection failed:', error.message);
});
"
```

---

## Environment Variables

### `VITE_N8N_TOKEN`

**Required**: Yes (for template-based agent creation)

**Description**: N8N API authentication token

**Where to get it**: N8N Settings → API

**Example**: `n8n_api_1234567890abcdef`

### `VITE_N8N_WEBHOOK_URL`

**Required**: Yes (for agent webhooks)

**Description**: Base URL for N8N webhooks

**Default**: `https://n8n.theaiteam.uk/webhook`

**Note**: Individual agents use `{WEBHOOK_URL}/{agent_id}`

---

## Security Best Practices

### ✅ Do

- Store API key in `.env` file
- Add `.env` to `.gitignore`
- Use different API keys for development/production
- Rotate API keys regularly
- Limit API key permissions if possible

### ❌ Don't

- Commit API keys to version control
- Share API keys in chat/email
- Hardcode API keys in source code
- Use production keys in development
- Store keys in public repositories

---

## Troubleshooting

### Error: "Failed to download N8N template: Request failed with status code 401"

**Cause**: API key is missing or invalid

**Solutions**:
1. Check `.env` file has `VITE_N8N_TOKEN` set
2. Verify the API key is correct (copy from N8N)
3. Ensure no extra spaces or quotes in the key
4. Restart your terminal to reload environment variables

### Error: "N8N API key not found"

**Cause**: Environment variable not loaded

**Solutions**:
1. Check `.env` file exists in project root
2. Verify variable name is exactly `VITE_N8N_TOKEN`
3. Restart your development server
4. Check for typos in variable name

### Error: "Request failed with status code 403"

**Cause**: API key doesn't have required permissions

**Solutions**:
1. Regenerate API key in N8N
2. Ensure you have admin/owner access to N8N
3. Check N8N instance is accessible

### Error: "Network error" or "ECONNREFUSED"

**Cause**: Cannot connect to N8N instance

**Solutions**:
1. Verify N8N URL is correct: `https://n8n.theaiteam.uk`
2. Check your internet connection
3. Verify N8N instance is running
4. Check firewall/proxy settings

---

## Using the API Key

### In Agent Creation Script

The script automatically reads from `.env`:

```bash
node scripts/create-agent-from-template.js
```

### In Custom Scripts

```typescript
import { N8NTemplateService } from './server/services/n8nTemplateService';

const n8nService = N8NTemplateService.getInstance();

// Download template
const template = await n8nService.downloadTemplate('ijDtq0ljM2atxA0E');

// List workflows
const workflows = await n8nService.listWorkflows();

// Deploy workflow
const deployment = await n8nService.deployWorkflow(workflow, 'My Agent');
```

The service automatically uses `VITE_N8N_TOKEN` from environment variables.

---

## API Key Permissions

Your N8N API key needs permissions to:

- ✅ Read workflows
- ✅ Create workflows
- ✅ Update workflows
- ✅ List workflows

**Note**: These are typically included in standard API keys. If you encounter permission errors, regenerate the key or contact your N8N administrator.

---

## Related Documentation

- **[N8N Template-Based Agent Creation](./n8n-template-based-agent-creation.md)** - Using the template system
- **[Agent Creation Guide](../agents/README.md)** - Creating agents
- **[N8N Agent Setup](./n8n-agent-setup.md)** - Manual N8N configuration

---

**Last Updated**: 2026-03-06
