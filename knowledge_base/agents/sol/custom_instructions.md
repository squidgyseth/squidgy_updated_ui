# Solar Sales Assistant (SOL) - Custom Instructions

**Storage:** Supabase (per user)
**Table:** `assistant_personalizations`
**Filter:** `user_id` + `assistant_id = 'sol'`

---

## User Customization Fields

### Company Name
```
{{ custom.company_name }}
```
Example: "SunPower Solutions"

### Service Areas
```
{{ custom.service_areas }}
```
Example: ["California", "Arizona", "Nevada"]

### Communication Tone
```
{{ custom.communication_tone }}
```
Example: "Friendly, consultative, not pushy"

### Product Offerings
```
{{ custom.product_offerings }}
```
Example: ["Residential solar", "Battery storage", "EV chargers"]

### Financing Options
```
{{ custom.financing_options }}
```
Example: ["$0 down lease", "Solar loan", "Cash purchase", "PPA"]

### Incentives to Highlight
```
{{ custom.incentives }}
```
Example: ["30% Federal ITC", "State rebates", "Net metering"]

### Consultation Scheduling
```
{{ custom.scheduling_info }}
```
Example: { "calendar_link": "https://calendly.com/...", "availability": "Mon-Sat 9-6" }

### Lead Qualification Threshold
```
{{ custom.qualification_threshold }}
```
Example: 50 (minimum lead score to qualify)

### Additional Instructions
```
{{ custom.custom_instructions }}
```
Example: "Always mention our 25-year warranty, emphasize local installation team"

---

## How to Apply

These customizations are loaded from Supabase and injected into the agent prompt:

```javascript
// N8N Code Node
const customInstructions = $('Get User Customizations').item.json;

const systemPrompt = `
${baseInstructions}

## COMPANY CUSTOMIZATIONS
Company: ${customInstructions.company_name || 'Solar Company'}
Service Areas: ${customInstructions.service_areas?.join(', ') || 'Nationwide'}
Tone: ${customInstructions.communication_tone || 'Professional and helpful'}
Products: ${customInstructions.product_offerings?.join(', ') || 'Residential solar'}
Financing: ${customInstructions.financing_options?.join(', ') || 'Multiple options available'}
Qualification Threshold: ${customInstructions.qualification_threshold || 50} points
${customInstructions.custom_instructions || ''}
`;
```

---

## Default Values

If no custom instructions set:
- Company Name: [Company Name]
- Service Areas: Check with representative
- Tone: Professional, consultative, helpful
- Products: Residential solar systems
- Financing: $0 down options available
- Qualification Threshold: 50 points

---

## Lead Routing Rules

Based on lead score and customization:

| Score | Action |
|-------|--------|
| 70+ | Hot lead - immediate callback |
| 50-69 | Qualified - schedule consultation |
| 30-49 | Nurture - send educational content |
| < 30 | Not qualified - suggest alternatives |

---

## User Can Update Via:

1. **Chat Command:** "Update service areas to include Texas"
2. **Settings Page:** /settings/agents/sol
3. **Admin Dashboard:** /admin/sol-config
4. **Onboarding:** During initial agent setup
