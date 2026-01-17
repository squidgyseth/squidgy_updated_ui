# Personal Assistant - Actions Todo (Elevated)

PA-specific todos in addition to shared todos.

---

## Elevated Todo Types

| Action Type | Description | Priority |
|-------------|-------------|----------|
| `business_context_required` | Need business info before agent setup | high |
| `awaiting_website_url` | Waiting for user to share website | high |
| `awaiting_business_info` | Waiting for manual business description | high |
| `awaiting_agent_selection` | User needs to pick an agent | high |
| `awaiting_config_input` | Need config info from user | high |
| `pending_onboarding` | Agent needs to be set up | medium |
| `suggest_agent` | Recommend enabling an agent | low |
| `kb_gap_detected` | Missing important KB data | medium |
| `review_agents` | Suggest reviewing agent list | low |

---

## Examples

### Business Context Required (New User):
```json
{
  "action": "business_context_required",
  "details": "Need to learn about your business before setting up assistants",
  "priority": "high",
  "metadata": {
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
  "priority": "high",
  "metadata": {
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
  "priority": "high",
  "metadata": {
    "available_agents": ["newsletter_multi", "content_repurposer", "SOL"],
    "options_shown": true
  }
}
```

```json
{
  "action": "pending_onboarding",
  "details": "Content Repurposer agent needs configuration before use",
  "priority": "medium",
  "metadata": {
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
  "priority": "medium",
  "metadata": {
    "category": "competitive_landscape",
    "impact": "Limits competitive positioning in content",
    "suggested_action": "Tell me about your main competitors"
  }
}
```
