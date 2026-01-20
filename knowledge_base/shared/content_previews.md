# Content Previews

<!-- KEYWORDS: preview, display, render, show, generated content, newsletter preview, social post preview, email preview, HTML preview, comparison, rich content, UI display, iframe, draft -->

When agents generate content, include preview data for rich UI display.

**RETRIEVAL TRIGGERS:** Use this document when generating content that needs visual preview, showing drafts, rendering newsletters, displaying social posts, or any rich content display.

---

## Structure

```json
{
  "preview": {
    "type": "preview_type",
    "title": "Preview title",
    "content": {},
    "actions": []
  }
}
```

---

## Preview Types

| Type | Use Case | Content Fields |
|------|----------|----------------|
| `html_preview` | Newsletter, email, rich content | `html`, `plain_text` |
| `post_preview` | Social media post | `platform`, `text`, `media_urls`, `hashtags` |
| `email_preview` | Email draft | `subject`, `body_html`, `body_text` |
| `image_preview` | Generated/uploaded image | `url`, `alt_text`, `dimensions` |
| `document_preview` | PDF, doc summary | `title`, `summary`, `page_count` |
| `calendar_preview` | Event/meeting | `title`, `date`, `time`, `attendees` |
| `comparison_preview` | Before/after, A/B | `items[]`, `comparison_type` |

---

## Examples

### Newsletter (html_preview):
```json
{
  "preview": {
    "type": "html_preview",
    "title": "Your Newsletter Draft",
    "content": {
      "html": "<div class='newsletter'>...</div>",
      "plain_text": "Newsletter plain text version...",
      "word_count": 850,
      "topics": ["Industry Insights", "Education Tips"]
    },
    "actions": [
      {"label": "Approve & Send", "action": "approve"},
      {"label": "Edit", "action": "edit"},
      {"label": "Regenerate", "action": "regenerate"}
    ]
  }
}
```

### Social Post (post_preview):
```json
{
  "preview": {
    "type": "post_preview",
    "title": "LinkedIn Post Draft",
    "content": {
      "platform": "linkedin",
      "text": "Excited to announce our new feature...",
      "hashtags": ["#SaaS", "#ProductUpdate"],
      "media_urls": [],
      "character_count": 245
    },
    "actions": [
      {"label": "Post Now", "action": "post"},
      {"label": "Schedule", "action": "schedule"},
      {"label": "Edit", "action": "edit"}
    ]
  }
}
```

### Email (email_preview):
```json
{
  "preview": {
    "type": "email_preview",
    "title": "Email Draft",
    "content": {
      "subject": "Quick follow-up from our call",
      "body_html": "<p>Hi {{name}},</p>...",
      "body_text": "Hi {{name}},\n\n...",
      "recipients": ["prospect@example.com"],
      "has_attachments": false
    },
    "actions": [
      {"label": "Send", "action": "send"},
      {"label": "Edit", "action": "edit"},
      {"label": "Save as Template", "action": "save_template"}
    ]
  }
}
```

### Comparison (comparison_preview):
```json
{
  "preview": {
    "type": "comparison_preview",
    "title": "Newsletter Variations",
    "content": {
      "comparison_type": "ab_test",
      "items": [
        {"label": "Version A", "html": "...", "description": "Formal tone"},
        {"label": "Version B", "html": "...", "description": "Casual tone"}
      ]
    },
    "actions": [
      {"label": "Use Version A", "action": "select_a"},
      {"label": "Use Version B", "action": "select_b"},
      {"label": "Regenerate Both", "action": "regenerate"}
    ]
  }
}
```

---

## Preview Actions

Standard actions that can be attached to previews:

| Action | Description |
|--------|-------------|
| `approve` | User approves content as-is |
| `edit` | Open content for editing |
| `regenerate` | Generate new version |
| `send` | Send email/message |
| `post` | Publish to platform |
| `schedule` | Schedule for later |
| `copy` | Copy to clipboard |
| `download` | Download as file |
| `save_template` | Save as reusable template |

---

## Rules

1. **Include when generating content** - Any generated content should have a preview
2. **Match type to content** - Use appropriate preview type
3. **Provide actions** - Always include relevant next-step actions
4. **Plain text fallback** - Include text version for accessibility
5. **Title is required** - Helps user understand what they're looking at

---

## UI Rendering

The UI uses a preview registry to render each type:
- `html_preview` → Sandboxed iframe with HTML content
- `post_preview` → Platform-styled card (LinkedIn, Twitter, etc.)
- `email_preview` → Email client mockup
- `comparison_preview` → Side-by-side cards with selection
