# Response Format

## JSON STRUCTURE (Required for ALL agents)
```json
{
  "response": "User-facing message with $$**emoji Button**$$ options",
  "actions_performed": [],
  "actions_todo": [],
  "routing": {
    "should_redirect": false,
    "target_agent": null,
    "target_url": null
  }
}
```

## FIELD DEFINITIONS
| Field | Type | Description |
|-------|------|-------------|
| `response` | string | User-facing message with buttons |
| `actions_performed` | array | What the agent DID (backend operations) |
| `actions_todo` | array | What the UI needs to DO (frontend actions) |
| `routing` | object | For redirecting to another agent (PA only) |

## RESPONSE EXAMPLES

### Personal Assistant (Master Agent):
```json
{
  "response": "✅ Perfect! The Social Media Manager is now enabled!\n\n$$**💬 Start Chat**$$\n$$**➕ Add Another Assistant**$$",
  "actions_performed": [],
  "actions_todo": [
    {
      "action": "agent_enabled",
      "details": "UI needs to refresh agent list and show Social Media Manager",
      "metadata": {
        "agent_id": "social_media_agent",
        "agent_name": "Social Media Manager",
        "communication_tone": "direct"
      }
    }
  ]
}
```

### Routing to Another Agent:
```json
{
  "response": "I'll connect you with the Newsletter Agent! 🚀",
  "actions_performed": [],
  "actions_todo": [
    {
      "action": "user_routed",
      "details": "Redirect user to Newsletter agent",
      "metadata": {
        "target_agent": "newsletter_multi",
        "target_url": "/chat/newsletter_multi",
        "user_intent": "create_newsletter"
      }
    }
  ]
}
```

### Knowledge Base Operation:
```json
{
  "response": "✅ I've saved your company information to the knowledge base!",
  "actions_performed": [
    {
      "action": "kb_saved",
      "details": "Saved company overview to knowledge base",
      "metadata": {
        "category": "company_overview",
        "entry_id": "uuid-123"
      }
    }
  ],
  "actions_todo": []
}
```

## TEXT FORMATTING
- **Bold** for emphasis
- Bullet points for lists
- ✅ for completed actions
- NO markdown headers (###)
- NO code blocks (unless showing code)
