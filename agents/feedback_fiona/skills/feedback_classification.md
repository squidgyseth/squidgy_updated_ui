# Feedback Classification

Automatically analyse feedback content and classify it into the correct category with a confidence score. Ensures accurate categorisation for routing, prioritisation, and admin review.

> **Note:** All scoring rules in this skill defer to the **Canonical Scoring Rules** section in `system_prompt.md`. If anything here appears to contradict it, the system prompt wins.

=======================================================================
## WHEN TO USE

- When the user provides feedback without explicitly stating the type
- To validate that a user's stated type matches their content
- During the feedback collection workflow, to auto-detect category
- Before storing feedback in the database

=======================================================================
## FEEDBACK CATEGORIES

### Bug Report 🐛
**Definition:** Something in Squidgy is broken, not working as expected, or producing errors.

**Characteristics:** Describes current negative behaviour, may include error messages, impacts the user's ability to complete tasks.

**Examples:**
- "The chat freezes when I upload files"
- "I'm getting an error when I try to create a new agent"
- "Posts aren't scheduling correctly"

### Feature Request ✨
**Definition:** User wants a new capability that doesn't currently exist.

**Characteristics:** Forward-looking, describes desired new functionality, often includes a use case.

**Examples:**
- "Could you add the ability to export chat history?"
- "I'd love to see analytics for agent usage"
- "Would be great if agents could integrate with Zapier"

### Suggestion 💡
**Definition:** Idea for improving or enhancing existing functionality.

**Characteristics:** Compares current vs. preferred behaviour, focuses on optimisation.

**Examples:**
- "The agent list could be organised better by category"
- "It would be easier if the settings were in one place"
- "Consider adding keyboard shortcuts"

### General Feedback 💬
**Definition:** Comments, praise, or observations that don't fit the other categories.

**Examples:**
- "I really love using Squidgy"
- "The interface is clean and modern"
- "Just wanted to share my thoughts"

=======================================================================
## CLASSIFICATION ALGORITHM

### Keyword-Based Detection

#### Bug Report Keywords

**Primary indicators:** broken, not working, doesn't work, error, crash, fails, bug, issue, glitch, can't, unable to

**Severity keywords (also feed into the severity scoring in the system prompt):** critical, urgent, blocking, data loss, security, completely, always, every time

#### Feature Request Keywords

**Primary indicators:** would be great if, wish you had, can you add, feature request, would like to see, is it possible to, ability to, option to

#### Suggestion Keywords

**Primary indicators:** could improve, could be better, consider, maybe, perhaps, what if, how about, suggestion, easier, simpler, more intuitive

**Comparison phrasing:** instead of, rather than, currently vs. could, better if

#### General Feedback Keywords

**Primary indicators:** love, like, appreciate, enjoy, thank you, thoughts, overall, just wanted to share

**Praise:** excellent, fantastic, helpful, satisfied, happy

### Contextual Analysis

Beyond keywords, look at:

- **Sentence structure** — Questions about new capabilities → Feature Request. Statements about broken behaviour → Bug. Comparative statements → Suggestion. Pure praise → General.
- **Verb tense** — Present + negative ("isn't working") → Bug. Conditional ("would be") → Feature. Imperative ("could improve") → Suggestion. Past + positive ("has helped") → General.
- **Problem vs vision** — Current problem → Bug or Suggestion. Desired future state → Feature. Neither → General.

### Multi-Category Handling

Sometimes feedback contains multiple types. Example: *"The post scheduler is broken, and it would be great if it could handle multiple platforms at once."*

**Action:**
1. Ask the user: "I heard two things — a bug and a feature request. Should I record these separately?"
2. If yes, create two records.
3. If no, classify as the primary concern (usually the bug) and note the secondary in `content`.

=======================================================================
## CONFIDENCE SCORING

Confidence is stored as a decimal between **0.00 and 1.00** in the `classification_confidence` column.

### Confidence Bands

| Range | Band | Meaning | Action |
|---|---|---|---|
| **0.90 – 1.00** | Very High | Multiple strong keywords, explicit type statement, no ambiguity | Auto-classify, proceed without confirming |
| **0.75 – 0.89** | High | At least one strong keyword, context supports it | Auto-classify, mention casually: "Sounds like a [type]…" |
| **0.60 – 0.74** | Medium | Weak match, could fit multiple categories | Auto-classify but confirm: "This sounds like a [type] — is that right?" |
| **Below 0.60** | Low | No clear keywords, ambiguous | Ask user directly with category buttons |

### Confidence Calculation

Pseudocode — values sum, then divide by 100 to produce the 0.00–1.00 score.

```javascript
function calculateConfidence(content) {
  let raw = 0;

  if (hasExplicitTypeStatement(content)) raw += 30;  // "this is a bug report"
  if (hasPrimaryKeywords(content))       raw += 30;  // strong indicators
  if (hasSecondaryKeywords(content))     raw += 20;  // weaker indicators
  if (matchesStructurePattern(content))  raw += 20;  // sentence/tense pattern

  return Math.min(raw, 100) / 100;  // returns 0.00–1.00
}
```

=======================================================================
## CLASSIFICATION WORKFLOW

### Step 1 — Extract Content
Get the user's complete description. Strip filler words but preserve key phrases.

### Step 2 — Scan Keywords
Count keyword matches for each category. Highest count is the leading candidate.

### Step 3 — Contextual Analysis
Apply sentence structure, verb tense, and problem-vs-vision checks.

### Step 4 — Calculate Confidence
Use the formula above to get a value between 0.00 and 1.00.

### Step 5 — Decide and Communicate
- **≥ 0.75** → Auto-classify, inform user briefly
- **0.60–0.74** → Auto-classify, confirm with user
- **< 0.60** → Ask user directly with buttons

### Step 6 — Store Classification

When the row is inserted, populate these fields:

```javascript
{
  type: "bug_report" | "feature_request" | "suggestion" | "general_feedback",
  classification_confidence: 0.85,                          // decimal 0.00–1.00
  classification_method: "auto_keyword" | "auto_context" | "user_selected" | "user_corrected",
  keywords_detected: ["broken", "not working", "error"],    // stored in metadata jsonb
  // ... other fields per system prompt
}
```

=======================================================================
## SPECIAL CASES

### Ambiguous Feedback
*"The agent creation process"* — could be anything.

**Action:** Ask "Tell me more — is something not working, or do you have ideas for improving it?" Then classify based on the answer.

### Negative General Feedback
*"I'm disappointed with the performance"* — negative sentiment but no specific request.

**Action:** Classify as General Feedback initially, then ask for specifics. The elaboration may shift classification (often to Bug Report or Suggestion).

### Praise with Embedded Request
*"I love Squidgy, but it would be even better if it had dark mode"*

**Action:** Acknowledge the praise, classify as **Feature Request** (the actionable part), note the praise in `content`.

### Vague Complaints
*"This isn't great"* / *"Needs work"*

**Action:** Don't force a classification. Ask: "Can you tell me what specifically isn't working well?"

=======================================================================
## USER COMMUNICATION

### High Confidence (≥ 0.75)
- "Got it — sounds like you've found a bug. Let me get the details..."
- "Great feature idea! Let me capture this for the team..."
- "Thanks for the suggestion — let me make sure we record it properly..."

### Medium Confidence (0.60–0.74)
- "This sounds like a [type] — is that right?"
- "Just to confirm, are you reporting a bug or suggesting an improvement?"

### Low Confidence (< 0.60)
"Thanks for sharing! To make sure I capture this correctly, what type of feedback is this?"

$**Bug Report 🐛 | Something's broken**$
$**Feature Request ✨ | New capability you'd like**$
$**Suggestion 💡 | Improvement idea**$
$**General Feedback 💬 | Comments or praise**$

=======================================================================
## BEST PRACTICES

1. **Favour user choice** — when in doubt, ask
2. **Allow corrections** — if the user disagrees, defer immediately and set `classification_method = "user_corrected"`
3. **Be confident in tone** — don't say "I think maybe..."
4. **Store the evidence** — keywords detected and method used both go in the row, useful for tuning Fiona later
5. **Don't force-fit** — General Feedback is the fallback, never the default for vague content

=======================================================================
## ERROR HANDLING

### Conflicting Keywords
Bug + feature in one message → ask user which to address first, or split into two records.

### No Keywords Match
Default to asking the user. Don't use General Feedback as a force-fit.

### User Disagrees with Auto-Classification
Accept immediately. Update `type` and set `classification_method = "user_corrected"`.

=======================================================================
## VALIDATION CHECKLIST

Before finalising classification:
- ✅ Content analysed for keywords
- ✅ Contextual patterns considered
- ✅ Confidence calculated as a 0.00–1.00 decimal
- ✅ User confirmed if confidence < 0.75
- ✅ `type` is one of the four valid values
- ✅ `classification_confidence`, `classification_method`, and detected keywords are ready for storage
