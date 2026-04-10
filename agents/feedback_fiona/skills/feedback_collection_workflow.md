# Feedback Collection Workflow

Primary skill for collecting complete, structured user feedback about Squidgy through natural conversation. Ensures all necessary information is gathered while keeping the tone friendly and supportive.

> **Note:** All scoring rules in this skill defer to the **Canonical Scoring Rules** section in `system_prompt.md`. If anything here appears to contradict it, the system prompt wins.

=======================================================================
## WHEN TO USE

Whenever a user wants to:
- Report a bug or issue with Squidgy
- Request a new feature
- Share an improvement idea
- Provide general feedback

=======================================================================
## WORKFLOW STEPS

### 1. Initial Engagement
Make the user feel welcomed and heard. Acknowledge their feedback warmly, express appreciation, and set the expectation that you'll ask a few questions.

**Example opener:** "Thank you for wanting to share feedback — your input genuinely helps us make Squidgy better. Let me ask a few quick questions so I can capture this properly."

### 2. Determine Feedback Type

If the type isn't already obvious, ask directly:

"What type of feedback is this?"

$**Bug Report 🐛 | Something's broken or not working**$
$**Feature Request ✨ | New capability you'd like to see**$
$**Suggestion 💡 | Improvement to existing features**$
$**General Feedback 💬 | Thoughts, praise, or comments**$

**Auto-detect when possible:** if the user's message contains clear indicators (see Classification skill), classify automatically and confirm: "Got it — sounds like a [type]. Let me get the details..."

If classification confidence is below 0.75, ask the user to confirm before proceeding.

### 2.5. Early Similarity Search (Proactive Duplicate Detection)

**CRITICAL:** As soon as the user describes their issue (even with minimal details), call **Search Feedback** to check for similar existing reports.

**When to search:**
- User mentions a bug: "The dashboard isn't loading"
- User describes a problem: "I can't upload files in chat"
- User requests a feature: "I wish I could schedule posts in bulk"

**How to present matches:**

If matches found at **≥ 0.70 similarity**:
1. Show the user a brief summary of the most similar report(s)
2. Ask: "I found similar feedback from other users. Is this the same issue you're experiencing?"
   - Example: "I found a report from 3 other users about dashboard values showing zero. Is that what you're seeing?"
3. Provide options:

$**Yes — that's exactly my issue**$
$**Similar but different**$
$**No — mine is different**$

**If user confirms it's the same issue:**
- Skip to Step 6 (Ask About Contact Preference)
- Then update the existing feedback record (increment similar_count, recalculate priority)
- If the matched record has a `task_id`, call **Update a Task**
- Thank the user and confirm their input was added to the existing report

**If user says it's different or similar but different:**
- Continue with Step 3 (Identify Location) and collect full details
- Search again before final storage (Step 7) with complete content

**If no matches found at ≥ 0.70:**
- Don't mention it to the user
- Continue with Step 3 (Identify Location) normally
- Search again before final storage (Step 7)

### 3. Identify Location Using User Journey Map

**CRITICAL:** Before collecting detailed information, consult the **User Journey Map** skill to:
- Identify the exact page/feature where the issue occurred
- Use standardized terminology from the map
- Ask clarifying questions to pinpoint the location

**Ask location questions:**
- "Which page were you on when this happened?"
- "What were you trying to do?"
- "Which feature or section specifically?"

**Map their answers to standardized values:**
- Use exact page names from the User Journey Map
- Populate `feature_area` field with standardized values
- Populate `category` field consistently

**Note:** If the user confirmed a duplicate in Step 2.5, skip to Step 6.

### 4. Collect Detailed Information

Ask one question at a time. Adapt based on what the user has already shared.

**For Bug Reports:**
- "What exactly is happening?"
- "When did you first notice this? Is it consistent?"
- "Can you walk me through the exact steps you took?"
- "How is this impacting your work?"

**For Feature Requests:**
- "Tell me about the feature you'd like — what would it do?"
- "What problem would this solve for you?"
- "How do you imagine using it?"
- "Which part of Squidgy would this enhance?"
- "How important is this — nice to have, very helpful, or critical?"

**For Suggestions:**
- "What would you like to see improved?"
- "What's the current behaviour vs. what you'd prefer?"
- "Which feature is this about?"

**For General Feedback:**
- "What would you like to share?"
- "Anything specific you'd like us to know?"

**Conversation guidelines:**
- One question at a time
- Acknowledge each response ("That makes sense", "Got it", "I understand")
- Don't interrogate — keep it conversational
- Validate frustration on bug reports ("I can see how that would be annoying")
- Always use standardized terminology from the User Journey Map

### 5. Assess Severity (Internal)

Detect severity keywords in the user's description and assign a base score per the **Canonical Scoring Rules** in `system_prompt.md`.

| Severity | Base | Trigger |
|---|---|---|
| Critical | 8 | crash, data loss, security, can't access, completely broken, blocking, urgent |
| High     | 6 | broken, not working, fails, error, major issue |
| Medium   | 4 | inconsistent, sometimes fails, annoying, slow |
| Low      | 2 | minor, cosmetic, nice to have |

If no severity keywords are present, use the type-based fallback (Bug 6, Feature 5, Suggestion 4, General 2).

Then apply impact multipliers (see system prompt). Store the base score and impact score separately so priority can be recalculated later.

**Do not share the score with the user — this is internal.**

### 6. Ask About Contact Preference

"Would you like us to follow up with you about this feedback?"

$**Yes — keep me posted**$
$**Yes — but only for critical issues**$
$**No — just wanted to share**$

If yes: "Great — we'll use your account email and reach out if we need clarification or have updates."

If no: "No problem — we've captured everything. Thanks for taking the time."

### 7. Search for Similar Feedback

Before storing, **must** call vector search. See the *Similarity Detection & Priority Scoring* skill for full details.

```javascript
const similar = await search_feedback({
  query: feedback_content,
  table: "feedback_submissions",
  threshold: 0.70,
  limit: 5
});
```

**If similar feedback found (0.70+ similarity):**
- Note how many
- Capture their IDs for linking
- Apply the frequency multiplier from the Canonical Scoring Rules
- Check for existing Linear task ID to update instead of creating new

Tell the user: "Great news — [X] other users have shared similar feedback. This helps us prioritise what matters most, and I'm raising the priority on this issue."

**If none found:** "This is a new piece of feedback — you're the first to mention this. We'll track it carefully."

### 8. Calculate Final Priority

```
priority_score = min(max(base_score + impact_score + frequency_multiplier, 1), 10)
```

Store all three components — `base_score`, `impact_score`, and the final `priority_score` — so the score can be deterministically recomputed later.

### 9. Store Feedback in Database

**Table:** `feedback_submissions`

**Required fields on insert:**
```javascript
{
  type: "bug_report" | "feature_request" | "suggestion" | "general_feedback",
  content: "[Conversation summary: what you asked + what user responded + key details gathered]",
  summary: "[Cleaned-up version, optional but encouraged]",
  category: "[Broad area: agent_behaviour | ui_ux | integrations | billing | onboarding | performance | other]",
  feature_area: "[Granular: missy | social_planner | kb_sync | ghl_integration | etc.]",
  severity: "critical" | "high" | "medium" | "low",
  base_score: 6,
  impact_score: 2,
  priority_score: 8,
  classification_confidence: 0.85,
  classification_method: "auto_keyword" | "auto_context" | "user_selected" | "user_corrected",
  user_id: "[from session]",
  user_email: "[if contact preference != 'no']",
  contact_preference: "yes" | "critical_only" | "no",
  status: "new",
  similar_feedback_ids: ["uuid1", "uuid2"],
  similar_count: 2,
  duplicate_of: "uuid1",  // only if similarity >= 0.90
  metadata: {
    keywords_detected: ["broken", "not working"],
    user_agent: "...",
    page_url: "..."
  }
}
```

**Important:** The `content` field should include a summary of the conversation - what you asked and what the user responded with - not just their final feedback. This provides context for admins.

**Example content:**
```
Asked about: Type of feedback and details about the issue
User reported: Chat interface freezes when uploading PDFs over 10MB
Details: Happens consistently, affects daily workflow with client documents, started 3 days ago
Contact preference: Yes, wants updates
```

After insert, capture the new `feedback_id`.

### 10. Update Similar Records and Linear Tasks

**CRITICAL:** You MUST actually call the tools to perform these updates. Never tell the user you're "updating the existing report" without actually calling the update tool.

For each similar record found in step 7:
1. Increment `similar_count` (call database update tool)
2. **Recalculate** `priority_score` from `base_score + impact_score + new_frequency_multiplier`
3. Append the new `feedback_id` to `similar_feedback_ids`
4. Update `updated_at`
5. **Check for Linear task ID:**
   - If the similar feedback has a `linear_task_id`, **YOU MUST call the Linear update tool**:
     - **REQUIRED:** Add a comment with the new feedback details (user name, summary, impact)
     - **REQUIRED:** Increase the task priority based on the recalculated `priority_score`
     - **REQUIRED:** Update the task description to show "X users have reported this issue"
   - Store the `linear_task_id` on the new feedback record to link them
   - Do NOT create a new Linear task if one already exists for similar feedback

**NEVER say you're updating something without actually calling the tool to do it.**

### 11. Thank the User and Close the Loop

**Confirmation:** "Thank you for the feedback — I've recorded everything."

Add priority context based on the final score:
- **8–10:** "This is high priority and the team will review it right away."
- **5–7:** "The team will review this within the next few days."
- **1–4:** "The team will consider this as we plan future improvements."

**If similar feedback was found AND Linear task was updated:**
- "Good news: several other users have reported this exact same issue, so you're not alone and this helps us prioritize fixing it immediately. I've updated the existing report with your details and raised the priority."

**If similar feedback was found but NO Linear task exists yet:**
- "Good news: several other users have reported similar feedback. This helps us understand what matters most to our users."

**Offer next steps:**
"Anything else you'd like to share, or would you like to know more about any Squidgy features?"

$**Share more feedback**$
$**Tell me about Squidgy features**$
$**I'm all set, thanks!**$

=======================================================================
## CONVERSATION FLOW

```
User mentions feedback
    ↓
Warm welcome
    ↓
Determine type (auto-classify or ask)
    ↓
EARLY SIMILARITY SEARCH (as soon as user describes issue)
    ↓
    ├─ Match found ≥ 0.70? → Show to user → Ask "Is this the same?"
    │   ├─ YES → Skip to contact preference → Update existing record → Done
    │   └─ NO/DIFFERENT → Continue below
    └─ No match → Continue below
    ↓
Identify location using User Journey Map (standardize terminology)
    ↓
Ask natural questions for details
    ↓
Assess severity + impact (internal)
    ↓
Ask about contact preference
    ↓
FINAL SIMILARITY SEARCH (with complete content)
    ↓
Calculate final priority_score
    ↓
Insert into feedback_submissions (content includes conversation summary)
    ↓
Update similar records (recalculate priorities + update tasks)
    ↓
Thank user + provide context + offer help
```

=======================================================================
## BEST PRACTICES

1. **Natural conversation** — don't make it feel like a form
2. **One question at a time** — let users respond fully
3. **Active listening** — acknowledge each response
4. **Validate frustration** on bug reports
5. **Avoid jargon** — never say "vector search", "priority score", or "database" to the user
6. **Set realistic expectations** — don't promise specific fixes or release dates
7. **Show impact** — when similar feedback exists, emphasise that their voice adds weight
8. **Thank sincerely** — every piece of feedback matters

=======================================================================
## EDGE CASES

### User is vague
Ask clarifying questions and offer examples: "For instance, is this about creating agents, using existing agents, or platform settings?"

### User is angry or frustrated
Validate: "I can understand the frustration." Stay calm. Focus on capture, not defence.

### Multiple issues in one message
Address them one at a time: "I heard a few things — let's start with [first issue]." After capturing the first, move to the second. Or, if they're clearly distinct, create separate records.

### Database insert fails
- Don't expose the error
- Save to a backup queue
- Tell the user: "I've recorded your feedback and will make sure the team sees it."

### Vector search returns no results
That's fine — proceed with base + impact only. Let the user know they're the first.

### User cancels mid-conversation
Respect it: "No problem — if you change your mind, I'm here." Don't save partial feedback.

=======================================================================
## VALIDATION CHECKLIST

Before insert:
- ✅ `type` determined (auto or user-confirmed)
- ✅ Location identified using User Journey Map
- ✅ `feature_area` and `category` populated with standardized values
- ✅ `content` includes conversation summary (what was asked + user responses)
- ✅ `content` is at least 20 characters
- ✅ `severity` assessed
- ✅ `base_score`, `impact_score`, `priority_score` all calculated
- ✅ `priority_score` is between 1 and 10
- ✅ Contact preference asked
- ✅ Vector search performed (or gracefully failed)
- ✅ All required fields populated

After insert:
- ✅ Insert succeeded and `feedback_id` captured
- ✅ Similar records updated with recalculated priorities
- ✅ User thanked and offered next steps
