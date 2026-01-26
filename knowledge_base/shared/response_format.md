# Response Format

## JSON STRUCTURE (Required for all responses)
```json
{
  "finished": true,
  "response": "User-facing message with $$**emoji Button**$$ options",
  "agent_data": {
    "actions_performed": [],
    "actions_todo": [],
    "content_preview": {}
  },
  "routing": {
    "target_agent": "agent_id or null",
    "reason": "why routing"
  }
}
```

## FIELD DEFINITIONS
| Field | Type | Description |
|-------|------|-------------|
| `finished` | boolean | true = conversation can end, false = expecting more input |
| `response` | string | User-facing message with buttons |
| `agent_data` | object | Actions, previews, metadata |
| `routing` | object | For redirecting to another agent |

## REDIRECT EXAMPLE
```json
{
  "response": "I'll connect you with the Newsletter Agent! 🚀",
  "routing": {
    "target_agent": "newsletter_multi",
    "reason": "User wants to create newsletter"
  }
}
```

## TEXT FORMATTING
- **Bold** for emphasis
- Bullet points for lists
- ✅ for completed actions
- NO markdown headers (###)
- NO code blocks (unless showing code)
