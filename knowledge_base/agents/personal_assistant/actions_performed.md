# Personal Assistant - Actions Performed (Elevated)

PA-specific actions in addition to shared actions.

## Standard Action Structure

**EVERY action must follow this structure:**
```json
{
  "action": "action_name",     // The type of action performed
  "details": "Description",    // Human-readable description of what happened
  "metadata": {                // Additional structured data about the action
    // Relevant data here (agent_id, urls, config, etc.)
  }
}
```

---

## Elevated Action Types

| Action Type | Description | Example |
|-------------|-------------|---------|
| `business_context_collected` | Got business info (website or manual) | Analyzed website, extracted brand |
| `website_analyzed` | Scraped and analyzed website | Extracted branding from homepage |
| `agent_enabled` | Enabled a child agent | Enabled Newsletter Multi |
| `agent_disabled` | Disabled a child agent | Disabled SOL agent |
| `agent_configured` | Updated agent settings | Set newsletter tone to casual |
| `kb_saved` | Saved to any KB category | Saved company overview |
| `kb_updated` | Updated existing KB data | Updated branding colors |
| `kb_deleted` | Removed KB data | Deleted outdated product info |
| `user_routed` | Redirected user to agent | Sent to Newsletter agent |
| `onboarding_started` | Started agent onboarding | Beginning Newsletter setup |
| `onboarding_completed` | Finished agent onboarding | Newsletter fully configured |
| `settings_updated` | Changed user/system settings | Updated timezone |

---

## Examples

### Business Context Collected:
```json
{
  "action": "business_context_collected",
  "details": "Learned about your business from website analysis",
  "metadata": {
    "source": "website_analysis",
    "url": "https://example.com",
    "categories_populated": ["website", "company", "branding", "products"],
    "ready_for_agent_setup": true
  }
}
```

### Agent Enabled:
```json
{
  "action": "agent_enabled",
  "details": "Newsletter Multi agent is now enabled and ready to use",
  "metadata": {
    "agent_id": "newsletter_multi",
    "agent_name": "Newsletter Multi",
    "config_applied": {
      "tone": "professional",
      "target_audience": "B2B CTOs"
    }
  }
}
```

```json
{
  "action": "website_analyzed",
  "details": "Analyzed your website and extracted branding information",
  "metadata": {
    "url": "https://example.com",
    "extracted_data": {
      "categories": ["branding_identity", "company_overview"],
      "fields": ["colors", "logo_url", "tagline", "company_name"]
    },
    "saved_to_kb": true
  }
}
```

```json
{
  "action": "user_routed",
  "details": "Connecting you with the Newsletter agent",
  "metadata": {
    "target_agent": "newsletter_multi",
    "target_url": "/chat/newsletter_multi",
    "user_intent": "create_newsletter"
  }
}
```

**Note:** No separate "routing" object needed - frontend reads target_agent and target_url directly from this action's metadata.
