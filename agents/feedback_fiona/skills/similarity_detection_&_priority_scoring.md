# Similarity Detection & Priority Scoring

Automatically search existing feedback database for duplicate or similar reports, calculate priority scores based on frequency and severity, and ensure popular requests get appropriate attention.

=======================================================================
## WHEN TO USE

Use this skill:
- Before storing new feedback in database
- After collecting complete feedback details from user
- To calculate initial and adjusted priority scores
- To identify duplicate or related feedback submissions

=======================================================================
## WHY THIS MATTERS

**Priority scoring helps the admin team:**
- Focus on issues affecting multiple users
- Identify most-requested features quickly
- Allocate resources to high-impact items
- Track which problems are most common

**Users benefit because:**
- Their feedback adds weight to existing requests
- They see their voice contributes to prioritization
- Popular features get built faster
- Common bugs get fixed sooner

=======================================================================
## VECTOR SEARCH FOR SIMILARITY

### Search Configuration

**Database Table:** `feedback_submissions`
**Search Method:** Semantic vector search (embeddings-based)
**Similarity Threshold:** 0.75 or higher (75% similarity)
**Return Limit:** Top 5 most similar results

### Query Preparation

**Use the user's feedback content as the search query:**
- Include the full description they provided
- Do NOT search by single keywords only
- Semantic search understands context and meaning

**Example:**
```javascript
// Good query (full context)
query: "The chat interface freezes when I try to upload large PDF files over 10MB. It shows a loading spinner but never completes."

// Bad query (too vague)
query: "upload freeze"
```

### Executing the Search

**Before storing new feedback, MUST search first:**

```javascript
// Call vector search tool
search_feedback({
  query: feedback_content,
  table: "feedback_submissions",
  threshold: 0.75,
  limit: 5
})
```

**Response Structure:**
```javascript
[
  {
    feedback_id: "uuid",
    content: "Similar feedback description",
    type: "bug_report",
    priority_score: 6,
    similarity_score: 0.89,
    similar_count: 3,
    created_at: "2024-01-15T10:30:00Z"
  },
  // ... up to 5 results
]
```

### Interpreting Results

**Similarity Score Ranges:**
- **0.90 - 1.00:** Nearly identical (likely duplicate)
- **0.80 - 0.89:** Very similar (same issue, different wording)
- **0.75 - 0.79:** Related (similar topic, possibly different aspect)
- **Below 0.75:** Not similar enough (treat as unique)

**What to do with results:**
- If 1+ results >= 0.75: Similar feedback exists
- If 0 results >= 0.75: This is new/unique feedback
- Store similar feedback_ids for linking

=======================================================================
## PRIORITY SCORING SYSTEM

### Initial Priority Calculation

**Base Score (1-10) determined by:**

#### Severity Keywords Detection

**Critical (Base Score: 8-9)**
Keywords: crash, data loss, security, can't access, completely broken, unable to use, blocking, urgent, critical

Impact: System unusable or data at risk

**High (Base Score: 6-7)**
Keywords: broken, not working, fails, error, major issue, significant problem, always fails

Impact: Feature unusable but workarounds may exist

**Medium (Base Score: 4-5)**
Keywords: inconsistent, sometimes fails, annoying, inconvenient, slow, should work better

Impact: Feature works but with issues

**Low (Base Score: 2-3)**
Keywords: minor, cosmetic, nice to have, suggestion, improve, enhance, could be better

Impact: Improvement rather than fix

#### Feedback Type Adjustment

- **Bug Report:** Use severity keywords for score
- **Feature Request:** Start at 5, adjust based on urgency language
- **Suggestion:** Start at 4, adjust based on impact described
- **General Feedback:** Start at 2 (informational)

#### Impact Multipliers (Add to Base)

**User Impact:**
- Affects all users: +2
- Affects specific user group: +1
- Affects individual: +0

**Workflow Impact:**
- Blocks critical workflow: +2
- Impacts important workflow: +1
- Minor inconvenience: +0

**Data/Security:**
- Security vulnerability: +3
- Data loss risk: +2
- Data integrity concern: +1

**Example Calculation:**
```
Base: "not working" = 6 (High severity)
+ Affects all users = +2
+ Blocks critical workflow = +2
= Initial Score: 10 (capped at 10)
```

### Frequency-Based Priority Adjustment

**When similar feedback is found, increase priority:**

#### Frequency Multiplier Rules

**Similar Feedback Count:** How many reports >= 0.75 similarity

- **First report (0 similar):** Score = Base score
- **2-3 similar reports:** Add +1 to score
- **4-7 similar reports:** Add +2 to score
- **8-15 similar reports:** Add +3 to score
- **16+ similar reports:** Add +4 to score

**Maximum score is capped at 10**

#### Example Adjustments

**Scenario 1: New Bug Report**
- Base severity score: 6 (High)
- Similar feedback found: 2 reports
- Frequency adjustment: +1
- **Final priority_score: 7**

**Scenario 2: Popular Feature Request**
- Base score: 5 (Feature request)
- Similar feedback found: 12 reports
- Frequency adjustment: +3
- **Final priority_score: 8**

**Scenario 3: Critical Bug Affecting Many**
- Base severity score: 8 (Critical)
- User impact: +2
- Similar feedback found: 5 reports
- Frequency adjustment: +2
- Calculation: 8 + 2 + 2 = 12 → **Capped at 10**

### Updating Existing Feedback Scores

**When new similar feedback is submitted:**

1. **Retrieve all similar feedback records** (similarity >= 0.75)
2. **Increment similar_count** for each existing record
3. **Recalculate priority_score** using new similar_count
4. **Update database** with new scores

**Example Database Update:**
```javascript
// For each similar feedback found
{
  feedback_id: existing_feedback_id,
  similar_count: old_count + 1,
  priority_score: recalculated_score,
  updated_at: current_timestamp
}
```

**Why this matters:**
- Ensures popular issues stay at top of list
- Reflects growing demand automatically
- Admin sees real-time prioritization

=======================================================================
## LINKING RELATED FEEDBACK

### Creating Feedback Relationships

**Store bidirectional links between similar feedback:**

**New Feedback Record:**
```javascript
{
  feedback_id: "new-uuid",
  content: "User's feedback",
  priority_score: 7,
  similar_feedback_ids: ["existing-uuid-1", "existing-uuid-2"],
  similar_count: 2,
  // ... other fields
}
```

**Update Existing Feedback:**
```javascript
// For each similar feedback found
{
  feedback_id: "existing-uuid-1",
  similar_feedback_ids: [...old_ids, "new-uuid"],
  similar_count: old_count + 1,
  priority_score: recalculated_score
}
```

### Benefits of Linking

1. **Admin Dashboard:** Can view all related feedback together
2. **User Transparency:** Show users their feedback is part of larger trend
3. **Resolution Tracking:** When one is fixed, all related can be updated
4. **Analytics:** Understand which issues are most common

=======================================================================
## WORKFLOW IMPLEMENTATION

### Complete Similarity Detection Process

**Step 1: Collect Feedback**
- User provides complete feedback description
- Type, severity, and details are gathered
- Calculate initial base priority score

**Step 2: Execute Vector Search**
```javascript
const similarFeedback = await search_feedback({
  query: feedback_content,
  table: "feedback_submissions",
  threshold: 0.75,
  limit: 5
});
```

**Step 3: Analyze Results**
```javascript
const similarCount = similarFeedback.length;
const similarIds = similarFeedback.map(f => f.feedback_id);

// Check if truly duplicate (similarity >= 0.90)
const isDuplicate = similarFeedback.some(f => f.similarity_score >= 0.90);
```

**Step 4: Calculate Adjusted Priority**
```javascript
let priorityScore = baseScore; // From initial severity assessment

// Add frequency multiplier
if (similarCount >= 16) priorityScore += 4;
else if (similarCount >= 8) priorityScore += 3;
else if (similarCount >= 4) priorityScore += 2;
else if (similarCount >= 2) priorityScore += 1;

// Cap at 10
priorityScore = Math.min(priorityScore, 10);
```

**Step 5: Inform User**
```javascript
if (similarCount > 0) {
  message = `Great news - ${similarCount} other users have shared similar feedback! This helps us prioritize what matters most. I'm increasing the priority on this issue.`;
} else {
  message = `This is a new piece of feedback - you're the first to mention this! We'll track it carefully.`;
}
```

**Step 6: Store New Feedback**
```javascript
const newFeedback = {
  type: feedback_type,
  content: feedback_content,
  priority_score: priorityScore,
  similar_feedback_ids: similarIds,
  similar_count: similarCount,
  user_id: user_id,
  timestamp: new Date().toISOString(),
  // ... other fields
};

await database.insert('feedback_submissions', newFeedback);
```

**Step 7: Update Existing Similar Feedback**
```javascript
for (const similar of similarFeedback) {
  const newSimilarCount = similar.similar_count + 1;
  const newPriorityScore = recalculatePriority(similar.priority_score, newSimilarCount);
  
  await database.update('feedback_submissions', {
    feedback_id: similar.feedback_id,
    similar_count: newSimilarCount,
    priority_score: newPriorityScore,
    similar_feedback_ids: [...similar.similar_feedback_ids, newFeedback.feedback_id],
    updated_at: new Date().toISOString()
  });
}
```

=======================================================================
## PRIORITY SCORE MEANINGS

### Score Interpretation for Admin Dashboard

**10 (Maximum Priority)**
- Critical bugs affecting multiple users
- Highly requested features (10+ users)
- Security vulnerabilities
- **Action:** Immediate attention required

**8-9 (High Priority)**
- Major bugs with workarounds
- Popular feature requests (5-9 users)
- Significant workflow blockers
- **Action:** Address within 24-48 hours

**5-7 (Medium Priority)**
- Minor bugs or inconsistent issues
- Valuable feature requests (2-4 users)
- Workflow improvements
- **Action:** Review within 1 week

**3-4 (Low Priority)**
- Cosmetic issues
- Nice-to-have features
- Minor enhancements
- **Action:** Consider for future releases

**1-2 (Informational)**
- General feedback
- Praise or comments
- Questions answered elsewhere
- **Action:** Acknowledge and archive

=======================================================================
## BEST PRACTICES

### Search Quality

1. **Use Full Context** - Search with complete user description, not keywords
2. **Trust the Algorithm** - Semantic search understands meaning, not just exact words
3. **Set Proper Threshold** - 0.75 is sweet spot (too low = false matches, too high = miss duplicates)

### Priority Calculation

1. **Be Consistent** - Apply same rules to all feedback types
2. **Cap Scores** - Never exceed 10, maintains meaningful scale
3. **Recalculate When Needed** - Update scores as new similar feedback arrives
4. **Consider Context** - Bug affecting 100-user feature vs. rarely-used feature

### User Communication

1. **Positive Framing** - "Great news - others agree!" not "This is a duplicate"
2. **Show Impact** - Explain how their feedback increases priority
3. **Set Expectations** - Higher score doesn't guarantee immediate fix, but faster review
4. **Thank Regardless** - Even if duplicate, their voice matters

### Database Maintenance

1. **Keep Links Updated** - Bidirectional relationships for easier querying
2. **Track Timestamps** - Know when feedback came in and was updated
3. **Archive Resolved** - Mark feedback as resolved when feature ships/bug fixed
4. **Regular Cleanup** - Periodically review and consolidate extremely similar items

=======================================================================
## ERROR HANDLING

### Vector Search Fails
**Scenario:** Database connection error, search timeout

**Action:**
- Proceed with base priority score only
- Do NOT block feedback submission
- Set similar_count to 0
- Log error for investigation
- Still store feedback successfully

**User Message:**
"I've recorded your feedback with [base priority level]. Thank you!"

### Similarity Calculation Errors
**Scenario:** Malformed search results, missing fields

**Action:**
- Treat as no similar feedback found
- Use base score only
- Store new feedback normally
- Log warning for review

### Priority Score Out of Range
**Scenario:** Calculation bug produces score > 10 or < 1

**Action:**
- Cap at 10 if too high
- Floor at 1 if too low
- Log the anomaly
- Continue normal flow

### Database Update Fails for Similar Feedback
**Scenario:** Can update new feedback but not existing ones

**Action:**
- New feedback still stored successfully
- Retry updates for existing feedback
- If still fails, queue for later processing
- Don't expose error to user

=======================================================================
## VALIDATION CHECKLIST

Before storing feedback with priority score:
- ✅ Vector search was executed (or gracefully failed)
- ✅ Base priority score is between 1-10
- ✅ Frequency multiplier applied correctly
- ✅ Final score is capped at 10
- ✅ Similar feedback IDs are stored (if any found)
- ✅ Similar count is accurate
- ✅ User received appropriate message about similarity

After storing and updating:
- ✅ New feedback record created successfully
- ✅ All similar feedback records updated with new count and scores
- ✅ Bidirectional links established
- ✅ Timestamps updated correctly
- ✅ Critical feedback flagged if score >= 8