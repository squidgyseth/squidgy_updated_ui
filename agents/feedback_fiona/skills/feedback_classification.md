# Feedback Classification

Automatically analyze feedback content and classify it into appropriate categories with confidence scoring. Ensures accurate categorization for proper routing, prioritization, and admin review.

=======================================================================
## WHEN TO USE

Use this skill:
- When user provides feedback but doesn't explicitly state the type
- To validate user's stated feedback type matches content
- During feedback collection workflow to auto-detect category
- Before storing feedback in database

=======================================================================
## FEEDBACK CATEGORIES

### Bug Report 🐛
**Definition:** Something in Squidgy is broken, not working as expected, or producing errors

**Characteristics:**
- Describes current negative behavior
- States what's not working
- May include error messages
- Impacts user's ability to complete tasks

**Examples:**
- "The chat freezes when I upload files"
- "I'm getting an error message when I try to create a new agent"
- "Posts aren't scheduling correctly"
- "My dashboard isn't loading"

### Feature Request ✨
**Definition:** User wants a new capability or functionality that doesn't currently exist

**Characteristics:**
- Describes desired new functionality
- States what they wish Squidgy could do
- Often includes use case or benefit
- Forward-looking ("would be great if...")

**Examples:**
- "Could you add the ability to export chat history?"
- "I'd love to see analytics for agent usage"
- "Would be great if agents could integrate with Zapier"
- "Can we have templates for common agent types?"

### Suggestion 💡
**Definition:** Idea for improving or enhancing existing functionality

**Characteristics:**
- Describes how existing feature could work better
- Compares current vs. preferred behavior
- Focuses on optimization or improvement
- May include "could be better" phrasing

**Examples:**
- "The agent list could be organized better by category"
- "It would be easier if the settings were in one place"
- "Consider adding keyboard shortcuts for common actions"
- "The onboarding flow could be more intuitive"

### General Feedback 💬
**Definition:** Comments, praise, observations, or feedback that doesn't fit other categories

**Characteristics:**
- Doesn't request specific changes
- May be praise or positive comments
- General observations about experience
- Questions or clarifications

**Examples:**
- "I really love using Squidgy, it's made my work easier"
- "The interface is clean and modern"
- "Just wanted to share my thoughts on the platform"
- "Overall I'm very satisfied with the product"

=======================================================================
## CLASSIFICATION ALGORITHM

### Keyword-Based Detection

#### Bug Report Keywords

**Primary Indicators (High Confidence):**
- broken, not working, doesn't work, isn't working
- error, crash, fails, failed, failure
- bug, issue, problem, glitch
- can't, unable to, won't, doesn't

**Severity Keywords:**
- critical, urgent, blocking, major
- data loss, security, can't access
- completely, always, every time

**Example Phrases:**
- "I'm getting an error"
- "It's not working"
- "Something is broken"
- "This fails when I..."

**Confidence Level:**
- 2+ primary keywords = 90% confidence
- 1 primary keyword + context = 75% confidence
- Severity keywords alone = 60% confidence

#### Feature Request Keywords

**Primary Indicators (High Confidence):**
- would be great if, wish you had, can you add
- feature request, new feature, add support for
- would like to see, hoping for, looking forward to
- could you, is it possible to, will you

**Intent Keywords:**
- add, include, implement, introduce
- support, enable, allow, integrate
- ability to, option to, way to

**Example Phrases:**
- "Would be great if I could..."
- "Can you add..."
- "Is there a way to..."
- "I wish Squidgy had..."

**Confidence Level:**
- Explicit "feature request" = 95% confidence
- "Would be great if" + specific ask = 85% confidence
- "Can you add" phrasing = 80% confidence
- Intent keywords only = 60% confidence

#### Suggestion Keywords

**Primary Indicators (High Confidence):**
- could improve, could be better, should work
- consider, maybe, perhaps, what if, how about
- suggestion, idea, thought, recommend
- easier, simpler, clearer, more intuitive

**Comparison Keywords:**
- instead of, rather than, compared to
- currently vs. could, is vs. should be
- better if, more convenient if

**Example Phrases:**
- "It would be easier if..."
- "Consider making it..."
- "How about..."
- "I think you could improve..."

**Confidence Level:**
- "Suggestion" + improvement idea = 85% confidence
- Comparison phrasing = 75% confidence
- "Could improve" phrasing = 70% confidence
- Vague suggestions = 50% confidence

#### General Feedback Keywords

**Primary Indicators:**
- love, like, appreciate, enjoy, great
- thank you, thanks, feedback, thoughts
- overall, generally, in general
- just wanted to share, just saying

**Praise Keywords:**
- excellent, amazing, fantastic, wonderful
- helpful, useful, valuable, impressive
- satisfied, happy, pleased

**Observation Keywords:**
- noticed, observed, seeing, found
- interesting, curious, wondering

**Example Phrases:**
- "I love using Squidgy"
- "Just wanted to share my thoughts"
- "Overall very satisfied"
- "Noticed that..."

**Confidence Level:**
- Pure praise = 90% general feedback
- Observations without requests = 80% confidence
- "Just sharing" phrasing = 85% confidence

### Contextual Analysis

**Beyond keywords, analyze:**

#### Sentence Structure
- Questions about new features → Feature Request
- Statements about broken behavior → Bug Report
- Comparative statements → Suggestion
- Positive statements only → General Feedback

#### Verb Tense
- Present tense + negative (isn't working) → Bug
- Conditional tense (would be) → Feature Request
- Imperative mood (could improve) → Suggestion
- Past tense + positive (has helped) → General

#### Problem vs. Vision
- States current problem → Bug or Suggestion
- Describes desired future state → Feature Request
- Neither problem nor vision → General Feedback

### Multi-Category Handling

**Sometimes feedback contains multiple types:**

**Example:** "The post scheduler is broken (bug), and it would be great if it could handle multiple platforms at once (feature request)."

**Action:**
1. Split into separate feedback items if clearly distinct
2. OR classify as primary type (the first/main concern)
3. Note secondary type in feedback content
4. Ask user: "I heard two things - a bug and a feature request. Should I record these separately?"

=======================================================================
## CONFIDENCE SCORING

### Confidence Levels

**90-100% (Very High Confidence)**
- Multiple strong keywords present
- Clear explicit statement of type
- Consistent with category characteristics
- No ambiguity

**Action:** Auto-classify, proceed confidently

**75-89% (High Confidence)**
- At least one strong keyword present
- Context supports classification
- Minor ambiguity possible
- Likely correct

**Action:** Auto-classify, mention confidence to user: "Sounds like a [type]..."

**60-74% (Medium Confidence)**
- Weak keyword matches
- Some contextual support
- Could fit multiple categories
- Needs validation

**Action:** Auto-classify but confirm with user: "This sounds like a [type] - is that right?"

**Below 60% (Low Confidence)**
- No clear keywords
- Ambiguous context
- Could fit any category
- Unclear intent

**Action:** Ask user directly to choose category

### Confidence Calculation

```javascript
function calculateConfidence(feedback_content) {
  let confidence = 0;
  
  // Check for primary keywords (each worth 30 points)
  if (hasPrimaryKeywords(feedback_content)) confidence += 30;
  
  // Check for secondary keywords (each worth 20 points)
  if (hasSecondaryKeywords(feedback_content)) confidence += 20;
  
  // Check sentence structure (worth 20 points)
  if (matchesStructurePattern(feedback_content)) confidence += 20;
  
  // Check for explicit type statement (worth 30 points)
  if (hasExplicitTypeStatement(feedback_content)) confidence += 30;
  
  return Math.min(confidence, 100); // Cap at 100%
}
```

=======================================================================
## CLASSIFICATION WORKFLOW

### Step 1: Initial Analysis

**Extract feedback content:**
- Get user's complete description
- Remove filler words (um, like, you know)
- Preserve key phrases and intent

### Step 2: Keyword Scanning

**Check each category for keyword matches:**
```javascript
const bugKeywords = countBugKeywords(content);
const featureKeywords = countFeatureKeywords(content);
const suggestionKeywords = countSuggestionKeywords(content);
const generalKeywords = countGeneralKeywords(content);

// Highest count suggests category
```

### Step 3: Contextual Analysis

**Analyze beyond keywords:**
- Sentence structure patterns
- Verb tenses used
- Presence of negatives (not, broken, can't)
- Presence of conditionals (would, could, wish)

### Step 4: Confidence Calculation

**Calculate confidence score for top candidate category:**
```javascript
const topCategory = getHighestMatch([bug, feature, suggestion, general]);
const confidence = calculateConfidence(content, topCategory);
```

### Step 5: Classification Decision

**Based on confidence:**

**If confidence >= 75%:**
- Auto-classify
- Inform user: "Got it - sounds like a [type]."
- Proceed with feedback collection

**If confidence 60-74%:**
- Auto-classify tentatively
- Confirm with user: "This seems like a [type] - is that right?"
- Allow correction if needed

**If confidence < 60%:**
- Ask user directly
- Provide buttons for each category with descriptions
- Use their selection

### Step 6: Store Classification

**In database record:**
```javascript
{
  type: "bug_report" | "feature_request" | "suggestion" | "general_feedback",
  classification_confidence: 85, // percentage
  classification_method: "auto_keyword" | "auto_context" | "user_selected",
  keywords_detected: ["broken", "not working", "error"],
  // ... other fields
}
```

=======================================================================
## SPECIAL CASES

### Ambiguous Feedback

**Example:** "The agent creation process"
- Could be: Bug (it's broken), Feature (want new capability), Suggestion (could be better), General (commenting on it)

**Action:**
1. Ask clarifying question: "Tell me more - is something not working correctly, or do you have ideas for improving it?"
2. User response reveals true type
3. Classify based on clarification

### Negative General Feedback

**Example:** "I'm disappointed with the performance"
- Contains negative sentiment but no specific request
- Not a bug report (no broken functionality stated)
- Not a feature request (no new capability asked for)
- Could be general feedback or suggestion

**Action:**
1. Classify as General Feedback initially
2. Follow up: "I'm sorry to hear that. Can you share what specifically is disappointing? That will help me capture this properly."
3. User's elaboration may shift classification

### Praise with Embedded Request

**Example:** "I love Squidgy, but it would be even better if it had dark mode"
- Contains praise (general) AND feature request

**Action:**
1. Acknowledge both parts: "Thank you for the kind words!"
2. Classify as Feature Request (the actionable part)
3. Note the praise in feedback content

### Vague Complaints

**Example:** "This isn't great" or "Needs work"
- Unclear what "this" refers to
- No specific classification indicators

**Action:**
1. Ask for specifics: "I'd love to help - can you tell me what specifically isn't working well?"
2. User elaboration provides classification clues
3. Don't force classification without details

=======================================================================
## USER COMMUNICATION

### High Confidence Classification

**Example messages:**
- "Got it - sounds like you've found a bug. Let me get the details..."
- "Great feature idea! Let me capture this for the team..."
- "Thanks for the suggestion on how to improve that..."

### Medium Confidence Classification

**Example messages:**
- "This sounds like a [type] - is that right?" (with buttons)
- "Just to confirm, are you reporting a bug or suggesting an improvement?" (with buttons)

### Low Confidence - Ask Directly

**Example message:**
"Thanks for sharing! To make sure I capture this correctly, what type of feedback is this?"

$**Bug Report 🐛 | Something's broken**$
$**Feature Request ✨ | New capability you'd like**$
$**Suggestion 💡 | Improvement idea**$
$**General Feedback 💬 | Comments or praise**$

=======================================================================
## BEST PRACTICES

### Classification Quality

1. **Favor User Choice** - When in doubt, ask rather than guessing
2. **Allow Corrections** - If user disagrees with classification, defer to them
3. **Context Matters** - Same keywords can mean different things in different contexts
4. **Track Accuracy** - Log classification confidence for quality improvement

### User Experience

1. **Be Confident** - Don't express uncertainty to user ("I think maybe...")
2. **Quick Classification** - Don't make users wait through analysis
3. **Natural Language** - Explain categories in simple terms
4. **Show, Don't Tell** - Use emojis to make categories visual and friendly

### Data Quality

1. **Store Confidence** - Helps admins understand classification reliability
2. **Store Keywords** - Documents why classification was made
3. **Allow Reclassification** - Admins can correct if needed
4. **Log Method** - Track auto vs. user-selected for analysis

=======================================================================
## ERROR HANDLING

### Conflicting Keywords

**Scenario:** Feedback contains both bug and feature keywords

**Example:** "The scheduler is broken and needs a calendar view"

**Action:**
- Identify primary issue (bug is usually primary)
- Classify as Bug Report
- Note feature request in content
- OR ask user which to address first

### No Keywords Match

**Scenario:** Feedback is very vague or uses uncommon phrasing

**Action:**
- Default to asking user to choose type
- Don't force-fit into category
- Use General Feedback as fallback only if user can't decide

### User Disagrees with Classification

**Scenario:** Auto-classified as Bug, user says it's Feature Request

**Action:**
- Accept user's classification immediately
- Update database with corrected type
- Mark classification_method as "user_corrected"
- Learn from the mismatch

=======================================================================
## VALIDATION CHECKLIST

Before finalizing classification:
- ✅ Feedback content analyzed for keywords
- ✅ Contextual patterns considered
- ✅ Confidence score calculated
- ✅ User confirmed or informed of classification (if confidence < 75%)
- ✅ Type is one of: bug_report, feature_request, suggestion, general_feedback
- ✅ Classification metadata stored (confidence, method, keywords)

After classification:
- ✅ User understands the type (via emoji and description)
- ✅ Classification makes sense given feedback content
- ✅ Appropriate priority scoring applied for that type
- ✅ Feedback ready for storage with correct categorization