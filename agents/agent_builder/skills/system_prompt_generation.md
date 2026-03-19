# System Prompt Generation

**CRITICAL: The system_prompt.md file is the BRAIN of the agent. It defines HOW the agent thinks, acts, and responds to users.**

=======================================================================
## WHY SYSTEM_PROMPT.MD IS ESSENTIAL

The system_prompt.md file is the agent's:

1. **Instruction Manual** - Tells the agent exactly what to do and how to do it
2. **Personality Definition** - Defines communication style and approach
3. **Workflow Guide** - Step-by-step processes for handling requests
4. **Decision Framework** - Rules for routing, escalation, and error handling
5. **Behavioral Blueprint** - How to interact with users and tools

**Without system_prompt.md:**
- ❌ Agent won't know its purpose or responsibilities
- ❌ No clear workflows to follow
- ❌ Inconsistent behavior and responses
- ❌ Can't make proper decisions
- ❌ Agent is essentially a generic chatbot

=======================================================================
## CRITICAL: CONSULT BASE SYSTEM PROMPT REFERENCE SKILL

**BEFORE creating system_prompt.md, you MUST review the "Base System Prompt Reference" skill.**

The Base System Prompt Reference contains:
- Core principles (KB FIRST, NARRATE THEN EXECUTE, COMPLETE ACTIONS)
- Response format rules (buttons, markdown, streaming)
- Security guidelines
- Tone & behavior standards
- Error handling patterns

**DO NOT DUPLICATE** anything from the base prompt. It's automatically added to ALL agents.

**ONLY INCLUDE** agent-specific content:
- Agent's unique role and responsibilities
- Specific workflows and processes
- Specialized tool usage instructions
- Domain-specific knowledge
- Agent-specific routing rules
- Skills references (if agent has skills)

=======================================================================
## HOW TO CREATE SYSTEM_PROMPT.MD

**STEP 1: Review Base System Prompt Reference Skill**

Before writing anything, **ALWAYS** consult the "Base System Prompt Reference" skill to understand:
- What's already covered in the base prompt
- What you should NOT duplicate
- What formatting standards to follow

**STEP 2: Keep It Minimal (50-100 lines)**

If the agent has **skills**, the system prompt should be MINIMAL:
- High-level purpose and responsibilities
- Reference to skills for detailed processes
- Key rules and constraints

If the agent has **NO skills**, the system prompt can be longer (100-200 lines):
- Detailed workflows and processes
- Comprehensive tool usage instructions
- Extensive examples and best practices

**STEP 3: Structure the Content**

Include these sections (in order):
1. **Agent Name & Description** (2-3 sentences)
2. **PRIMARY RESPONSIBILITIES** (4-6 bullet points)
3. **WORKFLOWS** (2-4 high-level workflows if agent has NO skills)
4. **TOOL USAGE** (specific tools and how to use them)
5. **COMMUNICATION STYLE** (tone, style, approach from config)
6. **KEY RULES** (5-7 agent-specific rules)

**Note:** Do NOT add a SKILLS section to the system prompt. Skills are automatically referenced from the config.yaml file.

**STEP 4: Use Inferred Data**

Use data from "Intelligent Inference" skill:
- Agent name and purpose
- Capabilities (convert to responsibilities)
- Personality traits (for communication style)
- Category (affects focus areas)

=======================================================================
## SECTION GUIDELINES

### PRIMARY RESPONSIBILITIES

Expand capabilities into detailed responsibilities:

**Format:**
- Use numbered list (4-6 items)
- Each item should have a bold title and description
- Be specific about what the agent does
- Focus on outcomes, not just actions

**Example:**
```markdown
## PRIMARY RESPONSIBILITIES

1. **Content Creation** - Generate engaging social media posts, captions, and hashtags tailored to brand voice and platform requirements
2. **Scheduling & Publishing** - Schedule posts across multiple platforms with optimal timing for maximum engagement
3. **Performance Tracking** - Monitor engagement metrics, analyze trends, and provide actionable insights
4. **Content Calendar Management** - Plan and organize content calendars with strategic themes and campaigns
5. **Audience Engagement** - Respond to comments, messages, and mentions to build community relationships
```

### WORKFLOWS

Create step-by-step workflows for main capabilities:

**Best Practices:**
1. Create 2-4 workflows for primary use cases
2. Use descriptive workflow names
3. Number each step clearly
4. Include decision points if needed
5. Reference specific tools or data sources
6. Keep steps actionable

**Example:**
```markdown
## WORKFLOWS

### Post Creation Workflow
1. Understand user's content goal and target audience
2. Check knowledge base for brand voice guidelines
3. Generate post content with appropriate tone and style
4. Suggest relevant hashtags and mentions
5. Offer scheduling options or publish immediately
6. Confirm post details with user before publishing

### Performance Analysis Workflow
1. Retrieve engagement data from connected platforms
2. Analyze metrics (likes, shares, comments, reach)
3. Identify top-performing content types
4. Generate insights and recommendations
5. Suggest content strategy adjustments
6. Create visual report if requested
```

### TOOL USAGE

Specify which tools the agent should use and how:

**Include:**
- Database queries (Supabase, Neon)
- API integrations (platform-specific)
- File handling (uploads, downloads)
- External services
- Calculation tools
- Search capabilities

**Example:**
```markdown
## TOOL USAGE

**Supabase Database:**
- Query `social_media_posts` table for user's post history
- Store scheduled posts with timestamps
- Retrieve brand voice guidelines from `knowledge_base`

**Platform APIs:**
- Use Facebook Graph API for post publishing
- Use Instagram Basic Display API for analytics
- Use LinkedIn API for professional content

**File Handling:**
- Accept image uploads (jpg, png, webp)
- Accept video uploads (mp4, mov)
- Resize images to platform requirements
- Generate thumbnails for video content

**Content Generation:**
- Use AI to generate captions and hashtags
- Analyze trending topics for content ideas
- Suggest optimal posting times based on audience data
```

### COMMUNICATION STYLE

Define how the agent should communicate:

**Include:**
- Tone (from personality config)
- Style (from personality config)
- Approach (from personality config)
- Language specifics for target audience
- Formatting preferences
- Emoji usage guidelines

**Example:**
```markdown
## COMMUNICATION STYLE

- Tone: friendly and enthusiastic
- Style: creative and engaging
- Approach: proactive with suggestions
- Language: Casual but professional, use social media terminology
- Formatting: Use emojis sparingly, bullet points for lists
- Audience: Marketing professionals and content creators
```

### KEY RULES

Create 5-7 agent-specific rules:

**Best Practices:**
1. Make rules specific to this agent's domain
2. Include constraints and limitations
3. Define error handling for common issues
4. Specify when to escalate or route to other agents
5. Include data privacy rules if handling sensitive info

**Example:**
```markdown
## KEY RULES

1. **Brand Consistency** - Always check knowledge base for brand voice guidelines before creating content
2. **Platform Requirements** - Verify character limits, image dimensions, and format requirements for each platform
3. **Scheduling Limits** - Do not schedule more than 5 posts per day per platform to avoid spam flags
4. **Content Approval** - Always show generated content to user for approval before publishing
5. **Error Handling** - If API connection fails, save content as draft and notify user
6. **Privacy** - Never include personal information or sensitive data in public posts
7. **Escalation** - Route complex brand strategy questions to Brand Advisor agent
```

=======================================================================
## LENGTH GUIDELINES

**With Skills (Recommended):**
- Total: 50-100 lines
- PRIMARY RESPONSIBILITIES: 4-6 items
- SKILLS SECTION: Reference to skill files
- TOOL USAGE: 10-20 lines (basics only)
- COMMUNICATION STYLE: 5-8 lines
- KEY RULES: 5-7 rules

**Without Skills:**
- Total: 100-200 lines
- PRIMARY RESPONSIBILITIES: 4-6 items
- WORKFLOWS: 2-4 workflows with 4-8 steps each
- TOOL USAGE: 10-30 lines (detailed)
- COMMUNICATION STYLE: 5-8 lines
- KEY RULES: 5-7 rules

**Critical Rules:**
- ❌ Do NOT duplicate base_system_prompt.md content
- ❌ Do NOT include core principles, response format, security (already in base)
- ✅ Focus ONLY on agent-specific content
- ✅ Keep it minimal if agent has skills
- ✅ Use clear, actionable language

=======================================================================
## EXAMPLES BY CATEGORY

### MARKETING Agent
Focus on: content creation, brand voice, engagement, analytics, scheduling

### SALES Agent
Focus on: lead qualification, outreach, pipeline management, CRM integration, follow-ups

### HR Agent
Focus on: candidate screening, onboarding, employee data, compliance, scheduling

### SUPPORT Agent
Focus on: ticket triage, FAQ responses, escalation rules, customer satisfaction, resolution tracking

### OPERATIONS Agent
Focus on: task management, workflow automation, resource allocation, scheduling, reporting

### GENERAL Agent
Focus on: versatility, routing to specialists, general assistance, information retrieval

=======================================================================
## GENERATION PROCESS

**Follow this exact sequence:**

1. **Review Base System Prompt Reference skill** - Understand what NOT to duplicate
2. **Check if agent has skills** - Determines if system prompt should be minimal or detailed
3. **Use available information** - Capabilities, personality, category, user requirements
4. **Write agent name & description** - Brief overview of purpose
5. **List primary responsibilities** - Convert capabilities into detailed responsibilities
6. **Add workflows** - Only if agent has NO skills (workflows are replaced by skills)
7. **Specify tool usage** - Database queries, APIs, file handling specific to this agent
8. **Define communication style** - Based on personality and target users
9. **Create key rules** - Agent-specific constraints, error handling, escalation
10. **Validate** - Check length, no duplication, all sections present

**Important:** Skills section is automatically added from config.yaml - do NOT manually add it to system_prompt.md

=======================================================================
## VALIDATION CHECKLIST

Before finalizing system_prompt.md:

**Base Prompt Compliance:**
- ✅ Reviewed "Base System Prompt Reference" skill
- ✅ No duplication of base prompt content (core principles, response format, security)
- ✅ Only agent-specific content included

**Content Quality:**
- ✅ All required sections present (responsibilities, workflows/skills, tool usage, style, rules)
- ✅ Responsibilities match capabilities from config.yaml
- ✅ Workflows are specific and actionable (or skills are referenced)
- ✅ Tool usage is detailed and relevant to agent's purpose
- ✅ Communication style matches personality config
- ✅ Key rules are agent-specific (not generic)

**Length & Structure:**
- ✅ Length is appropriate (50-100 lines with skills, 100-200 without)
- ✅ System prompt is MINIMAL if agent has skills
- ✅ Markdown formatting is correct
- ✅ UTF-8 encoding
- ✅ NO skills section manually added (skills auto-referenced from config.yaml)

**Skills Handling (if applicable):**
- ✅ System prompt doesn't duplicate skill content
- ✅ System prompt stays minimal since detailed processes are in skills
- ✅ Skills are defined in config.yaml (not in system_prompt.md)

**REMEMBER:** Both the base prompt AND skills section are automatically added. Focus only on what makes THIS agent unique.
