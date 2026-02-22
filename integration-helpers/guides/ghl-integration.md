# GoHighLevel (GHL) Integration Guide

## 📋 Overview

This guide walks you through integrating GoHighLevel CRM with your Squidgy agent.

## 🎯 What You'll Need

- GHL Agency account with admin access
- Permission to create subaccounts
- API access enabled on your GHL account

## 🚀 Setup Methods

### Method 1: Automated (Recommended)

Use our Playwright automation script to set up GHL automatically:

```bash
npx tsx integration-helpers/playwright/ghl-setup.ts
```

The script will:
1. Log into your GHL agency account
2. Create a new subaccount
3. Retrieve API credentials
4. Save configuration to `.env`

### Method 2: Manual Setup

If you prefer manual setup or the automation fails:

#### Step 1: Create Subaccount

1. Log into GHL: https://app.gohighlevel.com
2. Navigate to **Agency View** > **Settings**
3. Click **"Add Location"** or **"Add Sub-Account"**
4. Fill in details:
   - **Name**: `Your Business Name - Squidgy`
   - **Address**: Optional
   - **Timezone**: Your timezone
5. Click **"Create"**

#### Step 2: Get API Credentials

1. Open the newly created subaccount
2. Navigate to **Settings** > **API**
3. Click **"Generate API Key"** (if not available)
4. Copy the **Location ID** and **API Key**

#### Step 3: Configure Environment Variables

Add to your `.env` file:

```env
GHL_YOUR_AGENT_ID_LOCATION_ID=your-location-id-here
GHL_YOUR_AGENT_ID_API_KEY=your-api-key-here
GHL_YOUR_AGENT_ID_SUBACCOUNT_NAME=Your Subaccount Name
```

Replace `YOUR_AGENT_ID` with your actual agent ID (e.g., `SOCIAL_MEDIA_AGENT`).

#### Step 4: Save to Supabase (Optional)

If using Supabase for credential storage:

```sql
INSERT INTO ghl_subaccounts (
  agent_id,
  ghl_location_id,
  pit_token,
  subaccount_name,
  user_id
) VALUES (
  'your_agent_id',
  'your-location-id',
  'your-api-key',
  'Your Subaccount Name',
  'user-uuid'
);
```

## 🔌 Using GHL in Your Agent

### Import the Service

```typescript
import { GHLMediaService } from '../client/services/ghlMediaService';

const ghlService = GHLMediaService.getInstance();
```

### Upload Media

```typescript
const credentials = await ghlService.getGHLCredentials(userId, agentId);

if (credentials) {
  const uploadedFile = await ghlService.uploadFile(
    userId,
    file,
    agentId
  );

  console.log('Uploaded:', uploadedFile);
}
```

### Fetch Media Library

```typescript
const mediaFiles = await ghlService.fetchMedia(userId, agentId);

mediaFiles.forEach(file => {
  console.log(file.name, file.url);
});
```

## 📝 Update Agent YAML

Add GHL configuration to your agent's YAML:

```yaml
agent:
  id: your_agent_id
  # ... other config

integrations:
  ghl:
    enabled: true
    subaccount_required: true
    capabilities:
      - media_management
      - contact_management
      - workflow_automation
```

## 🧪 Testing

Test your GHL integration:

```bash
# Start dev server
npm run dev

# Navigate to your agent
# Upload a test file
# Verify it appears in GHL media library
```

## 🔒 Security Best Practices

1. **Never commit** `.env` file to version control
2. **Use environment variables** for all credentials
3. **Rotate API keys** regularly
4. **Limit API key permissions** to only what's needed
5. **Monitor API usage** in GHL dashboard

## ❓ Troubleshooting

### Issue: API Key Invalid

**Solution**: Regenerate the API key in GHL Settings > API

### Issue: Location ID Not Found

**Solution**: Ensure you're using the Location ID (not Agency ID)

### Issue: Permission Denied

**Solution**: Verify your GHL account has API access enabled

### Issue: Media Upload Fails

**Solution**:
- Check file size (max 25MB)
- Verify file type is supported
- Ensure proper authorization headers

## 📚 GHL API Documentation

- [GHL API Docs](https://highlevel.stoplight.io/)
- [Media API](https://highlevel.stoplight.io/docs/integrations/3a2468f8e3f1d-upload-file)
- [Locations API](https://highlevel.stoplight.io/docs/integrations/85d60f9094fbb-get-location)

## 🆘 Need Help?

- Check the [GHL Community](https://community.gohighlevel.com/)
- Review existing implementations in `client/services/ghlMediaService.ts`
- Open an issue in Squidgy repository

---

**Last Updated**: 2025-02-21
**Squidgy Version**: 1.0.0
