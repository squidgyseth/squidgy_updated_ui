# Actions Format

## ACTIONS PERFORMED
Track completed actions in `agent_data.actions_performed`:

```json
{
  "actions_performed": [
    {
      "action": "content_generated",
      "details": "Created newsletter draft",
      "status": "completed"
    }
  ]
}
```

### Action Types
| Type | When to Use |
|------|-------------|
| `content_generated` | Created content |
| `content_revised` | Updated based on feedback |
| `search_performed` | Searched KB |
| `data_retrieved` | Pulled specific data |
| `info_gathered` | Collected user input |
| `selection_confirmed` | User made selection |
| `step_completed` | Finished workflow step |
| `agent_enabled` | Enabled an agent |
| `settings_saved` | Saved user settings |

## ACTIONS TODO
Track pending actions in `agent_data.actions_todo`:

```json
{
  "actions_todo": [
    {
      "action": "awaiting_selection",
      "details": "Select brand voice",
      "priority": "high"
    }
  ]
}
```

### Todo Types
| Type | When to Use |
|------|-------------|
| `awaiting_selection` | User needs to pick options |
| `awaiting_input` | Need text from user |
| `awaiting_approval` | Content ready for review |
| `awaiting_confirmation` | Yes/no decision needed |
| `step_pending` | Next workflow step |

### Priority Levels
| Priority | Meaning |
|----------|---------|
| `high` | Blocking - user must act |
| `medium` | Recommended |
| `low` | Optional |

## RULES
1. Always include arrays (even if empty `[]`)
2. Details should be user-friendly
3. One action per item
4. Use past tense for performed, future for todo
