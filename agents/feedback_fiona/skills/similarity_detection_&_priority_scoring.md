# Similarity Detection & Priority Scoring

Search the existing feedback database for duplicate or related reports, calculate priority scores, and ensure popular requests bubble up automatically.

> **Note:** All scoring rules in this skill defer to the **Canonical Scoring Rules** section in `system_prompt.md`. If anything here appears to contradict it, the system prompt wins.

=======================================================================
## WHEN TO USE

- Before storing new feedback in the database
- After collecting complete feedback details from the user
- To calculate the initial and adjusted `priority_score`
- To identify duplicates and link related feedback

=======================================================================
## WHY THIS MATTERS

**For the admin team:** focus on issues affecting many users, identify popular feature requests, allocate resources by impact.

**For users:** their feedback adds weight to existing requests, popular items get built faster, common bugs get fixed sooner.

=======================================================================
## VECTOR SEARCH FOR SIMILARITY

### Configuration

| Setting | Value |
|---|---|
| Table | `feedback_submissions` |
| Column | `embedding` (vector(1536), pgvector) |
| Distance metric | Cosine similarity |
| Related threshold | **0.75** |
| Near-duplicate threshold | **0.90** |
| Result limit | 5 |

### Query Preparation

Use the user's full feedback content as the search query, not single keywords. Semantic search relies on context.

```javascript
// ✅ Good — full context
query: "The chat interface freezes when I try to upload large PDF files over 10MB. It shows a loading spinner but never completes."

// ❌ Bad — too sparse
query: "upload freeze"
```

### Executing the Search

```javascript
const similarFeedback = await search_feedback({
  query: feedback_content,
  table: "feedback_submissions",
  threshold: 0.75,
  limit: 5
});
```

**Response shape:**
```javascript
[
  {
    feedback_id: "uuid",
    content: "Similar feedback description",
    type: "bug_report",
    priority_score: 6,
    base_score: 6,
    similarity_score: 0.89,
    similar_count: 3,
    created_at: "2026-01-15T10:30:00Z"
  }
  // up to 5 results
]
```

### Interpreting Similarity Scores

| Range | Meaning |
|---|---|
| 0.90 – 1.00 | Near-duplicate — set `duplicate_of` on the new record |
| 0.80 – 0.89 | Same issue, different wording — link as related |
| 0.75 – 0.79 | Related (same topic, possibly different aspect) — link as related |
| Below 0.75 | Not similar — treat as unique |

=======================================================================
## PRIORITY SCORING

All scoring follows the **Canonical Scoring Rules** in `system_prompt.md`. The full reference is duplicated here for convenience but the system prompt is authoritative.

### Step 1 — Base Score from Severity

| Severity | Base | Trigger keywords |
|---|---|---|
| Critical | **8** | crash, data loss, security, can't access, completely broken, blocking, urgent |
| High     | **6** | broken, not working, fails, error, major issue, always fails |
| Medium   | **4** | inconsistent, sometimes fails, annoying, slow, inconvenient |
| Low      | **2** | minor, cosmetic, nice to have, enhancement |

### Step 2 — Fallback Base Score from Type (only if no severity keywords)

| Type | Base |
|---|---|
| Bug Report       | 6 |
| Feature Request  | 5 |
| Suggestion       | 4 |
| General Feedback | 2 |

### Step 3 — Impact Multipliers

| Condition | Add |
|---|---|
| Affects all users | +2 |
| Affects a specific user group | +1 |
| Blocks a critical workflow | +2 |
| Impacts an important workflow | +1 |
| Security vulnerability | +3 |
| Data loss risk | +2 |
| Data integrity concern | +1 |

### Step 4 — Frequency Multiplier (after similarity search)

| Similar reports found | Add |
|---|---|
| 0 | +0 |
| 2–3 | +1 |
| 4–7 | +2 |
| 8–15 | +3 |
| 16+ | +4 |

### Step 5 — Cap

```javascript
final_priority = Math.min(Math.max(base + impact + frequency, 1), 10);
```

### Worked Examples

**Scenario 1 — New, isolated bug**
- Severity = High → base 6
- No impact multipliers
- 0 similar reports → +0
- **Final: 6**

**Scenario 2 — Popular feature request**
- No severity → use type fallback: Feature Request = base 5
- Affects all users → +2
- 12 similar reports → +3
- 5 + 2 + 3 = 10 → **Final: 10**

**Scenario 3 — Critical security bug, several reports**
- Severity = Critical → base 8
- Security vulnerability → +3
- 5 similar reports → +2
- 8 + 3 + 2 = 13 → capped → **Final: 10**

=======================================================================
## RECALCULATING EXISTING FEEDBACK

When a new similar item arrives, **recalculate** existing scores rather than incrementing them. This keeps history correct if the rules ever change.

```javascript
function recalculatePriority(record, newSimilarCount) {
  const base       = record.base_score;            // stored, never recalculated
  const impact     = record.impact_score || 0;     // stored alongside base
  const frequency  = frequencyMultiplier(newSimilarCount);
  return Math.min(Math.max(base + impact + frequency, 1), 10);
}

function frequencyMultiplier(count) {
  if (count >= 16) return 4;
  if (count >= 8)  return 3;
  if (count >= 4)  return 2;
  if (count >= 2)  return 1;
  return 0;
}
```

**Why store `base_score` and `impact_score` separately from `priority_score`:** the priority field changes over time as similar reports arrive, but base and impact don't. Storing them lets Fiona recompute deterministically without re-analysing the original content.

=======================================================================
## LINKING RELATED FEEDBACK

When similar feedback is found, store bidirectional links.

### On the new record

```javascript
{
  feedback_id: "new-uuid",
  similar_feedback_ids: ["existing-uuid-1", "existing-uuid-2"],
  similar_count: 2,
  duplicate_of: "existing-uuid-1"  // only if similarity >= 0.90
}
```

### On each existing similar record

```javascript
{
  feedback_id: "existing-uuid-1",
  similar_feedback_ids: [...old_ids, "new-uuid"],
  similar_count: old_count + 1,
  priority_score: recalculatePriority(record, old_count + 1),
  updated_at: now()
}
```

### Benefits

1. Admin dashboards can group related feedback
2. Users see their voice contributes to a tracked trend
3. Resolving one record can resolve all linked ones
4. Analytics reveal the most common issues

=======================================================================
## COMPLETE WORKFLOW

```
1. Feedback collected (type, content, severity, impact known)
2. Calculate base_score (from severity, fallback to type)
3. Calculate impact_score (from impact multipliers)
4. Vector search for similar feedback (threshold 0.75)
5. Calculate frequency multiplier from result count
6. Calculate priority_score = min(max(base + impact + frequency, 1), 10)
7. Insert new row with base_score, impact_score, priority_score
8. For each similar record found:
     - Increment similar_count
     - Recalculate priority_score
     - Append new feedback_id to similar_feedback_ids
     - Update updated_at
9. If priority_score >= 8 → set admin_notified = true
10. Confirm to user (with similar-feedback context if applicable)
```

=======================================================================
## PRIORITY LEVEL MEANINGS

| Score | Level | Action by team |
|---|---|---|
| 9–10 | **Critical** | Immediate review, Slack ping, Linear issue created |
| 7–8 | **High** | Review within 24–48 hours |
| 4–6 | **Medium** | Review within 1 week |
| 1–3 | **Low** | Consider for future planning |

=======================================================================
## USER COMMUNICATION

### Similar feedback found
"Great news — [X] other users have shared similar feedback. This helps us prioritise what matters most, and I'm raising the priority on this issue."

### No similar feedback found
"This is a new piece of feedback — you're the first to mention this. We'll track it carefully."

### Never expose
- The actual numerical score
- The phrase "vector search" or "embedding"
- Database errors or table names
- The phrase "duplicate" — use "similar" instead (more positive framing)

=======================================================================
## BEST PRACTICES

### Search Quality
- Always pass full context, not keywords
- Trust the 0.75 threshold — it's the calibrated sweet spot
- Use 0.90 only for true near-duplicate detection (sets `duplicate_of`)

### Priority Calculation
- Apply rules consistently across all feedback types
- Always cap at 10 and floor at 1
- Recalculate, don't increment
- Store `base_score` and `impact_score` for deterministic recomputation

### Database Hygiene
- Keep links bidirectional
- Always update `updated_at` on modified rows
- Mark resolved items with `status = 'resolved'` and a `resolved_at` timestamp
- Periodically review extremely-similar items for consolidation

=======================================================================
## ERROR HANDLING

### Vector search fails
- Proceed with `base_score + impact_score` only
- Set `similar_count = 0`, `similar_feedback_ids = []`
- Log the error to `metadata.search_error = true`
- Still store the feedback successfully — never block submission

### Malformed search results
- Treat as no similar feedback
- Store with base + impact only
- Log warning

### Score out of range
- Cap at 10, floor at 1
- Log the anomaly

### Update fails on existing similar records
- New feedback is still stored successfully
- Queue the failed updates for retry
- Don't expose the error to the user

=======================================================================
## VALIDATION CHECKLIST

Before storing a new feedback row:
- ✅ Vector search executed (or gracefully failed)
- ✅ `base_score` is between 1 and 10
- ✅ `impact_score` is calculated and stored
- ✅ `priority_score` is calculated, capped at 10, floored at 1
- ✅ `similar_feedback_ids` and `similar_count` populated
- ✅ `duplicate_of` set if any similarity ≥ 0.90
- ✅ `admin_notified = true` if `priority_score >= 8`

After storing:
- ✅ New record created
- ✅ All similar records updated with new count and recalculated score
- ✅ Bidirectional links in place
- ✅ Timestamps updated
