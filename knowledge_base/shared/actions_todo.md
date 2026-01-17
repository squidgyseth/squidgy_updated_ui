# Actions Todo (Child Agents)

Standard todos for ALL child agents (Newsletter, Content Repurposer, SOL, etc.).

**Note:** Personal Assistant has elevated todos in `agents/personal_assistant/actions.md`

---

## Structure

```json
{
  "actions_todo": [
    {
      "action": "action_type",
      "details": "Human readable description",
      "priority": "high|medium|low",
      "metadata": {}
    }
  ]
}
```

---

## Standard Action Types

| Action Type | When to Use | Example |
|-------------|-------------|---------|
| `awaiting_selection` | User needs to pick options | Select topics |
| `awaiting_input` | Need text/info from user | Describe your audience |
| `awaiting_approval` | Content ready for review | Approve newsletter draft |
| `awaiting_confirmation` | Yes/no decision needed | Confirm before sending |
| `step_pending` | Next step in workflow | Move to next topic |

---

## Priority Levels

| Priority | When to Use | UI Treatment |
|----------|-------------|--------------|
| `high` | Blocking - user must act | Prominent, amber |
| `medium` | Recommended | Standard |
| `low` | Optional | Subtle |

---

## Examples

### Awaiting Selection:
```json
{
  "action": "awaiting_selection",
  "details": "Select 2-4 topics for your newsletter",
  "priority": "high",
  "metadata": {
    "options_count": 7,
    "min": 2,
    "max": 4
  }
}
```

### Awaiting Input:
```json
{
  "action": "awaiting_input",
  "details": "What problem does your audience commonly face?",
  "priority": "high",
  "metadata": {
    "current_topic": "Education",
    "question": "1 of 3"
  }
}
```

### Awaiting Approval:
```json
{
  "action": "awaiting_approval",
  "details": "Review and approve your newsletter draft",
  "priority": "high",
  "metadata": {
    "preview_available": true,
    "can_edit": true,
    "can_regenerate": true
  }
}
```

### Step Pending:
```json
{
  "action": "step_pending",
  "details": "Ready to move to next topic: Behind The Scenes",
  "priority": "medium",
  "metadata": {
    "next_step": "Behind The Scenes",
    "step": "3 of 3"
  }
}
```

---

## Rules

1. **Always include** - Even if empty array `[]`
2. **Actionable only** - User must be able to act on it
3. **Clear next step** - Details tell user what to do
4. **Set priority** - High = blocking, Low = optional
