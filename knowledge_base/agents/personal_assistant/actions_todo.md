# Personal Assistant - Actions Todo (Elevated)

**What goes in actions_todo:** UI/Frontend operations that need to happen (routing, refresh, display)

## Standard Todo Structure

**EVERY todo must follow this structure:**
```json
{
  "action": "action_name",     // The type of UI action needed
  "details": "Description",    // Human-readable description
  "metadata": {                // Additional structured data
    // Relevant data here (target_agent, target_url, etc.)
  }
}
```

---

## Elevated Todo Types (UI Operations)

| Action Type | Description | When to Use |
|-------------|-------------|-------------|
| `agent_enabled` | UI needs to refresh agent list | After agent enablement tool call |
| `user_routed` | UI needs to redirect user to another agent | When routing to enabled agent |
| `show_preview` | UI needs to display content preview | After template render |
| `show_template_options` | UI needs to display template choices | When showing templates |
| `business_context_required` | Need business info before agent setup | New user onboarding |
| `awaiting_website_url` | Waiting for user to share website | Onboarding step |
| `awaiting_agent_selection` | User needs to pick an agent | Onboarding step |
| `awaiting_config_input` | Need config info from user | Onboarding step |
| `kb_gap_detected` | Missing important KB data | Proactive suggestion |

---

## Examples

### Agent Enabled (UI Action):
```json
{
  "action": "agent_enabled",
  "details": "UI needs to refresh agent list and show Social Media Manager",
  "metadata": {
    "agent_id": "social_media_agent",
    "agent_name": "Social Media Manager",
    "communication_tone": "direct"
  }
}
```

### User Routed (UI Action):
```json
{
  "action": "user_routed",
  "details": "UI needs to redirect user to Newsletter agent",
  "metadata": {
    "target_agent": "newsletter_multi",
    "target_url": "/chat/newsletter_multi",
    "user_intent": "create_newsletter"
  }
}
```

### Business Context Required (New User):
```json
{
  "action": "business_context_required",
  "details": "Need to learn about your business before setting up assistants",
  "metadata": {
    "priority": "high",
    "reason": "KB is empty - no website, company, or branding data",
    "options": ["analyze_website", "tell_about_business"],
    "blocks": "agent_setup"
  }
}
```

### Awaiting Website URL:
```json
{
  "action": "awaiting_website_url",
  "details": "Share your website URL so I can learn about your business",
  "metadata": {
    "priority": "high",
    "next_step": "web_analysis",
    "fallback": "manual_business_info"
  }
}
```

### Awaiting Agent Selection:
```json
{
  "action": "awaiting_agent_selection",
  "details": "Which assistant would you like to set up?",
  "metadata": {
    "priority": "high",
    "available_agents": ["newsletter_multi", "content_repurposer", "SOL"],
    "options_shown": true
  }
}
```

```json
{
  "action": "pending_onboarding",
  "details": "Content Repurposer agent needs configuration before use",
  "metadata": {
    "priority": "medium",
    "agent_id": "content_repurposer",
    "missing_config": ["content_types", "platforms"],
    "can_skip": false
  }
}
```

```json
{
  "action": "kb_gap_detected",
  "details": "Your Knowledge Base is missing competitor information",
  "metadata": {
    "priority": "medium",
    "category": "competitive_landscape",
    "impact": "Limits competitive positioning in content",
    "suggested_action": "Tell me about your main competitors"
  }
}
```
