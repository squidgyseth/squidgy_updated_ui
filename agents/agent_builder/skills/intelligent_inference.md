# Intelligent Inference

Automatically infer agent requirements from user input gathered through natural conversation.

=======================================================================
## WHEN TO USE THIS SKILL

**This skill is used AFTER Step 1 has gathered sufficient information from the user.**

You should have enough information to understand:
- What the agent does (purpose)
- Who will use it (target users)
- What tasks it handles (capabilities)
- What systems it connects to (integrations)
- Any special needs (requirements)

**If critical information is missing, return to Step 1 to gather it through natural conversation.**

=======================================================================
## INFERENCE STRATEGY

Use ALL available information to make intelligent inferences:

- **Purpose statement** → Primary category and core capabilities
- **Target users** → Tone, complexity level, and interface features
- **Stated capabilities** → Specific features and skill requirements
- **Platform integrations** → Technical complexity tier and integration needs
- **Special requirements** → Custom workflows and compliance considerations

The more information you have, the better your inferences will be. Use everything the user has shared.

=======================================================================
## CATEGORY DETECTION

Analyze the agent purpose statement for keywords and map to categories:

**MARKETING Keywords:**
- social, post, content, brand, campaign, newsletter, email marketing, advertising, SEO, copywriting, influencer, engagement, followers, likes, shares

**SALES Keywords:**
- lead, quote, sales, customer acquisition, CRM, pipeline, prospect, deal, conversion, revenue, closing, outreach, cold calling

**HR Keywords:**
- recruit, employee, onboarding, HR, hiring, candidate, interview, performance review, benefits, payroll, team management, training

**SUPPORT Keywords:**
- support, help, ticket, customer service, helpdesk, troubleshooting, FAQ, issue resolution, customer satisfaction, complaint handling

**OPERATIONS Keywords:**
- workflow, task, project, automation, process, efficiency, scheduling, resource management, logistics, inventory, coordination

**GENERAL (Default):**
- Any purpose that doesn't clearly fit other categories
- Multi-purpose agents
- Generic assistants

=======================================================================
## CAPABILITY EXTRACTION

Parse the purpose statement to generate 3-5 specific capabilities:

**Process:**
1. Identify action verbs (manage, create, schedule, analyze, track, generate, etc.)
2. Identify target nouns (posts, leads, employees, tickets, tasks, etc.)
3. Combine into specific capability statements
4. Ensure capabilities are actionable and measurable

**Examples:**

*Purpose: "Manage social media posts"*
- Capabilities:
  1. Schedule and publish social media posts
  2. Generate content ideas and captions
  3. Track engagement metrics and analytics
  4. Manage multiple platform accounts
  5. Create content calendars

*Purpose: "Help with customer support tickets"*
- Capabilities:
  1. Triage and categorize support tickets
  2. Provide instant answers to common questions
  3. Escalate complex issues to human agents
  4. Track ticket resolution times
  5. Generate customer satisfaction reports

*Purpose: "Assist with sales lead qualification"*
- Capabilities:
  1. Score and qualify incoming leads
  2. Research prospect companies and contacts
  3. Generate personalized outreach messages
  4. Schedule follow-up reminders
  5. Track lead progression through pipeline

=======================================================================
## PERSONALITY MAPPING

Assign personality traits based on detected category:

**MARKETING:**
- tone: friendly
- style: creative
- approach: proactive

**SALES:**
- tone: professional
- style: persuasive
- approach: consultative

**HR:**
- tone: friendly
- style: supportive
- approach: collaborative

**SUPPORT:**
- tone: friendly
- style: helpful
- approach: solution_focused

**OPERATIONS:**
- tone: professional
- style: efficient
- approach: proactive

**GENERAL:**
- tone: professional
- style: helpful
- approach: proactive

=======================================================================
## EMOJI SELECTION

Choose an appropriate emoji based on category and purpose:

**MARKETING Options:**
📱 (social media), 🎨 (creative/design), 📊 (analytics), 💡 (ideas), ✨ (engagement), 📧 (email), 🎯 (targeting), 📸 (content)

**SALES Options:**
💼 (business), 📈 (growth), 🎯 (targeting), 💰 (revenue), 🤝 (relationships), 📞 (outreach), 💎 (value)

**HR Options:**
👥 (people), 🎓 (training), 📋 (processes), 🏢 (company), 💼 (professional), 🌟 (talent), 🤝 (teamwork)

**SUPPORT Options:**
🆘 (help), 💬 (communication), 🎧 (listening), 🛟 (rescue), ✅ (resolution), 🔧 (fixing), 💡 (solutions)

**OPERATIONS Options:**
⚙️ (systems), 📊 (tracking), 🔄 (processes), 📋 (tasks), 🚀 (efficiency), 📅 (scheduling), 🎯 (goals)

**GENERAL Options:**
🤖 (AI), 💡 (smart), 🎯 (focused), ✨ (helpful), 🌟 (excellent), 🧠 (intelligent), 💬 (conversational)

**Selection Strategy:**
1. Pick the most relevant emoji for the specific purpose
2. Prefer unique emojis over commonly used ones
3. Consider the target audience (B2B vs B2C, formal vs casual)

=======================================================================
## AGENT ID GENERATION

Convert agent name to valid snake_case identifier:

**Rules:**
1. Convert to lowercase
2. Remove all special characters except spaces and underscores
3. Replace spaces with underscores
4. Remove consecutive underscores
5. Trim leading/trailing underscores
6. Keep concise (2-3 words maximum)

**Examples:**
- "Email Marketing Specialist" → `email_marketing`
- "Customer Support Bot" → `customer_support`
- "Social Media Manager" → `social_media`
- "HR Onboarding Assistant" → `hr_onboarding`
- "Sales Lead Qualifier" → `sales_qualifier`

=======================================================================
## VALIDATION

Before proceeding, verify:

**Information Gathering:**
- ✅ Agent purpose is clear and well-defined
- ✅ Target users are identified
- ✅ Key capabilities (3-5) are specified
- ✅ Platform integrations are documented
- ✅ Special requirements are noted (if any)

**Inference Quality:**
- ✅ Category matches purpose keywords and user requirements
- ✅ Capabilities are specific and actionable (3-5 items)
- ✅ Personality traits align with category AND target users
- ✅ Emoji is relevant and appropriate
- ✅ Agent ID is unique, snake_case, and concise
- ✅ Complexity tier matches platform integrations and workflows

**User Confirmation:**
- ✅ Complete agent plan has been presented to user
- ✅ User has explicitly approved the plan
- ✅ Any requested changes have been incorporated
