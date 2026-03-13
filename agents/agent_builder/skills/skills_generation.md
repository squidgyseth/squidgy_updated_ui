# Skills Generation

Create detailed skill files for complex agents that need specialized knowledge or multi-step processes.

=======================================================================
## SKILL CRITERIA

Create skill files for agents that meet these criteria:
- **Tier 2+** complexity (platform integrated or higher)
- **Multi-step processes** that need detailed documentation
- **Specialized knowledge** domains (industry-specific)
- **Integration-heavy** workflows (multiple APIs, platforms)
- **Complex decision trees** with conditional logic

**Skip skills for:**
- Simple conversational agents (Tier 1)
- Agents with straightforward workflows
- General-purpose assistants

=======================================================================
## SKILL IDENTIFICATION

Analyze agent capabilities to identify skill candidates:

**Good Skill Candidates:**
- Multi-step workflows (5+ steps)
- Platform-specific integrations (GHL, social media, CRM)
- Domain expertise (solar calculations, financial analysis)
- Content creation processes (copywriting, design)
- Data analysis workflows
- Compliance or regulatory processes

**Examples:**

*Social Media Agent → Skills:*
1. Post Creation Workflow
2. Caption & Copywriting
3. Content Strategy Design
4. Platform-Specific Publishing

*Sales Agent → Skills:*
1. Lead Qualification Process
2. Outreach Message Templates
3. Pipeline Management
4. CRM Integration Guide

*HR Agent → Skills:*
1. Candidate Screening Workflow
2. Onboarding Checklist
3. Interview Question Bank
4. Compliance Guidelines

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
- ✅ "Caption & Copywriting"
- ❌ "Skill 1"
- ❌ "Helper Functions"
- ❌ "Misc"

**File Naming:**
- Use snake_case for filenames
- Match skill name in lowercase
- Examples: `post_creation_workflow.md`, `lead_qualification_process.md`

=======================================================================
## VALIDATION CHECKLIST

Before finalizing skill files:
- ✅ Skill addresses a specific, complex process
- ✅ Structure follows standard template
- ✅ All sections are complete and detailed
- ✅ Examples are concrete and helpful
- ✅ Best practices are actionable
- ✅ Validation checklist is included
- ✅ Markdown formatting is correct
- ✅ File uses UTF-8 encoding
- ✅ Filename matches skill name in snake_case
