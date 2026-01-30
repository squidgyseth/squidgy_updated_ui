# File Metadata Tracking Implementation

## Overview
Track uploaded file metadata (filename + Supabase Storage URL) in the `user_vector_knowledge_base` table for knowledge base entries created from file uploads.

## Problem
When users uploaded files via:
- Chat page upload button
- Agent Settings page save button

The file content was extracted and stored as embeddings, but **file metadata was lost**. Users couldn't see which files were uploaded or access the original files.

## Solution

### 1. Database Migration ✅
**File**: `database/migrations/add_file_metadata_to_knowledge_base.sql`

Added two columns to `user_vector_knowledge_base` table:
```sql
ALTER TABLE public.user_vector_knowledge_base
ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT NULL;

ALTER TABLE public.user_vector_knowledge_base
ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT NULL;
```

**Usage**:
- `file_name`: Original filename (e.g., "report.pdf", "document.docx")
- `file_url`: Supabase Storage URL for accessing the file
- Both are `NULL` for text entries (not file uploads)

**To Apply**: Run this migration in Neon Postgres database

### 2. N8N Workflow Update ✅
**File**: `n8n_workflows/SA_Knowledge_Base_Save.json`

**Changes Made**:

#### A. Process File Chunks Node (Line 91)
Added `file_name` and `file_url` to output:
```javascript
const fileName = webhook.file_name || backendResponse.file_name || 'uploaded_file';
const fileUrl = webhook.file_url || null;

// Each chunk now includes:
{
  user_id: webhook.user_id,
  agent_id: webhook.agent_id,
  category: webhook.category || 'documents',
  document: `File: ${fileName} [Part ${index + 1}/${chunks.length}]\\n\\n${chunk}`,
  source: 'file_upload',
  file_name: fileName,      // ✅ NEW
  file_url: fileUrl,        // ✅ NEW
  chunk_index: index,
  total_chunks: chunks.length
}
```

#### B. Insert to Neon Node (Line 173)
Updated INSERT query:
```sql
-- BEFORE:
INSERT INTO public.user_vector_knowledge_base
(user_id, document, category, embedding, source)
VALUES (...)

-- AFTER:
INSERT INTO public.user_vector_knowledge_base
(user_id, document, category, embedding, source, file_name, file_url)
VALUES (
  '{{ $('Merge Paths').item.json.user_id }}',
  '{{ $('Merge Paths').item.json.document.replace(/'/g, "''").replace(/\\n/g, ' ') }}',
  '{{ $('Merge Paths').item.json.category }}',
  '{{ JSON.stringify($json.data[0].embedding) }}',
  '{{ $('Merge Paths').item.json.source }}',
  '{{ $('Merge Paths').item.json.file_name || null }}',  -- ✅ NEW
  '{{ $('Merge Paths').item.json.file_url || null }}'   -- ✅ NEW
)
```

#### C. Overview Documentation (Line 6)
Updated to reflect new columns in table schema

### 3. Frontend (No Changes Required)
Frontend already sends `file_name` and `file_url` in webhook payload:
```typescript
{
  user_id: userId,
  agent_id: agentId,
  type: 'file',
  file_url: supabaseStorageUrl,
  file_name: originalFileName,
  category: 'documents'
}
```

## Flow Diagram

```
┌─────────────────┐
│  Frontend       │
│  Upload File    │
└────────┬────────┘
         │
         │ Sends: { user_id, agent_id, type: 'file',
         │         file_url, file_name, category }
         ▼
┌─────────────────┐
│ N8N Webhook     │
│ save-knowledge  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract Text    │ Calls backend /api/file/extract-text
│ (Backend)       │ Returns: { chunks, file_name, ... }
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process File    │ Adds file_name + file_url to each chunk
│ Chunks          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate        │
│ Embeddings      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ INSERT to user_vector_knowledge_base │
│                                      │
│ Stores:                              │
│ - user_id                            │
│ - document (chunked text)            │
│ - category                           │
│ - embedding (vector)                 │
│ - source ('file_upload')             │
│ - file_name ('report.pdf') ✅        │
│ - file_url (supabase URL) ✅         │
└──────────────────────────────────────┘
```

## Database Schema

```sql
CREATE TABLE public.user_vector_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document TEXT NOT NULL,
  category TEXT NOT NULL,
  embedding VECTOR(1536),
  source TEXT DEFAULT 'N8N-agent',
  file_name TEXT DEFAULT NULL,        -- ✅ NEW
  file_url TEXT DEFAULT NULL,         -- ✅ NEW
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Usage Examples

### Query all files uploaded by a user:
```sql
SELECT DISTINCT file_name, file_url, created_at
FROM user_vector_knowledge_base
WHERE user_id = 'user-uuid-here'
  AND source = 'file_upload'
  AND file_name IS NOT NULL
ORDER BY created_at DESC;
```

### Get all chunks for a specific file:
```sql
SELECT document, chunk_index, total_chunks
FROM user_vector_knowledge_base
WHERE user_id = 'user-uuid-here'
  AND file_url = 'https://...'
ORDER BY chunk_index;
```

### Download link for a file:
```sql
SELECT file_url
FROM user_vector_knowledge_base
WHERE id = 'record-uuid-here'
  AND file_url IS NOT NULL
LIMIT 1;
```

## Testing

1. **Run migration** in Neon Postgres
2. **Import updated workflow** to n8n at https://n8n.theaiteam.uk
3. **Test file upload**:
   - Go to Agent Settings page
   - Upload a PDF/DOCX file
   - Save
4. **Verify in database**:
   ```sql
   SELECT file_name, file_url, document
   FROM user_vector_knowledge_base
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

Expected: `file_name` and `file_url` should be populated for file uploads

## Benefits

✅ **Track file sources** - Know which file each chunk came from
✅ **Download original files** - Access Supabase Storage URLs
✅ **Better UX** - Show users their uploaded files
✅ **Debugging** - Identify which file caused issues
✅ **Future features** - Enable file management UI

## Backend API Integration ✅

**Files Created**:
- `/server/routes/knowledge-base.ts` - API route handlers for Neon queries
- `/server/routes/knowledge-base-router.ts` - Express router for knowledge-base endpoints

**Endpoints Created**:
1. `GET /api/knowledge-base/files/:userId`
   - Queries Neon database for uploaded files
   - Returns deduplicated list of files with metadata
   - Example response:
     ```json
     {
       "success": true,
       "files": [
         {
           "file_name": "document.pdf",
           "file_url": "https://...",
           "created_at": "2026-01-30T..."
         }
       ]
     }
     ```

2. `GET /api/knowledge-base/instructions/:userId`
   - Queries Neon database for custom instructions
   - Combines all instruction chunks into single string
   - Example response:
     ```json
     {
       "success": true,
       "instructions": "Combined instruction text..."
     }
     ```

**Frontend Integration** (`/client/pages/AgentSettings.tsx`):
- Updated to call backend API endpoints instead of querying Supabase
- Fetches files and instructions on component mount
- Displays loading state while fetching data

**Environment Variables** (`.env.example`):
- Added `NEON_API_URL` - Neon REST API endpoint
- Added `NEON_API_KEY` - Neon API authentication key

## Next Steps

- [x] Run migration in Neon Postgres
- [x] Import workflow to n8n
- [x] Create backend API endpoints for querying Neon
- [x] Update frontend to use backend API
- [ ] Add NEON_API_KEY to production environment variables
- [ ] Test end-to-end file upload and retrieval
- [ ] (Future) Add file deletion functionality
- [ ] (Future) Build advanced file management UI
