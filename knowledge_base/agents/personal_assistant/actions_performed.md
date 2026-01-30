# Personal Assistant - Actions Performed (Elevated)

**What goes in actions_performed:** Backend operations the AGENT executed (tools, KB operations, web analysis)

## Standard Action Structure

**EVERY action must follow this structure:**
```json
{
  "action": "action_name",     // The type of action performed
  "details": "Description",    // Human-readable description of what happened
  "metadata": {                // Additional structured data about the action
    // Relevant data here (category, entry_id, urls, etc.)
  }
}
```

---

## Elevated Action Types (Backend Operations)

| Action Type | Description | Example |
|-------------|-------------|---------|
| `business_context_collected` | Got business info (website or manual) | Analyzed website, extracted brand |
| `website_analyzed` | Scraped and analyzed website | Extracted branding from homepage |
| `kb_saved` | Saved to any KB category | Saved company overview |
| `kb_updated` | Updated existing KB data | Updated branding colors |
| `kb_deleted` | Removed KB data | Deleted outdated product info |
| `tool_executed` | Ran a specific tool | Executed Vector Search |
| `settings_saved` | Saved user settings to backend | Saved timezone preference |

**Note:** Actions like `agent_enabled`, `user_routed` go in **actions_todo** (UI operations), not here!

---

## Examples

### Business Context Collected:
```json
{
  "action": "business_context_collected",
  "details": "Learned about your business from website analysis",
  "metadata": {
    "source": "website_analysis",
    "url": "https://example.com",
    "categories_populated": ["website", "company", "branding", "products"],
    "ready_for_agent_setup": true
  }
}
```

### Website Analyzed:
```json
{
  "action": "website_analyzed",
  "details": "Analyzed your website and extracted branding information",
  "metadata": {
    "url": "https://example.com",
    "extracted_data": {
      "categories": ["branding_identity", "company_overview"],
      "fields": ["colors", "logo_url", "tagline", "company_name"]
    },
    "saved_to_kb": true
  }
}
```

### KB Saved:
```json
{
  "action": "kb_saved",
  "details": "Saved company overview to knowledge base",
  "metadata": {
    "category": "company",
    "entry_id": "kb_123",
    "content_preview": "Acme Corp is a leading provider..."
  }
}
```

### KB Updated:
```json
{
  "action": "kb_updated",
  "details": "Updated branding colors in knowledge base",
  "metadata": {
    "category": "branding",
    "entry_id": "kb_456",
    "fields_updated": ["primary_color", "secondary_color"]
  }
}
```
