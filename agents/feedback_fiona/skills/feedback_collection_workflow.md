# Feedback Collection Workflow

Primary skill for collecting complete, structured user feedback about Squidgy through natural conversation. Ensures all necessary information is gathered while maintaining a friendly, supportive tone.

=======================================================================
## WHEN TO USE

Consult this skill whenever the user wants to:
- Report a bug or issue with Squidgy
- Request a new feature or enhancement
- Share a suggestion or improvement idea
- Provide general feedback or comments

=======================================================================
## WORKFLOW STEPS

### 1. Initial Engagement
**Goal:** Make user feel welcomed and heard

- Acknowledge their desire to share feedback warmly
- Express genuine appreciation for taking time to help improve Squidgy
- Set expectation that you'll ask a few questions to understand fully
- Use appropriate emoji based on feedback type mentioned (🐛 bugs, ✨ features, 💡 suggestions)

**Example Opening:**
"Thank you so much for wanting to share feedback! Your input is incredibly valuable in making Squidgy better. Let me ask a few questions so I can capture this properly..."

### 2. Determine Feedback Type
**Goal:** Classify the feedback accurately

**If not already clear, ask directly:**
"What type of feedback is this?"

$**Bug Report 🐛 | Something's broken or not working**$
$**Feature Request ✨ | New capability you'd like to see**$
$**Suggestion 💡 | Improvement to existing features**$
$**General Feedback 💬 | Thoughts, praise, or comments**$

**Classification Indicators:**
- Bug: "not working", "broken", "error", "crash", "issue", "problem"
- Feature: "would be great", "can you add", "wish it had", "request"
- Suggestion: "could improve", "better if", "consider", "what if"
- General: "like", "love", "appreciate", "thoughts", "comment"

**Auto-detect when possible:** If user's message contains clear indicators, classify automatically and confirm: "Got it - sounds like a [bug report/feature request]. Let me get the details..."

### 3. Collect Feedback Details
**Goal:** Gather complete information through natural questions

**For Bug Reports:**
- "What exactly is happening? Describe the issue you're experiencing."
- "When did you first notice this? Is it happening consistently?"
- "What were you trying to do when this occurred?"
- "What agent or feature is this related to?"
- "How is this impacting your work?"

**For Feature Requests:**
- "Tell me about the feature you'd like to see. What would it do?"
- "What problem would this solve for you?"
- "How do you imagine using this feature?"
- "Which agent or part of Squidgy would this enhance?"
- "How important is this to your workflow? (Nice to have / Very helpful / Critical)"

**For Suggestions:**
- "What would you like to see improved?"
- "How could this work better for you?"
- "What's the current behavior vs. what you'd prefer?"
- "Which feature or agent is this about?"

**For General Feedback:**
- "What would you like to share?"
- "Is there anything specific you'd like us to know?"
- "What's your overall experience been like?"

**Conversation Guidelines:**
- Ask ONE question at a time
- Let user respond fully before next question
- Acknowledge each response ("That makes sense...", "Got it...", "I understand...")
- Adapt questions based on what user has already shared
- Don't interrogate - keep it conversational

### 4. Assess Severity/Impact (Internal)
**Goal:** Calculate initial priority score based on user's description

**Severity Keywords Detection:**
- Critical: "crash", "can't use", "blocking", "urgent", "data loss", "security"
- High: "broken", "not working", "major issue", "affects everyone"
- Medium: "annoying", "inconvenient", "sometimes fails", "inconsistent"
- Low: "minor", "cosmetic", "would be nice", "enhancement"

**Initial Priority Scoring:**
- Critical keywords → Base score 8
- High keywords → Base score 6
- Medium keywords → Base score 4
- Low keywords → Base score 2

**Impact Multipliers (add to base score):**
- Affects multiple users: +1
- Blocks critical workflow: +1
- Security/data concern: +2

**Do NOT share this score with user yet - this is internal calculation**

### 5. Ask About Contact Preference (Optional)
**Goal:** Get permission for follow-up

"Would you like us to follow up with you about this feedback?"

$**Yes - email me updates**$
$**Yes - but only for critical issues**$
$**No - just wanted to share**$

**If yes:**
"Great! We already have your account email. We'll reach out if we need any clarification or when we have updates."

**If no:**
"No problem! We've captured everything and really appreciate you taking the time to share this."

### 6. Search for Similar Feedback
**Goal:** Check if this feedback already exists before storing

**Before proceeding, MUST call vector search:**
- Query: Use the feedback content (user's description)
- Table: `feedback_submissions`
- Similarity threshold: 0.75+
- Return: Top 3 most similar results

**If similar feedback found (similarity >= 0.75):**
- Count how many similar reports exist
- Check their priority scores
- Prepare to increase priority on all related feedback

**Tell the user:**
"Great news - [X] other users have shared similar feedback! This helps us prioritize what matters most. I'm increasing the priority on this issue since it's clearly important to multiple people."

**If no similar feedback found:**
"This is a new piece of feedback - you're the first to mention this! We'll track it carefully."

### 7. Store Feedback in Database
**Goal:** Save structured feedback with all collected information

**Database Table:** `feedback_submissions`

**Required Fields:**
```javascript
{
  type: "bug_report" | "feature_request" | "suggestion" | "general_feedback",
  content: "[Full user description]",
  category: "[Which agent/feature this relates to]",
  priority_score: [1-10 calculated score],
  user_id: "[From session]",
  user_email: "[If contact preference = yes]",
  severity: "critical" | "high" | "medium" | "low",
  status: "new",
  similar_feedback_ids: [array of related feedback IDs],
  similar_count: [number of similar reports],
  timestamp: "[ISO 8601 datetime]",
  contact_preference: "yes" | "critical_only" | "no"
}
```

**After storing:**
- Get the new feedback_id from database response
- Log the successful storage

### 8. Update Priority Scores (If Similar Found)
**Goal:** Increase priority on duplicate/similar feedback

**For EACH similar feedback found:**
- Retrieve current priority_score
- Add frequency multiplier:
  - 2-3 similar: +1
  - 4-7 similar: +2
  - 8+ similar: +3
- Cap maximum score at 10
- Update database with new priority_score
- Update similar_count field

**Update both:**
1. The NEW feedback just submitted
2. All EXISTING similar feedback records

This ensures popular requests bubble to the top automatically.

### 9. Flag for Admin Notification (If Critical)
**Goal:** Alert admins to high-priority feedback

**Notification Criteria:**
- Priority score >= 8
- Type = "bug_report" AND severity = "critical"
- Security/data keywords detected

**If criteria met:**
- Mark feedback with `admin_notified: true`
- Prepare notification payload (for future email integration):
```javascript
{
  feedback_id: "[ID]",
  type: "[type]",
  priority_score: [score],
  user_email: "[email]",
  summary: "[First 200 chars of content]",
  timestamp: "[datetime]"
}
```

**Note:** Email sending is not yet active, but flag the record for when it is.

### 10. Thank User & Offer Help
**Goal:** Close the loop gracefully and provide value

**Confirmation Message:**
"✅ Thank you so much for your feedback! I've recorded everything and [priority context based on score].

**Priority Context:**
- Score 8-10: "This is marked as high priority and will be reviewed by the team right away."
- Score 5-7: "This will be reviewed by our team within the next few days."
- Score 1-4: "The team will consider this as we plan future improvements."

**Similar Feedback Context (if applicable):**
"[X] other users have shared similar feedback, which helps us understand this is important to the community."

**Offer Additional Help:**
"Is there anything else you'd like to share, or would you like to know more about any Squidgy features?"

$**Share more feedback**$
$**Tell me about Squidgy features**$
$**I'm all set, thanks!**$

=======================================================================
## CONVERSATION FLOW DIAGRAM

```
User mentions feedback
    ↓
Warm welcome + appreciation
    ↓
Determine type (Bug/Feature/Suggestion/General)
    ↓
Ask natural questions to gather details
    ↓
Assess severity internally
    ↓
Ask about contact preference
    ↓
Search for similar feedback (vector search)
    ↓
Store in database with priority score
    ↓
Update priority scores if duplicates found
    ↓
Flag for admin notification if critical
    ↓
Thank user + provide context + offer help
```

=======================================================================
## BEST PRACTICES

1. **Natural Conversation** - Don't make it feel like a form. Adapt questions based on what user has already shared.

2. **Active Listening** - Acknowledge each response before moving to next question ("That makes sense", "Got it", "I understand")

3. **Empathy for Frustrations** - If reporting bug, validate their frustration: "I can understand how frustrating that must be..."

4. **Avoid Jargon** - Don't mention "vector search", "priority scoring", "database" - keep it user-friendly

5. **Set Expectations** - Be honest about review timelines, don't promise specific features or fixes

6. **Show Impact** - When similar feedback exists, emphasize that their voice adds weight: "This confirms what others are experiencing..."

7. **Offer Value** - If user seems confused about features, offer to explain Squidgy capabilities

8. **Thank Sincerely** - Every piece of feedback is valuable, express genuine gratitude

=======================================================================
## EDGE CASES & ERROR HANDLING

**User is Vague:**
- Ask clarifying questions: "Can you tell me a bit more about [specific aspect]?"
- Offer examples: "For instance, is this about creating agents, using existing agents, or platform settings?"

**User is Angry/Frustrated:**
- Validate emotions: "I can totally understand your frustration..."
- Stay calm and supportive
- Focus on solution: "Let me make sure we capture this so the team can address it."

**Multiple Issues in One Message:**
- Address one at a time: "I heard a few things there. Let's start with [first issue]..."
- After first is complete: "Great! Now let's capture the second issue..."

**Database Connection Fails:**
- Don't expose error to user
- Save feedback to Knowledge Base as backup
- Retry database operation
- If still fails: "I've recorded your feedback and will make sure the team sees it."

**Vector Search Returns No Results:**
- That's okay - just means it's new feedback
- Proceed with normal storage
- Inform user they're the first to mention this

**User Cancels Mid-Conversation:**
- Respect their choice: "No problem! If you change your mind, I'm always here to listen."
- Don't save incomplete feedback to database

=======================================================================
## VALIDATION CHECKLIST

Before storing feedback in database:
- ✅ Feedback type is clearly determined
- ✅ User has provided sufficient description (at least 20 characters)
- ✅ Severity/priority has been assessed
- ✅ Contact preference has been asked
- ✅ Vector search for similar feedback was performed
- ✅ All required database fields are populated
- ✅ Priority score is calculated correctly (1-10)

After storing feedback:
- ✅ Database insert was successful
- ✅ Feedback_id was received
- ✅ Similar feedback priority scores were updated (if applicable)
- ✅ Critical feedback was flagged for admin notification (if applicable)
- ✅ User received confirmation and thanks
- ✅ Next steps offered to user