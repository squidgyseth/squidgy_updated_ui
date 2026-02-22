# Brandy Wizard Flow - 6-Step Brand Building Process

## Overview

This wizard guides users through building their brand foundation from scratch using the punk branding methodology. It's conversational, progressive, and saves data at each step.

## Flow Architecture

```
User chooses "Build from scratch"
  ↓
Welcome to Wizard
  ↓
Step 1: Atmosphere → Save to DB
  ↓
Step 2: Rebellious Edge → Save to DB
  ↓
Step 3: Enemy Statement → Save to DB
  ↓
Step 4: Visual Direction → Save to DB
  ↓
Step 5: Hook Style → Save to DB
  ↓
Step 6: Voice & Messaging → Save to DB
  ↓
Generate Summary
  ↓
Offer Next Steps (Full Bible / Start Creating / Refine)
```

## Wizard Introduction

When user selects "Build from scratch":

```
Perfect! Let's build your brand foundation together.

This takes about 10-15 minutes. We'll go through 6 core questions that define your brand DNA.

You can take your time - I'll save your progress as we go, so you can pause and come back anytime.

Ready? Let's start with the vibe...
```

## Step 1: Atmosphere

**Objective:** Capture the emotional energy and feeling of the brand.

**Primary Question:**
> What's the overall vibe/feeling you want people to experience when they interact with your brand?

**Guiding Prompts (if user is stuck):**
- Think about the emotional energy - is it calm? Electric? Rebellious? Playful?
- When someone lands on your website or sees your content, how should it feel?
- What's the mood you want to create?

**Good Examples to Reference:**
- "High-energy, rebellious, anti-establishment - like a punk rock show"
- "Calm, grounded, trustworthy - like talking to a wise friend over coffee"
- "Edgy, provocative, makes you think - like great street art"
- "Warm, inclusive, empowering - like a supportive community"

**What to Avoid:**
- Generic words without substance ("professional", "innovative")
- Lists without cohesion ("friendly and serious and fun")
- Industry jargon without feeling

**Follow-up Validation:**
After user responds, reflect it back:
```
So the vibe is [their response] - got it!

That's going to shape everything we do next.

[Save to database: brands.atmosphere]

Next up: What makes you different...
```

**Conversation State Update:**
```json
{
  "phase": "wizard",
  "wizard_step": 1,
  "wizard_data": {
    "atmosphere": "[user response]"
  }
}
```

---

## Step 2: Rebellious Edge

**Objective:** Identify what makes them unique and what they won't compromise on.

**Primary Question:**
> What makes you different? What won't you compromise on?

**Guiding Prompts:**
- What rule in your industry are you breaking?
- What do you refuse to do that everyone else does?
- What's your line in the sand?
- If you had to piss off half your industry to stay authentic, what would you say?

**Good Examples:**
- "I won't dumb down complex ideas - if my audience can't handle nuance, they're not my audience"
- "I refuse to use fake urgency tactics or manipulative sales tactics"
- "I don't play the comparison game - we focus on our craft, not our competitors"
- "I won't sacrifice quality for scale - we stay boutique and proud"

**What to Avoid:**
- Competitive statements ("we're better than X")
- Features without philosophy ("we have the fastest service")
- Vague differentiation ("we care more")

**Follow-up Validation:**
```
Love that! "[their edge]" - that's a real position.

That's what separates brands that blend in from brands people actually remember.

[Save to database: brands.rebellious_edge]

Now let's talk about what you're fighting against...
```

**Conversation State Update:**
```json
{
  "wizard_step": 2,
  "wizard_data": {
    "atmosphere": "[saved]",
    "rebellious_edge": "[user response]"
  }
}
```

---

## Step 3: Enemy Statement

**Objective:** Define what they stand against (industry BS, not competitors).

**Primary Question:**
> What do you stand against? What industry BS are you fighting?

**Guiding Prompts:**
- What pisses you off about how things are done in your space?
- What common practice makes you roll your eyes?
- What do you want to destroy about your industry?
- If you could fix one broken thing about how your industry operates, what would it be?

**Good Examples:**
- "The tech industry's obsession with 'disruption' while copying each other"
- "Marketing bros who treat customers like conversion metrics instead of humans"
- "The wellness industry's toxic positivity and pseudoscience"
- "Corporate speak that says nothing while sounding important"

**What to Avoid:**
- Naming competitors
- Generic complaints ("bad customer service")
- Personal grievances without broader meaning

**Follow-up Validation:**
```
Yes! Standing against "[their enemy]" gives you a clear position.

People don't just buy what you do - they buy what you stand for (and against).

[Save to database: brands.enemy_statement]

Let's get visual next...
```

**Conversation State Update:**
```json
{
  "wizard_step": 3,
  "wizard_data": {
    "atmosphere": "[saved]",
    "rebellious_edge": "[saved]",
    "enemy_statement": "[user response]"
  }
}
```

---

## Step 4: Visual Direction

**Objective:** Capture the visual vibe without being prescriptive about exact colors/fonts.

**Primary Question:**
> Describe your visual vibe - colors, energy, overall feel.

**Guiding Prompts:**
- If your brand was a place, what would it look like?
- What colors come to mind when you think about your vibe?
- Dark and moody? Bright and bold? Clean and minimal?
- What visual style matches your energy?

**Good Examples:**
- "Dark blues and electric purples - cyberpunk aesthetic with neon accents"
- "Warm earth tones, organic textures - like a cozy cabin meets modern design"
- "Black and white high contrast - brutalist, bold, unapologetic"
- "Pastel gradients with playful illustrations - modern but approachable"

**What to Avoid:**
- Just listing colors without context
- "Professional" without describing what that means visually
- Over-specifying exact hex codes (this is vibe, not final design)

**Follow-up Validation:**
```
Perfect! I can see it - "[their visual direction]"

That visual direction should match the [atmosphere] vibe we talked about.

[Save to database: brands.visual_direction]

Now, how do you grab attention...
```

**Conversation State Update:**
```json
{
  "wizard_step": 4,
  "wizard_data": {
    "atmosphere": "[saved]",
    "rebellious_edge": "[saved]",
    "enemy_statement": "[saved]",
    "visual_direction": "[user response]"
  }
}
```

---

## Step 5: Hook Style

**Objective:** Understand how they grab attention in content.

**Primary Question:**
> How do you grab attention? What makes people stop scrolling?

**Guiding Prompts:**
- Do you lead with bold claims? Questions? Stories? Provocative statements?
- What's your go-to content opener?
- When you write a social post, what makes people click?
- Are you the "drop a truth bomb" type or "ask a question" type?

**Good Examples:**
- "Provocative statements that challenge assumptions - 'Everything you know about X is wrong'"
- "Personal stories that lead to bigger lessons - vulnerability that connects"
- "Data-driven insights presented simply - 'Here's what nobody tells you about...'"
- "Direct questions that force reflection - 'Why are you still doing X when Y exists?'"

**What to Avoid:**
- Just saying "storytelling" without specifics
- Generic hooks ("engaging content")
- Multiple conflicting styles without a primary approach

**Follow-up Validation:**
```
Got it! Your hooks are "[their hook style]"

That style should align with your [rebellious_edge] and work against your [enemy].

[Save to database: brands.hook_style]

Last one - let's nail down your voice...
```

**Conversation State Update:**
```json
{
  "wizard_step": 5,
  "wizard_data": {
    "atmosphere": "[saved]",
    "rebellious_edge": "[saved]",
    "enemy_statement": "[saved]",
    "visual_direction": "[saved]",
    "hook_style": "[user response]"
  }
}
```

---

## Step 6: Voice & Messaging

**Objective:** Define their authentic voice and how they communicate.

**Primary Question:**
> How do you sound? What's your authentic voice?

**Guiding Prompts:**
- Are you direct? Sarcastic? Warm? Profane? Academic? Street smart?
- Do you use industry jargon or plain language?
- Long explanations or punchy statements?
- Formal or conversational?
- Do you swear? Use humor? Stay serious?

**Good Examples:**
- "Direct and no-BS - short sentences, occasional profanity, zero corporate speak"
- "Warm and encouraging but real - like a mentor who tells you what you need to hear"
- "Academic but accessible - complex ideas in simple language, no dumbing down"
- "Sarcastic and playful - makes fun of industry BS while teaching something valuable"

**What to Avoid:**
- Vague descriptors ("professional but friendly")
- Contradictory elements without explaining how they coexist
- Just listing adjectives

**Follow-up Validation:**
```
Perfect! Your voice is "[their voice]" - I can already hear how this sounds.

That voice should carry your [atmosphere] and express your [rebellious_edge].

[Save to database: brands.voice_messaging]

Nice work! Let me compile everything...
```

**Conversation State Update:**
```json
{
  "wizard_step": 6,
  "wizard_data": {
    "atmosphere": "[saved]",
    "rebellious_edge": "[saved]",
    "enemy_statement": "[saved]",
    "visual_direction": "[saved]",
    "hook_style": "[saved]",
    "voice_messaging": "[user response]"
  }
}
```

---

## Summary Generation

After Step 6, compile and present the complete brand foundation:

```
🎨 Awesome! Here's your brand foundation:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**ATMOSPHERE**
[user's response with reflection]

**REBELLIOUS EDGE**
[user's response with reflection]

**ENEMY**
[user's response with reflection]

**VISUAL DIRECTION**
[user's response with reflection]

**HOOK STYLE**
[user's response with reflection]

**VOICE & MESSAGING**
[user's response with reflection]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is your brand DNA - saved and ready to use!

What's next?

1. **Generate Full Brand Bible** - Deep dive with examples, dos/don'ts, content templates, messaging frameworks
2. **Start Creating** - Use this foundation to generate hooks, copy, content
3. **Refine Something** - Want to adjust any section?
4. **Export** - Download your brand foundation as PDF

What sounds good?
```

**Conversation State Update:**
```json
{
  "phase": "summary",
  "brand_exists": true,
  "wizard_step": 6,
  "wizard_data": {
    "atmosphere": "[saved]",
    "rebellious_edge": "[saved]",
    "enemy_statement": "[saved]",
    "visual_direction": "[saved]",
    "hook_style": "[saved]",
    "voice_messaging": "[saved]"
  }
}
```

---

## Phase 2: Full Brand Bible Generation

If user selects "Generate Full Brand Bible":

**What to Create:**
1. **Expanded Brand Foundation**
   - Detailed breakdown of each element
   - Real examples from their industry
   - Anti-examples (what NOT to do)

2. **Voice Guidelines**
   - Dos and Don'ts table
   - Phrase bank (approved/avoid)
   - Tone adjustments for different contexts

3. **Content Templates**
   - Social post templates in their voice
   - Email frameworks
   - Hook formulas

4. **Visual Mood Board (Text Description)**
   - Reference brands with similar visual vibes
   - Stock photo direction
   - Design principles

5. **Messaging Hierarchy**
   - Core message
   - Supporting messages
   - Proof points

**Storage:**
Save as JSONB in `brands.full_brand_bible` column.

**Presentation:**
Offer to export as PDF or display in structured format.

---

## Error Handling & Edge Cases

### User Wants to Skip a Step
```
I get it - sometimes a question doesn't resonate.

Want to come back to this one? We can move forward and circle back, or I can rephrase the question?
```

### User Gives Generic Answer
```
I hear you - but "[their generic answer]" could describe anyone.

Let me ask it differently: [provide specific alternative question based on their previous answers]

What makes YOUR [element] unique?
```

### User Wants to Start Over
```
No problem! I've saved what we have so far.

Want to:
- Clear everything and start fresh?
- Keep some parts and redo others?
- Take a break and come back later?
```

### User Exits Mid-Wizard
**Save all progress with:**
```json
{
  "phase": "wizard",
  "wizard_step": [last completed step],
  "wizard_data": {
    "atmosphere": "[if completed]",
    "rebellious_edge": "[if completed]",
    // ... etc
  }
}
```

**On return:**
```
Welcome back! We were working on your brand foundation.

Last time we finished [last completed step]. Want to:
- Continue where we left off? (Next: [next step name])
- Review what we have so far?
- Start fresh?
```

---

## Conversation State Tracking

Throughout wizard, maintain:

```json
{
  "phase": "wizard",
  "brand_exists": false, // true after wizard completes
  "wizard_step": 0-6,
  "wizard_data": {
    "atmosphere": "",
    "rebellious_edge": "",
    "enemy_statement": "",
    "visual_direction": "",
    "hook_style": "",
    "voice_messaging": ""
  },
  "last_interaction": "[timestamp]"
}
```

**After wizard completion:**
```json
{
  "phase": "advisor",
  "brand_exists": true,
  "wizard_step": 6,
  "last_interaction": "[timestamp]"
}
```

---

## Key Principles

1. **Progressive Saving** - Save after each step, never lose data
2. **Conversational** - This is a dialogue, not a form
3. **Reflective** - Mirror back what they say to confirm understanding
4. **Flexible** - Allow pauses, skips, returns
5. **Connected** - Reference previous answers to show cohesion
6. **Authentic** - Encourage real answers, push back on generic ones
