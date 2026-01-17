# Actions Performed (Child Agents)

Standard actions for ALL child agents (Newsletter, Content Repurposer, SOL, etc.).

**Note:** Personal Assistant has elevated actions in `agents/personal_assistant/actions.md`

---

## Structure

```json
{
  "actions_performed": [
    {
      "action": "action_type",
      "details": "Human readable description",
      "metadata": {}
    }
  ]
}
```

---

## Standard Action Types

| Action Type | When to Use | Example |
|-------------|-------------|---------|
| `content_generated` | Created any content | Generated newsletter draft |
| `content_revised` | Updated content based on feedback | Made tone more casual |
| `search_performed` | Searched KB | Found branding guidelines |
| `data_retrieved` | Pulled specific data | Retrieved company info |
| `info_gathered` | Collected user input | Got topic details |
| `selection_confirmed` | User made a selection | Selected 3 topics |
| `step_completed` | Finished a workflow step | Completed topic 1 of 3 |

---

## Examples

### Content Generated:
```json
{
  "action": "content_generated",
  "details": "Created your newsletter draft",
  "metadata": {
    "content_type": "newsletter",
    "word_count": 850
  }
}
```

### Info Gathered:
```json
{
  "action": "info_gathered",
  "details": "Got details for Industry Insights section",
  "metadata": {
    "section": "Industry Insights",
    "step": "1 of 3"
  }
}
```

### Selection Confirmed:
```json
{
  "action": "selection_confirmed",
  "details": "You selected 3 topics for your newsletter",
  "metadata": {
    "selected": ["Industry Insights", "Education", "Behind The Scenes"]
  }
}
```

### Step Completed:
```json
{
  "action": "step_completed",
  "details": "Finished gathering info for Industry Insights",
  "metadata": {
    "current_step": 1,
    "total_steps": 3,
    "next_step": "Education"
  }
}
```

---

## Rules

1. **Always include** - Even if empty array `[]`
2. **User-friendly details** - Shown directly to users
3. **One action per item** - Don't combine multiple
4. **Past tense** - Describe what WAS done
