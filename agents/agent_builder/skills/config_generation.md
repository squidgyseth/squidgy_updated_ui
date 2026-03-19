# Configuration Generation

**CRITICAL: The config.yaml file is the FOUNDATION of every agent. Without it, the agent cannot be registered, discovered, or used in the platform.**

=======================================================================
## PREREQUISITE CHECK

**BEFORE generating config.yaml, ensure you have sufficient information:**

You should understand:
- What the agent does and its purpose
- Who will use it and how they'll interact with it
- Key capabilities and features
- Any platform integrations needed
- User has confirmed the agent plan (Step 1.5)
- Intelligent inference has been completed (Step 2)

**If you're missing critical information needed to create a complete config.yaml, gather it first.**

=======================================================================
## WHY CONFIG.YAML IS ESSENTIAL

The config.yaml file serves as the agent's:

1. **Identity Card** - Defines who the agent is (ID, name, emoji, category)
2. **Capability Registry** - Lists what the agent can do
3. **Integration Hub** - Connects to N8N workflows and platform features
4. **User Interface Blueprint** - Defines how users interact with the agent
5. **Discovery Mechanism** - Makes the agent visible and searchable in the platform

**Without config.yaml:**
- ❌ Agent won't appear in the agent list
- ❌ Platform can't route requests to the agent
- ❌ N8N workflows can't be triggered
- ❌ UI components won't render properly
- ❌ Agent is essentially invisible and unusable

=======================================================================
## HOW TO CREATE CONFIG.YAML

**STEP 1: Consult the Agent Configuration Template Skill**

Before creating config.yaml, **ALWAYS** review the "Agent Configuration Template" skill. This skill contains:
- Complete YAML structure with all sections
- Field-by-field explanations
- Examples and best practices
- Required vs optional fields

**STEP 2: Use Inferred Data**

Use the data from "Intelligent Inference" skill:
- Agent ID (from inference)
- Emoji (from inference)
- Name format: "[Name] | [Title]" (from inference)
- Category (from inference)
- Capabilities (from inference)
- Personality traits (from inference)

**STEP 3: Customize Based on Agent Purpose**

Review the template and fill in ALL fields based on:
- User's stated requirements
- Agent's specific purpose
- Inferred characteristics
- Category-specific best practices

=======================================================================
## CRITICAL CONFIGURATION DECISIONS

**Interface Features:**
Choose based on agent capabilities:
- **Always include:** `text_input`, `suggestion_buttons`
- **Add `file_upload`** if agent handles: images, videos, documents, media
- **Add `voice_input`** if agent supports voice commands
- **Add `code_preview`** if agent generates code or technical content

**Webhook URL:**
- MUST match agent_id exactly
- Format: `https://n8n.theaiteam.uk/webhook/{agent_id}`
- This is how the platform routes requests to N8N

**Category Selection:**
- Use the category from Intelligent Inference skill
- Valid values: MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL, ADMIN
- Category affects agent discovery and grouping

=======================================================================
## SUGGESTION BUTTONS STRATEGY

Suggestion buttons are the FIRST thing users see - they guide discovery and usage.

**Create 3-8 buttons that:**
1. **First 2-3:** Primary use cases (most common tasks)
2. **Middle buttons:** Secondary capabilities
3. **Always include:** "What can you do?" (for discovery)
4. **Consider adding:** "Show me examples" (for guidance)

**Button Writing Rules:**
- Use action verbs (Create, Generate, Analyze, Schedule)
- Keep concise (3-7 words)
- Be specific to capabilities
- Match agent's tone (professional vs casual)

**Example Process:**
For a "Social Media Manager" agent with capabilities:
- Post creation and scheduling
- Content calendar management
- Analytics and reporting

Generate buttons:
- "Create a social media post" (primary)
- "Schedule content calendar" (primary)
- "Analyze post performance" (secondary)
- "Generate content ideas" (secondary)
- "What can you do?" (discovery)

=======================================================================
## RECENT ACTIONS (Social Proof)

Recent actions provide social proof and set user expectations.

**Generate 2-4 example actions that:**
- Use past tense ("Created", "Analyzed", "Scheduled")
- Include specific numbers when possible ("15 posts", "5-email sequence")
- Showcase different capabilities
- Sound realistic and impressive
- Align with agent's category and purpose

**Formula:**
`[Action Verb] + [Specific Output] + [Optional: Timeframe/Metric]`

Examples:
- "Created and scheduled 5-email welcome sequence"
- "Analyzed campaign performance for Q1 newsletter"
- "Published 15 posts across 4 platforms this week"
- "Resolved 12 common billing questions automatically"

=======================================================================
## YAML FORMATTING (CRITICAL)

**Invalid YAML = Broken Agent**

YAML is extremely sensitive to formatting. Follow these rules EXACTLY:

1. **Indentation:** 2 spaces (NOT tabs, NOT 4 spaces)
2. **Quotes:** 
   - Double quotes for simple strings: `"Brief description"`
   - Single quotes for HTML/line breaks: `'Line 1<br>Line 2'`
3. **Arrays:** Use `-` with proper indentation
4. **No trailing whitespace**
5. **UTF-8 encoding only**

**Common Mistakes to AVOID:**
- ❌ Using tabs instead of spaces
- ❌ Inconsistent indentation
- ❌ Missing quotes around strings with special characters
- ❌ Wrong quote type (single vs double)
- ❌ Trailing spaces at end of lines

=======================================================================
## GENERATION PROCESS

**Follow this exact sequence:**

1. **Review Agent Configuration Template skill** - Get the complete structure
2. **Gather inferred data** - From Intelligent Inference skill
3. **Start with template** - Copy the structure from the template skill
4. **Fill in all fields** - Use inferred data and user requirements
5. **Customize suggestions** - Based on capabilities
6. **Generate recent actions** - Showcase key capabilities
7. **Validate YAML** - Check formatting and required fields
8. **Double-check webhook URL** - Must match agent_id exactly

=======================================================================
## VALIDATION CHECKLIST

Before finalizing config.yaml, verify:

**Structure:**
- ✅ Reviewed Agent Configuration Template skill
- ✅ All required sections present (agent, n8n, ui_use, interface, suggestions, personality)
- ✅ YAML syntax is valid (proper indentation, quotes, arrays)

**Content:**
- ✅ Agent ID matches inferred value (snake_case)
- ✅ Webhook URL matches agent_id: `https://n8n.theaiteam.uk/webhook/{agent_id}`
- ✅ Category is valid enum: MARKETING, SALES, HR, SUPPORT, OPERATIONS, GENERAL, ADMIN
- ✅ Capabilities are specific and actionable (3-5 items)
- ✅ Suggestion buttons include primary use cases + "What can you do?"
- ✅ Recent actions showcase different capabilities

**Quality:**
- ✅ No placeholder values like [TODO], [FILL_IN], [agent_id]
- ✅ All strings properly quoted
- ✅ Indentation consistent (2 spaces)
- ✅ No trailing whitespace
- ✅ File uses UTF-8 encoding

**REMEMBER:** A broken config.yaml means a broken agent. Take time to validate thoroughly.
