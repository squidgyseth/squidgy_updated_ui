# Feedback API Documentation

## Overview

The Feedback API provides endpoints for submitting and searching user feedback in the Squidgy platform. The feedback is stored in a Neon PostgreSQL database with vector similarity search capabilities.

## Base URL

```
http://localhost:8000/api/feedback
```

## Endpoints

### 1. Submit Feedback

**POST** `/api/feedback/submit`

Submit new feedback to the database with automatic similarity detection and priority calculation.

#### Request Body

```json
{
  "user_id": "uuid",
  "contact_preference": "no|critical_only|yes",
  "type": "bug_report|feature_request|suggestion|general_feedback",
  "classification_confidence": 0.85,
  "classification_method": "auto_keyword|auto_context|user_selected|user_corrected",
  "content": "Detailed feedback content (minimum 20 characters)",
  "base_score": 6,
  "priority_score": 8,
  "admin_notified": false,
  "attachments": [
    {
      "url": "https://example.com/file.png",
      "description": "Screenshot of issue",
      "filename": "screenshot.png",
      "mime_type": "image/png",
      "size_bytes": 12345
    }
  ],
  "metadata": {
    "keywords_detected": ["scheduling", "error"],
    "user_agent": "Mozilla/5.0...",
    "page_url": "/chat/social_media",
    "category": "ui_ux",
    "feature_area": "social_planner",
    "severity": "high"
  }
}
```

#### Response

```json
{
  "success": true,
  "feedback_id": "uuid",
  "message": "Feedback submitted successfully. Found 2 similar items.",
  "similar_feedback_count": 2,
  "priority_score": 8,
  "admin_notified": false
}
```

### 2. Search Feedback

**POST** `/api/feedback/search`

Search for similar feedback using vector similarity.

#### Request Body

```json
{
  "query": "social media scheduling error",
  "similarity_threshold": 0.75,
  "match_count": 5
}
```

#### Response

```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "content": "Feedback content text...",
      "type": "bug_report",
      "priority_score": 8,
      "base_score": 6,
      "similar_count": 3,
      "similarity_score": 0.87,
      "created_at": "2026-04-08T10:00:00Z"
    }
  ],
  "count": 1
}
```

## Priority Scoring System

The system uses canonical scoring rules:

### Base Score (1-10)
- Critical: 8 (crash, data loss, security, blocking)
- High: 6 (broken, not working, fails, error)
- Medium: 4 (inconsistent, annoying, slow)
- Low: 2 (minor, cosmetic, enhancement)

### Frequency Multiplier (from similar feedback)
- 2-3 similar reports: +1
- 4-7 similar reports: +2
- 8-15 similar reports: +3
- 16+ similar reports: +4

### Final Score
`priority = min(max(base_score + frequency_bonus, 1), 10)`

## Similarity Detection

- Uses pgvector with cosine similarity
- Default threshold: 0.75 for related feedback
- Near-duplicate threshold: 0.90
- Embedding model: OpenAI text-embedding-3-small (1536 dimensions)

## Admin Notifications

- Automatic flagging for priority_score >= 8
- Triggers n8n workflows for email/Slack notifications
- Sets `admin_notified = true` and timestamps

## Error Handling

Common error responses:

```json
{
  "detail": "Invalid user_id: user-not-found"
}
```

```json
{
  "detail": "Failed to generate embedding for feedback content"
}
```

```json
{
  "detail": "Database connection failed: connection timeout"
}
```

## Example Usage for Feedback Fiona:

### 1. Before Submitting - Search for Similar Issues:
```python
# Search for similar feedback first
search_data = {
  "query": user_feedback_text,
  "similarity_threshold": 0.75,
  "match_count": 10
}

response = await client.post("/api/feedback/search", json=search_data)
similar_items = response.json()['results']

# Inform user about similar issues
if similar_items:
    print(f"Found {len(similar_items)} similar reports:")
    for item in similar_items:
        print(f"- {item['content'][:50]}... (similarity: {item['similarity_score']:.2f})")
```

### 2. Submit New Feedback:
```python
# Calculate base score from severity
severity_scores = {
  "critical": 8, "high": 6, "medium": 4, "low": 2
}
base_score = severity_scores.get(detected_severity, 2)  # fallback to 2

# Calculate priority (will be recalculated by server based on similar items)
priority_score = base_score  # Server will add frequency bonus

feedback_data = {
  "user_id": current_user_id,
  "type": "bug_report",
  "content": user_feedback_text,
  "base_score": base_score,
  "priority_score": priority_score,
  "admin_notified": False,  # Optional: Set to True if admin should be notified immediately
  "attachments": attachments,  # Optional: List of attachment objects (auto-calculates count)
  "classification_confidence": 0.85,
  "classification_method": "auto_keyword",
  "metadata": {
    "keywords_detected": extracted_keywords,
    "page_url": current_page,
    "user_agent": browser_info,
    "category": "ui_ux",
    "feature_area": "social_planner",
    "severity": detected_severity
  }
}

response = await client.post("/api/feedback/submit", json=feedback_data)
result = response.json()

if result['success']:
    print(f"Feedback submitted! ID: {result['feedback_id']}")
    print(f"Similar items found: {result['similar_feedback_count']}")
    print(f"Final priority: {result['priority_score']}")
```

## Key Points:

1. **Always search first** - Check for similar feedback before submitting
2. **Use base scoring** - Include severity in base_score (1-10)
3. **Include metadata** - Keywords, page URL, user agent, category, feature_area, severity, etc.
4. **Handle attachments** - Screenshots, files as JSON array
5. **Server recalculates** - Priority will be adjusted based on similar items found

The server will automatically:
- Generate embeddings for similarity search
- Update similar feedback records
- Recalculate priorities based on frequency
- Flag critical items for admin notification

## Database Schema

The feedback is stored in the `feedback_submissions` table with the following key fields:

- `id`: Primary key (UUID)
- `user_id`: User identifier (validated against Supabase profiles)
- `type`: Feedback classification
- `content`: Full feedback text
- `embedding`: Vector for similarity search
- `priority_score`: Calculated importance (1-10)
- `similar_count`: Number of similar reports
- `admin_notified`: Flag for critical issues

## Testing

Run the test script to verify the endpoints:

```bash
cd squidgy_updated_backend
python test_feedback_endpoint.py
```

## Integration with Feedback Fiona

The feedback_fiona agent should use these endpoints to:

1. **Submit feedback**: Call `/api/feedback/submit` after collecting user feedback
2. **Search for duplicates**: Call `/api/feedback/search` before submitting to find similar issues
3. **Update priorities**: The system automatically recalculates priorities when similar feedback is found

The agent should include all relevant metadata and classification information for proper routing and analysis.
