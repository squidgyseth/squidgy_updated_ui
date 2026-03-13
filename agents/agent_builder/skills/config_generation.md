# Configuration Generation

Generate complete config.yaml files with all required fields and proper YAML formatting.

=======================================================================
## REQUIRED FIELDS

Every config.yaml MUST include these fields:

**Agent Section:**
- `id` - Unique snake_case identifier
- `emoji` - Single emoji character
- `name` - Display name with format "Name | Title"
- `category` - One of: MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL, ADMIN
- `description` - Brief description (1-2 sentences)
- `pinned` - Boolean (default: false)
- `enabled` - Boolean (default: true)
- `capabilities` - Array of 3-5 specific capabilities
- `recent_actions` - Array of 2 example actions

**N8N Section:**
- `webhook_url` - Format: `https://n8n.theaiteam.uk/webhook/{agent_id}`

**UI Use Section:**
- `page_type` - Usually "single_page"
- `pages` - Array with dashboard configuration

**Interface Section:**
- `type` - Usually "chat"
- `features` - Array of interface features

**Suggestions Section:**
- Array of 3-8 suggestion button texts

**Personality Section:**
- `tone` - Communication tone
- `style` - Interaction style
- `approach` - Response approach

=======================================================================
## OPTIONAL FIELDS

Include these fields when relevant:

**Agent Section (Optional):**
- `specialization` - For highly specialized agents
- `tagline` - Catchy tagline (3-5 words)
- `avatar` - Path to avatar image (if custom)
- `initial_message` - Custom welcome message
- `sidebar_greeting` - Custom sidebar text

=======================================================================
## COMPLETE TEMPLATE

```yaml
agent:
  id: [agent_id]
  emoji: "[emoji]"
  name: "[Name | Title]"
  category: [CATEGORY]
  description: "[Brief description of what this agent does]"
  specialization: "[Optional specialization]"
  tagline: "[Optional catchy tagline]"
  pinned: false
  enabled: true
  
  capabilities:
    - "[Specific capability 1]"
    - "[Specific capability 2]"
    - "[Specific capability 3]"
    - "[Specific capability 4]"
    - "[Specific capability 5]"
  
  recent_actions:
    - "[Example action 1]"
    - "[Example action 2]"

n8n:
  webhook_url: https://n8n.theaiteam.uk/webhook/[agent_id]

ui_use:
  page_type: single_page
  pages:
    - name: "[Agent Name] Dashboard"
      path: "[agent_id]-dashboard"
      order: 1
      validated: true

interface:
  type: chat
  features:
    - text_input
    - suggestion_buttons
    - file_upload  # Include if agent handles files/media

suggestions:
  - "[Relevant suggestion 1 based on capabilities]"
  - "[Relevant suggestion 2]"
  - "[Relevant suggestion 3]"
  - "What can you do?"
  - "Show me examples"

personality:
  tone: [tone]
  style: [style]
  approach: [approach]
```

=======================================================================
## INTERFACE FEATURES

Choose appropriate features based on agent capabilities:

**Always Include:**
- `text_input` - Basic text input
- `suggestion_buttons` - Quick action buttons

**Conditional Features:**
- `file_upload` - If agent handles files, images, videos, documents
- `voice_input` - If agent supports voice commands
- `code_preview` - If agent generates code or technical content
- `rich_text` - If agent needs formatted text input

=======================================================================
## SUGGESTION BUTTONS

Create 3-8 relevant suggestion buttons:

**Best Practices:**
1. First 2-3 should be primary use cases
2. Include "What can you do?" for discovery
3. Include "Show me examples" for guidance
4. Keep text concise (3-7 words)
5. Use action verbs
6. Make them specific to capabilities

**Examples by Category:**

*MARKETING Agent:*
- "Create a social media post"
- "Generate content ideas"
- "Analyze engagement metrics"
- "Schedule a campaign"
- "What can you do?"

*SALES Agent:*
- "Qualify a new lead"
- "Generate outreach message"
- "Update pipeline status"
- "Show me examples"
- "What can you do?"

*SUPPORT Agent:*
- "Help with a customer issue"
- "Find FAQ answer"
- "Escalate a ticket"
- "Check ticket status"
- "What can you do?"

=======================================================================
## RECENT ACTIONS

Generate 2 example recent actions that showcase capabilities:

**Format:**
- Use past tense
- Be specific but concise
- Highlight key capabilities
- Make them realistic

**Examples:**

*Email Marketing Agent:*
- "Created and scheduled 5-email welcome sequence"
- "Analyzed campaign performance for Q1 newsletter"

*Customer Support Agent:*
- "Resolved 12 common billing questions automatically"
- "Escalated 3 complex technical issues to engineering team"

*Social Media Agent:*
- "Published 15 posts across 4 platforms this week"
- "Generated content calendar for next month"

=======================================================================
## YAML FORMATTING RULES

**Critical:**
1. Use 2 spaces for indentation (NOT tabs)
2. Use double quotes for strings with special characters
3. Use single quotes for strings with HTML or line breaks
4. Arrays can use `-` list format
5. Maintain consistent spacing
6. No trailing whitespace
7. UTF-8 encoding

**String Formatting:**
```yaml
# Simple string
description: "Brief description"

# String with special chars
name: "Agent | Title"

# Multiline string
initial_message: 'Line 1<br>Line 2<br>Line 3'

# Array
capabilities:
  - "Item 1"
  - "Item 2"
```

=======================================================================
## VALIDATION CHECKLIST

Before finalizing config.yaml:
- ✅ All required fields present
- ✅ Webhook URL matches agent_id
- ✅ Category is valid enum value
- ✅ Capabilities are specific (3-5 items)
- ✅ YAML syntax is valid
- ✅ Indentation is consistent (2 spaces)
- ✅ No placeholder values like [TODO] or [FILL_IN]
- ✅ File uses UTF-8 encoding
