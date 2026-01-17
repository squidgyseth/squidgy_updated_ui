# Content Repurposer - Custom Instructions

**Storage:** Supabase (per user)
**Table:** `assistant_personalizations`
**Filter:** `user_id` + `assistant_id = 'content_repurposer'`

---

## User Customization Fields

### Brand Voice
```
{{ custom.brand_voice }}
```
Example: "Professional but approachable, industry expert tone"

### Target Audience
```
{{ custom.target_audience }}
```
Example: "Marketing managers and content strategists at B2B SaaS companies"

### Communication Tone
```
{{ custom.communication_tone }}
```
Example: "Friendly, conversational, with data-driven insights"

### Preferred Platforms
```
{{ custom.preferred_platforms }}
```
Example: ["LinkedIn", "Twitter", "Instagram"]

### Content Preferences
```
{{ custom.content_preferences }}
```
Example: "Focus on actionable tips, include statistics when available"

### Hashtag Strategy
```
{{ custom.hashtag_strategy }}
```
Example: "Use 3-5 relevant industry hashtags, avoid generic ones"

### Additional Instructions
```
{{ custom.custom_instructions }}
```
Example: "Always include a CTA, mention our product subtly"

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
Tone: ${customInstructions.communication_tone || 'Friendly and informative'}
Platforms: ${customInstructions.preferred_platforms?.join(', ') || 'LinkedIn, Twitter'}
${customInstructions.custom_instructions || ''}
`;
```

---

## Default Values

If no custom instructions set:
- Brand Voice: Professional and engaging
- Target Audience: B2B professionals
- Tone: Friendly and informative
- Platforms: LinkedIn, Twitter
- Hashtags: 3-5 relevant industry tags

---

## User Can Update Via:

1. **Chat Command:** "Update my content tone to more casual"
2. **Settings Page:** /settings/agents/content_repurposer
3. **Onboarding:** During initial agent setup
