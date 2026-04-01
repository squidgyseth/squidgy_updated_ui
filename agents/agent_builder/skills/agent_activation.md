# Agent Activation

Enable newly published agents for specific users by delegating user-level activation requests to the Personal Assistant agent.

=======================================================================
## OVERVIEW

After successfully publishing an agent to the database, you can offer to activate the agent **for the user** (user-level activation). This is an **OPTIONAL** step that should only be performed if the user explicitly requests it.

**CRITICAL DISTINCTION:**
- **Platform-level activation** - Agent is enabled in the system (set in config.yaml with `enabled: true`). This happens during the build/publish process and makes the agent available on the platform.
- **User-level activation** - Agent is enabled for a specific user's account. This is what Personal Assistant handles.

**The agent must be platform-active (enabled: true in config) before Personal Assistant can activate it for individual users.**

**CRITICAL:** User-level activation is NOT done by default. Always ask the user first.

=======================================================================
## WHEN TO OFFER ACTIVATION

**After Step 7 (Publishing) is complete:**
- Agent has been successfully published to database
- All files have been created
- N8N workflow has been created
- User has received confirmation message

**In the confirmation message, include:**
```markdown
**Want to Start Using This Agent?**
Would you like me to activate this agent for you so you can start using it right away?
```

=======================================================================
## HOW ACTIVATION WORKS

**Two Levels of Activation:**

**1. Platform-Level Activation (Handled by Agent Builder)**
- Set in config.yaml with `enabled: true` (default for most agents)
- Makes the agent available on the platform
- Happens automatically during the build/publish process
- Required before any user can access the agent

**2. User-Level Activation (Handled by Personal Assistant)**
- Enables the agent for a specific user's account
- Agent Builder CANNOT do this directly
- Must be delegated to Personal Assistant
- Only works if agent is already platform-active

**IMPORTANT:** Users can also ask the Personal Assistant directly to activate agents themselves. The agent builder offering user-level activation is simply a **convenience feature** to save the user an extra step.

**Delegation Process (User-Level Activation):**
1. User confirms they want the agent activated for their account
2. You ask the Personal Assistant to activate the agent for this user
3. Personal Assistant handles the user-level activation using their tools and responds back
4. You relay the Personal Assistant's response to the user (success or any issues)

**Alternative:** User can also activate the agent for themselves by:
- Asking Personal Assistant directly: "Activate the [agent_name] agent for me"
- Going to Settings → Agents and enabling it manually

=======================================================================
## ACTIVATION REQUEST FORMAT

**When user requests user-level activation, use this format:**

```markdown
@personal_assistant

Please activate the following agent for this user at the user level:

**Agent ID:** {agent_id}
**Agent Name:** {agent_name}
**Context:** This agent has just been published and is platform-active (enabled: true). The user has requested to activate it for their account so they can start using it immediately.

Can you please enable this agent for this user?
```

**Example:**
```markdown
@personal_assistant

Please activate the following agent for this user at the user level:

**Agent ID:** social_media_manager
**Agent Name:** Social Media Manager | Content Expert
**Context:** This agent has just been published and is platform-active (enabled: true). The user has requested to activate it for their account so they can start using it immediately.

Can you please enable this agent for this user?
```

=======================================================================
## USER CONFIRMATION REQUIRED

**NEVER activate an agent without explicit user confirmation.**

**Bad (Don't do this):**
- Automatically activating agent after publishing
- Assuming user wants activation
- Activating without asking

**Good (Do this):**
- Ask user if they want activation
- Wait for explicit "yes" or confirmation
- Only then delegate to Personal Assistant

**User responses that indicate YES:**
- "Yes, activate it"
- "Yes please"
- "Activate it for me"
- "I want to use it now"
- "Enable it"

**User responses that indicate NO:**
- "No thanks"
- "Not now"
- "I'll do it later"
- "Skip that"

=======================================================================
## COMPLETE WORKFLOW WITH ACTIVATION

**Step 7: Publish Agent (existing step)**
- Create files
- Publish to database
- Verify publication
- Ask about zip file
- Provide confirmation message

**Step 8: Offer Agent Activation (NEW - OPTIONAL)**

**8.1 Ask User:**
```markdown
**Want to Start Using This Agent?**
Would you like me to activate this agent for you so you can start using it right away?
```

**8.2 Wait for User Response**

**8.3 If User Says YES:**
- Delegate activation to Personal Assistant using format above
- Wait for Personal Assistant's response
- Relay the response to user (e.g., "The Personal Assistant has activated the agent for you! You can now find it in your agent list." or share any issues if activation failed)

**8.4 If User Says NO:**
- Acknowledge: "No problem! You can activate this agent later by asking the Personal Assistant or from your agent settings whenever you're ready."
- Do NOT delegate to Personal Assistant

=======================================================================
## UPDATED CONFIRMATION MESSAGE

**Include activation offer in the final confirmation message:**

```markdown
✅ **Agent Published: [Agent Name | Title]**

🎉 Your agent is now LIVE in the database and ready to use!

**Published to Database:**
- ✅ Agent configuration published successfully
- ✅ System prompt published successfully
[- ✅ {X} skills published successfully]

**Files Created for Your Records:**
- 📄 config.yaml → `agents/{agent_id}/config.yaml`
- 📄 system_prompt.md → `agents/{agent_id}/system_prompt.md`
[- 📄 {X} skill files → `agents/{agent_id}/skills/`]
[- 📦 Zip package → `{agent_id}_agent_package_{timestamp}.zip` (if requested)]

**N8N Workflow:**
🔗 **[Click here to activate your workflow]({workflow_editor_url})**

**Next Steps:**
1. **Activate N8N Workflow:**
   - Click the workflow link above
   - Review the workflow nodes
   - Verify credentials are connected (OpenRouter, Postgres, Supabase)
   - Click the **Activate** toggle in N8N

2. **Test Your Agent:**
   - Navigate to the Squidgy UI
   - Find your agent in the agent list
   - Send a test message
   - Verify the agent responds correctly

**Agent Details:**
- **ID:** {agent_id}
- **Category:** {CATEGORY}
- **Capabilities:** {count} specialized capabilities
- **Complexity:** Tier {X}
- **Status:** Published & Live ✅

---

**Want to Start Using This Agent?**
Would you like me to activate this agent for you so you can start using it right away?
```

=======================================================================
## IMPORTANT NOTES

**1. Platform-Level vs User-Level Activation**
- Platform-level: Agent is enabled in config.yaml (enabled: true) - handled by Agent Builder during publish
- User-level: Agent is enabled for specific user's account - handled by Personal Assistant
- Agent must be platform-active BEFORE Personal Assistant can activate it for users
- This skill only deals with user-level activation

**2. User-Level Activation is OPTIONAL**
- Never activate by default
- Always ask user first
- Respect user's choice

**3. Delegation to Personal Assistant**
- Agent Builder cannot do user-level activation directly
- Personal Assistant has the necessary tools for user-level activation
- Use @mention format to delegate

**4. Clear Communication**
- Make it clear user-level activation is optional
- Explain what user-level activation means (agent becomes available in their agent list)
- Provide alternative (user can activate later via Personal Assistant or settings)

**4. Wait for Personal Assistant Response**
- Personal Assistant is always available
- They will respond back with activation results
- Relay their response to the user

**5. Don't Block on Activation**
- Publishing is complete whether or not user activates
- Activation is a convenience feature
- User can always activate later

=======================================================================
## ERROR HANDLING

**If user is unsure:**
- Provide guidance: "Activating the agent will make it appear in your agent list so you can start chatting with it. You can activate it anytime by asking the Personal Assistant or from Settings → Agents."

**If Personal Assistant reports activation failed:**
- Relay the error message from Personal Assistant to the user
- Suggest alternative: "You can also try activating it manually from Settings → Agents"

**Note:** Personal Assistant is always available and will respond back with the activation result, so you don't need to handle unavailability scenarios

=======================================================================
## SAVE TO KNOWLEDGE BASE

**After offering activation, save:**
- User's activation preference (yes/no)
- Whether delegation to Personal Assistant was sent
- Timestamp of activation request (if applicable)

**Example KB entry:**
```
Agent: social_media_manager
Published: 2026-03-25 14:30:00
Activation Offered: Yes
User Response: Yes, activate it
Delegated to Personal Assistant: Yes
Delegation Timestamp: 2026-03-25 14:31:00
```
