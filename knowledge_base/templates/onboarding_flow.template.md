# {AGENT_NAME} - Onboarding Flow

<!--
TEMPLATE INSTRUCTIONS:
This template is for ROUTING/MASTER agents only (like Personal Assistant).
Most agents do NOT need this file - delete if not applicable.

Use this when:
- Agent guides users through multi-step setup
- Agent routes to other agents
- Agent collects user preferences

Delete this file for:
- Content creation agents (Newsletter, SMM)
- Task-specific agents (Email Responder, Meeting Scheduler)
- Domain expert agents (Solar, Legal)
-->

## PHASE DETECTION

Check user's current state to determine the flow:

| Check | Source | If Exists → Action |
|-------|--------|-------------------|
| {CHECK_1} | `{{ variable_1 }}` | Skip / Proceed |
| {CHECK_2} | `{{ variable_2 }}` | Skip / Proceed |
| {CHECK_3} | `{{ variable_3 }}` | Skip / Proceed |

## FLOW DECISION

```
IF {condition_1}:
  → START: {step_name}
ELSE IF {condition_2}:
  → START: {other_step}
ELSE:
  → START: {default_step}
```

---

## FIRST TIME USER - FULL FLOW

### Step 1: {STEP_1_NAME}
**Trigger:** {when this step runs}

"{Message to show user}

$$**emoji Option 1|Description**$$
$$**emoji Option 2|Description**$$"

**After user responds:**
1. {action_1}
2. {action_2}
3. Proceed to Step 2

---

### Step 2: {STEP_2_NAME}
**Trigger:** {when this step runs}

"{Message to show user}

{{ variable_with_options }}"

---

### Step 3: {STEP_3_NAME}
**Trigger:** {when this step runs}

"{Message to show user}"

---

<!-- Add more steps as needed -->

### Completion
"{Completion message}

$$**emoji Primary Action**$$
$$**emoji Secondary Action**$$"

---

## RETURNING USER - SHORTENED FLOW

**When:** {condition for shortened flow}

### Flow: {Step A} → {Step B} → DONE

1. **{Step A}** - {what happens}
2. **{Step B}** - {what happens}
3. **IMMEDIATELY return JSON** - Skip remaining steps

---

## RESPONSE JSON FORMAT

### During Flow (not finished):
```json
{
  "finished": false,
  "response": "{current step message with buttons}",
  "agent_data": {
    "current_step": "{step_name}",
    "actions_todo": [
      {"action": "{next_action}", "priority": "high"}
    ]
  }
}
```

### Flow Complete:
```json
{
  "finished": true,
  "response": "{completion message with action buttons}",
  "agent_data": {
    "{data_field}": "{value}",
    "actions_performed": [
      {"action": "{what_was_done}", "status": "completed"}
    ]
  }
}
```

---

## SKIP HANDLING

When user selects "Skip for now":
1. Acknowledge: "No problem! We can set this up later."
2. Store skip preference if needed
3. Move to next step

---

## CRITICAL RULES

1. **{RULE_1}** - {explanation}
2. **{RULE_2}** - {explanation}
3. **Always offer skip option** for optional steps
4. **Detect returning users** - Use shortened flow when applicable
5. **Track progress** - Use actions_performed and actions_todo

---

## DATA REFERENCES

### Available Options:
{{ options_variable_1 }}

### User State:
{{ state_variable }}

### Completion Status:
{{ completion_flag }}

<!--
CHECKLIST BEFORE FINALIZING:
[ ] Total tokens < 600
[ ] All steps have clear triggers
[ ] Skip logic is defined
[ ] JSON formats are valid
[ ] Data references use correct variables
[ ] Rules are specific to this flow
-->
