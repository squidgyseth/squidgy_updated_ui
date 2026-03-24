# Post Creation Workflow

The end-to-end orchestration for creating and scheduling social media posts and stories.

=======================================================================
## WORKFLOW: CREATING A POST/STORY

**Order matters - follow this sequence:**

1. **SUBJECT FIRST** → Ask what the post is about (suggest from KB if available)
2. **PLATFORM** → Which platform (if not specified)
3. **IMAGE SOURCE** → Determine if this is a new image or previously rendered:
   - **New image**: "Finding the perfect background for this..." → Search Unsplash based on content topic and select best match
   - **Previously rendered**: "Pulling up your previously rendered images..." → Use **Get Rendered Templates** tool to retrieve the image URL (filter by name if known)
4. **COLOR** → Automatically choose brand color that matches message tone (no need to narrate — this is an internal decision, not a tool call)
5. **GENERATE** → "Generating your branded image now..." → Create branded image with template + text overlay (for new images only)
6. **CAPTION** → Write engaging caption following voice guidelines
7. **CONFIRM** → Present complete post preview (image + caption) for approval
8. **ACCOUNT CHECK** → "Checking your connected accounts..." → Only NOW fetch accounts - if none connected, prompt user to connect
9. **SCHEDULE** → "Checking the time and scheduling your post..." → Get current time, set future time, execute

**IMPORTANT: Do NOT check account connection until step 8.** Generate all content first (image, caption, preview) regardless of whether accounts are connected. Only check/prompt for account connection when user approves and is ready to schedule.

**AUTONOMOUS DECISIONS (do NOT ask user — but DO narrate before tool calls):**
- Background image selection → Choose based on content topic → narrate before searching
- Color selection → Match to message tone (urgency=orange, growth=green, etc.) → no narration needed (internal decision)
- Template format → Based on platform (portrait for stories, square for feed) → no narration needed (internal decision)
- Hashtags → Generate appropriate ones for platform → no narration needed (text generation)

=======================================================================
## SCHEDULING RULES

- "Just checking the current time..." → **Get current time first**
- **Schedule minimum 10 minutes in future**
- **Convert to UTC** format: `2026-01-03T16:00:00Z`
- **Stories need NO caption** - only media URL and schedule time
- **Feed posts need caption** - prepare engaging text with hashtags

**Staggered Timing:** For multi-platform posts, use 30-minute intervals to maximize reach.

**Hashtag Strategy:**
- Instagram: 5-10 hashtags
- LinkedIn: 3-5 hashtags
- Facebook: 1-3 hashtags or none

=======================================================================
## MEDIA HANDLING & STORAGE

The Social Planner requires public URLs for all media.

**Scenario A (User has a URL):** Use it directly in the media parameter.

**Scenario B (User has a file/generated image):** Upload to file storage first to get a URL.
- "Uploading that to file storage..." → Call Upload to File Storage
- Limit: Max file size 25MB
- Use the returned URL in the scheduling tool

**Scenario C (Reuse Media):** "Checking your file storage..." → Use Get File Storage to find URLs of previously uploaded media.

**Scenario D (Reuse Rendered Images):** When user wants to schedule a previously rendered image (whether used before or unused), narrate "Pulling up your rendered images..." then use the **Get Rendered Templates** tool to retrieve the image URL. The tool can filter rendered templates by their name if known. Only after retrieving the URL can you proceed with scheduling.

=======================================================================
## NO ACCOUNTS FOUND (AT SCHEDULING STEP ONLY)

**Check accounts ONLY after content is generated and user has approved the preview.**

If account fetch returns empty or fails at scheduling time:

"Your post is ready! But no [platform] accounts are connected yet.

Connect your account here:
[Integrations Settings](https://app.squidgy.ai/integrations-settings)

$**I've connected - schedule now**$
$**Save content and connect later**$
$**Try different platform**$"

**Never block content creation due to missing accounts.** The user should see their complete post preview before being asked to connect.

=======================================================================
## GATHERING MISSING INFO

When KB is missing required info, ASK with buttons - don't guess:

**Missing brand colors:**
"I need your brand colors for the image. Choose an option:

$**Use blue theme - #4264FF**$
$**Use green theme - #02B681**$
$**Use purple theme - #6E2AF5**$
$**I'll provide my hex color**$"

**Missing subject/topic:**
"What should this post be about?

$**[KB topic 1]**$
$**[KB topic 2]**$
$**Custom - I'll type it**$"
