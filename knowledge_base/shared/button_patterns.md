# Button Patterns

Standard button formatting patterns for all Squidgy agents.

---

## BUTTON SYNTAX

### Format 1: Simple Button (title only)
```
$$**emoji Text Here**$$
```

### Format 2: Button with Description (use `|` delimiter)
```
$$**emoji Title|Description text here**$$
```

**Regex Pattern:**
```regex
\$\$\*\*(.+?)(?:\|(.+?))?\*\*\$\$
```
- Group 1: Title (with emoji)
- Group 2: Description (optional)

---

## EXAMPLES

### Simple Buttons:
```
$$**📧 Create Newsletter**$$
$$**✅ Yes, continue**$$
$$**❌ No, cancel**$$
$$**⏭️ Skip for now**$$
```

### Buttons with Descriptions:
```
$$**👔 B2B Decision Makers|CTOs, CEOs, Directors, Enterprise buyers**$$
$$**👩‍💻 Tech Professionals|Developers, Engineers, IT teams**$$
$$**🏪 Small Business Owners|Entrepreneurs, Startups, SMBs**$$
$$**✅ Professional & Authoritative|Formal, expert-driven content**$$
$$**💬 Friendly & Conversational|Casual, approachable tone**$$
```

### UI Rendering (with description):
```
┌─────────────────────────────────────────┐
│ 👔 B2B Decision Makers                  │
│ CTOs, CEOs, Directors, Enterprise buyers│
└─────────────────────────────────────────┘
```

---

## BUTTON CATEGORIES

### Navigation Buttons
Used to redirect users to other agents or pages:
```
$$**💬 Start Chat with [Agent Name]**$$
$$**🏠 Go to Dashboard**$$
$$**⚙️ Open Settings**$$
```

### Action Buttons
Used to trigger specific actions:
```
$$**✅ Approve & Send**$$
$$**📝 Edit**$$
$$**🔄 Regenerate**$$
$$**📤 Export**$$
```

### Confirmation Buttons
Used for yes/no decisions:
```
$$**✅ Yes, continue**$$
$$**❌ No, cancel**$$
$$**⏭️ Skip for now**$$
```

### Setup Buttons
Used during onboarding:
```
$$**➕ Add Another Assistant|Set up more agents**$$
$$**📅 Google Calendar|Sync with your Google account**$$
$$**📆 Outlook Calendar|Sync with Microsoft Outlook**$$
$$**⏭️ Skip for now|I'll set this up later**$$
$$**🔔 Enable Notifications|Get alerts for tasks and updates**$$
$$**🔕 Disable Notifications|I'll check manually**$$
```

---

## BUTTON RULES

1. **One button per line** - Don't put multiple buttons on same line
2. **Include emoji** - Start with relevant emoji for visual distinction
3. **Keep title concise** - 2-5 words ideal
4. **Use action verbs** - "Create", "Edit", "Send", not "Newsletter"
5. **Consistent casing** - Title Case for button text
6. **Use `|` for descriptions** - When button needs explanation, use pipe delimiter
7. **Keep descriptions short** - One line, max ~50 characters
8. **Order matters** - Buttons render in the order they appear in the message

---

## SPECIAL BUTTON PATTERNS

### Agent Navigation
When user should navigate to another agent:
```
$$**💬 Start Chat with Newsletter Agent Multi**$$
```
The UI will:
1. Extract agent name from button text
2. Map to agent_id using AgentMappingService
3. Navigate to `/chat/{agent_id}`

### Calendar Connection
```
$$**📅 Google Calendar|Sync with your Google account**$$
$$**📆 Outlook Calendar|Sync with Microsoft Outlook**$$
$$**⏭️ Skip for now|I'll set this up later**$$
```
The UI handles OAuth flow automatically when user selects Google or Outlook.
Value stored: `google`, `outlook`, or `skip`

### Add Assistant
```
$$**➕ Add Another Assistant**$$
```
Triggers the onboarding flow for additional agents.

---

## DO NOT USE

- Markdown links `[text](url)` - Use buttons instead
- Raw URLs - Never expose URLs to users
- Multiple buttons on same line
- Buttons without emojis
- Very long button text (>6 words)
