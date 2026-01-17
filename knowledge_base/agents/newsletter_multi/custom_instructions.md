# Newsletter Multi - Custom Instructions

**Storage:** Supabase (per user)
**Table:** `user_agent_customizations`
**Filter:** `user_id` + `agent_id = 'newsletter_multi'`

---

## User Customization Fields

### Brand Voice
```
{{ custom.brand_voice }}
```
Example: "Professional but approachable, use industry jargon sparingly"

### Target Audience
```
{{ custom.target_audience }}
```
Example: "B2B SaaS CTOs and engineering leaders"

### Tone Preferences
```
{{ custom.tone }}
```
Example: "Informative, data-driven, occasional humor"

### Newsletter Preferences
```
{{ custom.newsletter_preferences }}
```
Example: "Keep it under 800 words, include 2-3 actionable tips"

### Topics to Avoid
```
{{ custom.topics_to_avoid }}
```
Example: "Avoid politics, controversial opinions"

### Signature/Sign-off
```
{{ custom.signature }}
```
Example: "Cheers, The [Company] Team"

### Additional Instructions
```
{{ custom.additional_instructions }}
```
Example: "Always include a CTA to book a demo"

---

## How to Apply

These customizations are loaded from Supabase and injected into the agent prompt:

```javascript
// N8N Code Node
const customInstructions = $('Get User Customizations').item.json;

const systemPrompt = `
${baseInstructions}

## USER CUSTOMIZATIONS
Brand Voice: ${customInstructions.brand_voice || 'Default professional'}
Target Audience: ${customInstructions.target_audience || 'General B2B'}
Tone: ${customInstructions.tone || 'Professional'}
${customInstructions.additional_instructions || ''}
`;
```

---

## Default Values

If no custom instructions set:
- Brand Voice: Professional and informative
- Target Audience: B2B professionals
- Tone: Helpful and knowledgeable
- Newsletter Length: 600-1000 words

---

## User Can Update Via:

1. **Chat Command:** "Update my newsletter tone to casual"
2. **Settings Page:** /settings/agents/newsletter_multi
3. **Onboarding:** During initial agent setup
