# Skills Generation

**CORE PRINCIPLE: Keep system prompts MINIMAL by breaking detailed content into separate skill files.**

=======================================================================
## WHY CREATE SKILLS

The entire purpose of skills is to **avoid massive system prompts**. Instead of creating a 500+ line system_prompt.md, break it into:

1. **Minimal system_prompt.md** (50-100 lines) - High-level workflow and responsibilities
2. **Detailed skill files** - Specific processes, best practices, examples, templates

**Benefits:**
- ✅ System prompt stays clean and readable
- ✅ Skills are reusable and modular
- ✅ Easier to maintain and update
- ✅ Agent can consult specific skills as needed
- ✅ All skills packaged in `/skills` folder for user

=======================================================================
## WHEN TO CREATE SKILLS

**Create skills for agents with:**
- **Multi-step workflows** that need detailed documentation
- **Platform-specific integrations** (GHL, social media, CRM, etc.)
- **Specialized knowledge** domains (industry-specific processes)
- **Complex decision trees** with conditional logic
- **Best practices** that would clutter the system prompt

**Rule of thumb:** If a process needs more than 20 lines to explain, make it a skill.

=======================================================================
## HANDLING USER-UPLOADED SKILLS

**CRITICAL: Users may upload existing skill files from other agents or sources.**

**Before creating any skill:**
1. **Search Knowledge Base** for existing skill files
2. **Review uploaded content** - All user uploads (except images) are available in KB
3. **Check for duplicates** - Don't create skills that already exist
4. **Avoid overwriting** - If user uploaded a skill, use it as-is or enhance it
5. **Merge when appropriate** - Combine user's skill with your improvements

**If user uploaded skills:**
- ✅ Use their skills as the foundation
- ✅ Fill in any missing skills they didn't provide
- ✅ Enhance their skills if they're incomplete
- ❌ Don't duplicate skills they already provided
- ❌ Don't overwrite their custom content
- ❌ Don't ignore their uploaded files

**Example:**
User uploads: `lead_qualification.md` and `email_templates.md`
- Use their uploaded files as-is
- Create additional skills they didn't provide (e.g., `pipeline_management.md`)
- Don't create your own version of lead qualification or email templates

=======================================================================
## HOW TO IDENTIFY SKILLS

**Analyze the agent's capabilities and break down anything that would make the system prompt too long.**

**Ask yourself:**
1. Does this process have 5+ steps?
2. Does it require platform-specific knowledge?
3. Are there best practices or templates to include?
4. Would explaining this take more than 20 lines?
5. Is this a reusable process the agent will do repeatedly?

If YES to any → Create a skill file.

**Examples of Skill Breakdown:**

*Social Media Agent (4 skills instead of 200-line system prompt):*
1. **Post Creation Workflow** - Step-by-step process for creating posts
2. **Caption & Copywriting** - Best practices, templates, tone guidelines
3. **Content Strategy Design** - Planning, calendars, themes
4. **Platform-Specific Publishing** - Facebook, Instagram, LinkedIn requirements

*Sales Agent (4 skills instead of 250-line system prompt):*
1. **Lead Qualification Process** - BANT framework, scoring, questions
2. **Outreach Message Templates** - Email templates, follow-up sequences
3. **Pipeline Management** - Stage definitions, movement criteria
4. **CRM Integration Guide** - How to update, query, sync data

*Email Marketing Agent (3 skills instead of 180-line system prompt):*
1. **Campaign Creation Workflow** - Design, content, segmentation
2. **Email Copywriting Best Practices** - Subject lines, CTAs, formatting
3. **Analytics & Reporting** - Metrics to track, how to analyze performance

=======================================================================
## SKILL FILE STRUCTURE

```markdown
# [Skill Name]

[Brief description of when to use this skill - 1-2 sentences]

=======================================================================
## [SECTION 1 - Overview/Purpose]

[Detailed explanation of what this skill covers]

=======================================================================
## [SECTION 2 - Process/Workflow]

[Step-by-step instructions or guidelines]

=======================================================================
## [SECTION 3 - Best Practices]

[Tips, recommendations, common pitfalls to avoid]

=======================================================================
## [SECTION 4 - Examples/Templates]

[Concrete examples or templates to follow]

=======================================================================
## [SECTION 5 - Validation/Checklist]

[How to verify the skill was executed correctly]
```

=======================================================================
## SECTION TYPES

### Overview/Purpose
- What this skill covers
- When to use it
- Prerequisites or dependencies
- Expected outcomes

### Process/Workflow
- Numbered step-by-step instructions
- Decision points and conditional logic
- Tool usage at each step
- Data sources and queries

### Best Practices
- Industry standards
- Common mistakes to avoid
- Optimization tips
- Quality guidelines

### Examples/Templates
- Concrete examples
- Message templates
- Code snippets
- Sample outputs

### Validation/Checklist
- Success criteria
- Quality checks
- Error handling
- Completion verification

=======================================================================
## EXAMPLE SKILL FILES

### Example 1: Post Creation Workflow (Social Media Agent)

```markdown
# Post Creation Workflow

Primary orchestration skill for creating, scheduling, or publishing any social media post or story.

=======================================================================
## WHEN TO USE

Consult this skill whenever the user wants to:
- Create a new social media post
- Schedule content for future publishing
- Publish content immediately
- Create stories or reels

=======================================================================
## WORKFLOW STEPS

1. **Gather Requirements**
   - Platform(s): Facebook, Instagram, LinkedIn, etc.
   - Content type: Post, story, reel, carousel
   - Timing: Immediate or scheduled
   - Media: Images, videos, or text-only

2. **Check Knowledge Base**
   - Query brand voice guidelines
   - Retrieve content calendar
   - Check platform-specific requirements

3. **Generate Content**
   - Create caption using Caption & Copywriting skill
   - Suggest hashtags (3-5 relevant)
   - Recommend mentions if applicable

4. **Handle Media**
   - Accept uploaded images/videos
   - Verify file formats and sizes
   - Resize if needed for platform

5. **Preview & Confirm**
   - Show complete post preview
   - Confirm platform, timing, content
   - Allow edits before publishing

6. **Publish or Schedule**
   - If immediate: Publish via platform API
   - If scheduled: Store in database with timestamp
   - Confirm success and provide post URL

=======================================================================
## PLATFORM REQUIREMENTS

**Facebook:**
- Character limit: 63,206
- Image formats: JPG, PNG, GIF
- Max image size: 8MB
- Video formats: MP4, MOV
- Max video size: 4GB

**Instagram:**
- Character limit: 2,200
- Image formats: JPG, PNG
- Aspect ratios: 1:1, 4:5, 1.91:1
- Video formats: MP4, MOV
- Max video length: 60 seconds (feed), 15 seconds (story)

**LinkedIn:**
- Character limit: 3,000
- Image formats: JPG, PNG, GIF
- Max image size: 5MB
- Video formats: MP4, MOV, AVI
- Max video size: 5GB

=======================================================================
## BEST PRACTICES

1. **Timing** - Schedule posts during peak engagement hours (check analytics)
2. **Hashtags** - Use 3-5 relevant hashtags, avoid spam
3. **CTAs** - Include clear call-to-action when appropriate
4. **Visuals** - Always include image or video for better engagement
5. **Consistency** - Maintain brand voice across all platforms
6. **Testing** - Preview on mobile and desktop before publishing

=======================================================================
## ERROR HANDLING

**API Connection Failed:**
- Save content as draft
- Notify user of connection issue
- Suggest retry or manual posting

**Invalid Media Format:**
- Inform user of platform requirements
- Offer to convert or resize if possible
- Suggest alternative formats

**Scheduling Conflict:**
- Check for posts already scheduled at same time
- Suggest alternative times
- Allow user to override if needed

=======================================================================
## VALIDATION CHECKLIST

Before publishing:
- ✅ Content matches brand voice
- ✅ Media meets platform requirements
- ✅ Hashtags are relevant and appropriate
- ✅ Timing is optimal for audience
- ✅ All links are valid and trackable
- ✅ User has approved final content
```

### Example 2: Lead Qualification Process (Sales Agent)

```markdown
# Lead Qualification Process

Systematic approach to scoring and qualifying incoming sales leads using BANT framework.

=======================================================================
## WHEN TO USE

Use this skill when:
- New lead enters the system
- User asks to qualify a prospect
- Lead scoring is needed for prioritization
- Determining if lead should be pursued

=======================================================================
## BANT FRAMEWORK

**B - Budget:** Does the prospect have budget?
**A - Authority:** Is the contact a decision-maker?
**N - Need:** Do they have a clear need for the solution?
**T - Timeline:** When do they plan to make a decision?

=======================================================================
## QUALIFICATION WORKFLOW

1. **Gather Lead Information**
   - Company name and size
   - Contact name and title
   - Industry and location
   - How they found us

2. **Research Company**
   - Look up company on LinkedIn
   - Check company website
   - Review recent news or funding
   - Identify key decision-makers

3. **Score BANT Criteria**
   
   **Budget (0-25 points):**
   - 25: Budget confirmed and allocated
   - 15: Budget likely based on company size
   - 5: Budget uncertain
   - 0: No budget or too small
   
   **Authority (0-25 points):**
   - 25: C-level or VP
   - 15: Director or Manager
   - 5: Individual contributor
   - 0: Unknown or intern
   
   **Need (0-25 points):**
   - 25: Urgent, critical need
   - 15: Clear need, not urgent
   - 5: Potential need
   - 0: No clear need
   
   **Timeline (0-25 points):**
   - 25: Buying within 30 days
   - 15: Buying within 90 days
   - 5: Buying within 6 months
   - 0: No timeline or 6+ months

4. **Calculate Total Score**
   - 75-100: Hot lead (immediate follow-up)
   - 50-74: Warm lead (follow-up within 48 hours)
   - 25-49: Cold lead (nurture campaign)
   - 0-24: Disqualify or long-term nurture

5. **Assign Next Steps**
   - Hot: Schedule demo or call
   - Warm: Send personalized email
   - Cold: Add to nurture sequence
   - Disqualified: Archive or mark as unqualified

6. **Update CRM**
   - Log qualification score
   - Add notes and research findings
   - Set follow-up reminders
   - Assign to appropriate sales rep

=======================================================================
## QUALIFICATION QUESTIONS

**Budget Questions:**
- "What's your budget range for this solution?"
- "Have you allocated budget for this initiative?"
- "What's your typical investment for similar tools?"

**Authority Questions:**
- "Who else is involved in this decision?"
- "What's your role in the evaluation process?"
- "Who has final approval authority?"

**Need Questions:**
- "What problem are you trying to solve?"
- "What's the impact of not solving this?"
- "How are you currently handling this?"

**Timeline Questions:**
- "When do you need this implemented?"
- "What's driving your timeline?"
- "Are there any deadlines or events?"

=======================================================================
## BEST PRACTICES

1. **Be Respectful** - Don't interrogate, have a conversation
2. **Listen More** - 70% listening, 30% talking
3. **Take Notes** - Document everything in CRM
4. **Be Honest** - Disqualify if not a good fit
5. **Follow Up** - Set reminders and stick to them
6. **Personalize** - Reference their specific situation

=======================================================================
## VALIDATION CHECKLIST

Before marking lead as qualified:
- ✅ All BANT criteria scored
- ✅ Research completed and documented
- ✅ Next steps clearly defined
- ✅ CRM updated with all information
- ✅ Follow-up scheduled
- ✅ Lead assigned to appropriate rep
```

=======================================================================
## SKILL NAMING CONVENTIONS

**Use Clear, Descriptive Names:**
- ✅ "Post Creation Workflow"
- ✅ "Lead Qualification Process"
- ✅ "Caption & Copywriting Best Practices"
- ✅ "Platform-Specific Publishing Guide"
- ❌ "Skill 1" (not descriptive)
- ❌ "Helper Functions" (too vague)
- ❌ "Misc" (meaningless)

**File Naming Rules:**
- Use **snake_case** for filenames
- Match skill name in lowercase
- Use `.md` extension
- Store in `/skills` folder within agent directory

**Examples:**
- Skill: "Post Creation Workflow" → File: `post_creation_workflow.md`
- Skill: "Lead Qualification Process" → File: `lead_qualification_process.md`
- Skill: "Caption & Copywriting" → File: `caption_copywriting.md`

**Folder Structure:**
```
agent_id/
├── config.yaml
├── system_prompt.md (MINIMAL - 50-100 lines)
└── skills/
    ├── skill_1.md
    ├── skill_2.md
    └── skill_3.md
```

=======================================================================
## PACKAGING & DELIVERY

**All skill files MUST be:**
1. Placed in `/skills` folder within the agent directory
2. Named using snake_case matching the skill name
3. Included in the final zip package sent to the user
4. Referenced in the agent's config.yaml skills section

**Final Package Structure:**
```
agent_package.zip
├── config.yaml
├── system_prompt.md (MINIMAL)
├── n8n_workflow.json
├── README.md
└── skills/
    ├── skill_1.md
    ├── skill_2.md
    └── skill_3.md
```

The user receives ALL files in one compressed package ready for deployment.

=======================================================================
## VALIDATION CHECKLIST

Before finalizing skill files:

**Content Quality:**
- ✅ Skill addresses a specific process (not generic)
- ✅ Structure follows standard template
- ✅ All sections are complete and detailed
- ✅ Examples are concrete and helpful
- ✅ Best practices are actionable
- ✅ Validation checklist is included

**System Prompt Minimization:**
- ✅ System prompt is under 100 lines
- ✅ Detailed processes moved to skills
- ✅ System prompt only contains high-level workflow
- ✅ Skills are referenced in config.yaml

**File Organization:**
- ✅ All skills in `/skills` folder
- ✅ Filenames use snake_case
- ✅ Filenames match skill names
- ✅ Markdown formatting is correct
- ✅ Files use UTF-8 encoding

**Package Completeness:**
- ✅ All skill files will be included in zip package
- ✅ Skills folder structure is correct
- ✅ README mentions skills and how to use them
