# Social Media Manager (SMM) - Custom Instructions

**Storage:** Supabase (per user)
**Table:** `assistant_personalizations`
**Filter:** `user_id` + `assistant_id = 'smm'`

---

## User Customization Fields

### Brand Voice
```
{{ custom.brand_voice }}
```
Example: "Playful yet professional, tech-savvy"

### Target Audience
```
{{ custom.target_audience }}
```
Example: "Startup founders and early-stage entrepreneurs"

### Communication Tone
```
{{ custom.communication_tone }}
```
Example: "Casual, energetic, with industry humor"

### Preferred Platforms
```
{{ custom.preferred_platforms }}
```
Example: ["LinkedIn", "Twitter", "Instagram"]

### Posting Frequency
```
{{ custom.posting_frequency }}
```
Example: { "linkedin": "3x/week", "twitter": "daily", "instagram": "2x/week" }

### Hashtag Preferences
```
{{ custom.hashtag_preferences }}
```
Example: "Always include #SaaS #StartupLife, avoid generic hashtags"

### Content Themes
```
{{ custom.content_themes }}
```
Example: ["Industry insights", "Behind the scenes", "Customer success", "Product updates"]

### Engagement Style
```
{{ custom.engagement_style }}
```
Example: "Reply to comments within 2 hours, use emojis sparingly"

### Additional Instructions
```
{{ custom.custom_instructions }}
```
Example: "Never post on weekends, always tag our company page"

---

## How to Apply

These customizations are loaded from Supabase and injected into the agent prompt:

```javascript
// N8N Code Node
const customInstructions = $('Get User Customizations').item.json;

const systemPrompt = `
${baseInstructions}

## USER CUSTOMIZATIONS
Brand Voice: ${customInstructions.brand_voice || 'Professional'}
Target Audience: ${customInstructions.target_audience || 'B2B professionals'}
Tone: ${customInstructions.communication_tone || 'Friendly'}
Platforms: ${customInstructions.preferred_platforms?.join(', ') || 'LinkedIn, Twitter'}
Posting Frequency: ${JSON.stringify(customInstructions.posting_frequency) || 'Default schedule'}
Hashtags: ${customInstructions.hashtag_preferences || 'Industry relevant'}
${customInstructions.custom_instructions || ''}
`;
```

---

## Default Values

If no custom instructions set:
- Brand Voice: Professional and engaging
- Target Audience: B2B professionals
- Tone: Friendly and approachable
- Platforms: LinkedIn, Twitter
- Posting Frequency: 3x/week per platform
- Hashtags: 3-5 relevant industry tags

---

## User Can Update Via:

1. **Chat Command:** "Update my posting frequency to daily on Twitter"
2. **Settings Page:** /settings/agents/smm
3. **Onboarding:** During initial agent setup
