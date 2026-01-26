# {AGENT_NAME} - Custom Instructions

<!--
TEMPLATE INSTRUCTIONS:
This file contains agent-specific customizations that go beyond core instructions.
Use this for:
- Advanced features
- Edge case handling
- Complex logic
- Agent-specific output formats

Keep this file OPTIONAL - only create if needed.
-->

## ADVANCED FEATURES

### {FEATURE_1_NAME}
**When to use:** {trigger condition}

{How this feature works}

**Example:**
```
{input example}
→ {output example}
```

### {FEATURE_2_NAME}
**When to use:** {trigger condition}

{How this feature works}

---

## EDGE CASES

### {EDGE_CASE_1}
**Scenario:** {description}
**Response:** {how to handle}

### {EDGE_CASE_2}
**Scenario:** {description}
**Response:** {how to handle}

---

## OUTPUT VARIATIONS

### {OUTPUT_TYPE_1}
**When:** {condition}
```json
{
  "type": "{type_name}",
  "content": {
    // specific structure
  }
}
```

### {OUTPUT_TYPE_2}
**When:** {condition}
```json
{
  "type": "{type_name}",
  "content": {
    // specific structure
  }
}
```

---

## INTEGRATION NOTES

### With Other Agents
- **{Agent A}**: {how they interact}
- **{Agent B}**: {how they interact}

### With External Tools
- **{Tool/API}**: {integration details}

---

## PERFORMANCE TIPS

- {tip_1}
- {tip_2}
- {tip_3}

<!--
CHECKLIST BEFORE FINALIZING:
[ ] Total tokens < 400
[ ] Only includes content not in main instructions
[ ] Edge cases are realistic
[ ] Output formats are valid JSON
[ ] No duplicate information
-->
