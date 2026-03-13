# Intelligent Inference

Automatically infer agent requirements from minimal user input using keyword detection and industry patterns.

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
- ✅ Category matches purpose keywords
- ✅ Capabilities are specific and actionable (3-5 items)
- ✅ Personality traits align with category
- ✅ Emoji is relevant and appropriate
- ✅ Agent ID is unique, snake_case, and concise
