# Response Format

## JSON STRUCTURE (Required for ALL agents)
```json
{
  "finished": true,
  "response": "User-facing message with $$**emoji Button**$$ options",
  "agent_data": {
    "actions_performed": [],
    "actions_todo": [],
    "state": {},
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
| `finished` | boolean | true = task complete / can end, false = expecting more input |
| `response` | string | User-facing message with buttons |
| `agent_data` | object | Actions, state, previews, metadata |
| `agent_data.state` | object | Agent-specific conversation state tracking |
| `agent_data.content_preview` | object | Generated content for rendering |
| `agent_data.lead_info` | object | Sales/qualification data (sales agents) |
| `routing` | object | For redirecting to another agent (PA only) |

## AGENT_DATA EXAMPLES

### Content Agents (Newsletter, SMM, Content Repurposer):
```json
"agent_data": {
  "state": { "phase": "gathering", "current_topic_index": 1 },
  "content_preview": { "type": "newsletter", "content": "..." }
}
```

### Sales Agents (SOL):
```json
"agent_data": {
  "state": { "phase": "qualification", "qualified": false },
  "lead_info": { "lead_score": 45, "property_type": "single_family" }
}
```

### Routing Agent (PA):
```json
"agent_data": {
  "actions_performed": [{"action": "agent_enabled", "status": "completed"}],
  "agent_id": "newsletter_multi"
}
```

## TEXT FORMATTING
- **Bold** for emphasis
- Bullet points for lists
- ✅ for completed actions
- NO markdown headers (###)
- NO code blocks (unless showing code)
