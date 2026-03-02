# Unified File Upload Strategy (Revised)

## 🎯 Goals

1. **Single Database**: `firm_users_knowledge_base` (Supabase) for ALL file records
2. **Unified Endpoint**: `POST /api/file/process` for both Agent Settings and Chat documents
3. **Frontend Duplicate Check**: Query existing files before upload, prompt user
4. **Chat File Types**:
   - **Images** (PNG, JPG, JPEG): Current flow → Supabase `newsletter` → n8n with URL
   - **Documents** (PDF, DOCX, TXT, MD): Unified flow → Same as Agent Settings
5. **n8n Integration**: Send extracted text (not URL) for documents
6. **Deactivate**: `/api/file/extract-text` calls from n8n

---

## 📋 Architecture

### **Database 1**: `firm_users_knowledge_base` (Supabase PostgreSQL)

**Purpose**: File management, duplicate checking, status tracking, links to Neon records

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `file_id` | String | Unique identifier (format: `file_{uuid}`) |
| `firm_user_id` | String | User ID (part of unique constraint) |
| `file_name` | String | Original filename (part of unique constraint) |
| `file_url` | String | Supabase storage URL |
| `agent_id` | String | Agent ID |
| `agent_name` | String | Agent name |
| `processing_status` | String | pending/processing/completed/failed |
| `error_message` | String | Error details if failed |
| `neon_record_ids` | JSONB | Array of Neon record IDs for this file's chunks |
| `source` | String | 'agent_settings' or 'chat' |
| `created_at` | Timestamp | Record creation |
| `updated_at` | Timestamp | Last update |

**Unique Constraint**: `(firm_user_id, file_name)`

**Note**: `extracted_text` column REMOVED - all text stored in Neon only

### **Database 2**: `user_vector_knowledge_base` (Neon PostgreSQL)

**Purpose**: Vector storage for RAG, chunked text with embeddings

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Serial | Primary key (referenced by Supabase) |
| `user_id` | String | User ID |
| `agent_id` | String | Agent ID |
| `document` | Text | Text chunk content |
| `embedding` | Vector | OpenAI embedding for similarity search |
| `category` | String | 'documents', 'custom_instructions', etc. |
| `source` | String | 'agent_settings', 'chat', etc. |
| `file_name` | String | Original filename |
| `file_url` | String | Supabase storage URL |
| `created_at` | Timestamp | Record creation |
| `updated_at` | Timestamp | Last update |

**Note**: Multiple records per file (one per chunk)

### **Storage**: Supabase `newsletter` bucket (unified)

All files (documents + images) stored in same bucket with path:
`{userId}_{timestamp}_{filename}`

---

## 🔗 Database Relationship

```
firm_users_knowledge_base (Supabase)          user_vector_knowledge_base (Neon)
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│ file_id: "file_abc123"          │           │ id: 1001                        │
│ firm_user_id: "user_xyz"        │           │ user_id: "user_xyz"             │
│ file_name: "document.pdf"       │           │ agent_id: "agent_1"             │
│ file_url: "https://..."         │           │ document: "Chunk 1 text..."     │
│ agent_id: "agent_1"             │           │ embedding: [0.1, 0.2, ...]      │
│ processing_status: "completed"  │           │ file_name: "document.pdf"       │
│ neon_record_ids: [1001,1002,    │──────────▶│ file_url: "https://..."         │
│                   1003]         │           ├─────────────────────────────────┤
│ source: "chat"                  │           │ id: 1002                        │
└─────────────────────────────────┘           │ document: "Chunk 2 text..."     │
                                              │ ...                             │
                                              ├─────────────────────────────────┤
                                              │ id: 1003                        │
                                              │ document: "Chunk 3 text..."     │
                                              │ ...                             │
                                              └─────────────────────────────────┘
```

### **Benefits of This Architecture**:
1. **No duplicate text storage** - extracted text only in Neon
2. **Easy file management** - Supabase tracks all files with Neon references
3. **Efficient deletion** - Delete file → use neon_record_ids to delete all chunks
4. **Status tracking** - Supabase handles processing status
5. **Vector search** - Neon handles RAG with embeddings

---

## 🔄 Unified Flow

### **Step 1: Frontend Duplicate Check (Both Flows)**

```typescript
// Shared function for both Agent Settings and Chat
const checkDuplicates = async (files: File[]) => {
  // Get user's existing files from firm_users_knowledge_base
  const response = await fetch(
    `${backendUrl}/api/files/user/${userId}?agent_id=${agentId}`
  );
  const { data: existingFiles } = await response.json();
  
  const duplicates = files.filter(file => 
    existingFiles.some(existing => existing.file_name === file.name)
  );
  
  return duplicates;
};
```

### **Step 2: Prompt User for Duplicates**

```typescript
// If duplicates found, show dialog
if (duplicates.length > 0) {
  const confirmed = await showDialog({
    title: 'Files Already Exist',
    message: `The following files already exist:\n${duplicates.map(f => f.name).join('\n')}\n\nReplace them?`,
    buttons: ['Cancel', 'Replace']
  });
  
  if (!confirmed) return; // User cancelled
}
```

### **Step 3: Upload to Supabase Storage (Frontend)**

```typescript
// Same for both Agent Settings and Chat documents
const uploadToStorage = async (file: File) => {
  const timestamp = Date.now();
  const fileName = `${userId}_${timestamp}_${sanitize(file.name)}`;
  
  const { data } = await supabase.storage
    .from('newsletter')
    .upload(fileName, file);
  
  return supabase.storage.from('newsletter').getPublicUrl(data.path).data.publicUrl;
};
```

### **Step 4: Call Unified Backend Endpoint**

```typescript
// POST /api/file/process - Same endpoint for both flows
const processFile = async (file: File, fileUrl: string, source: string) => {
  const formData = new FormData();
  formData.append('firm_user_id', userId);
  formData.append('file_name', file.name);  // Original filename
  formData.append('file_url', fileUrl);
  formData.append('agent_id', agentId);
  formData.append('agent_name', agentName);
  formData.append('source', source);  // 'agent_settings' or 'chat'
  
  const response = await fetch(`${backendUrl}/api/file/process`, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

### **Step 5: Backend Processing**

Backend `/api/file/process` already:
1. Checks for existing record (same firm_user_id + file_name)
2. Deletes old storage file if exists
3. Updates or inserts record in `firm_users_knowledge_base`
4. Starts background text extraction
5. Returns file_id for status tracking

### **Step 6: Poll Status & Get Extracted Text**

```typescript
const waitForExtraction = async (fileId: string) => {
  return new Promise((resolve) => {
    const poll = async () => {
      const response = await fetch(`${backendUrl}/api/file/status/${fileId}`);
      const { data } = await response.json();
      
      if (data.status === 'completed') {
        resolve(data.extracted_text);
      } else if (data.status === 'failed') {
        resolve(null);
      } else {
        setTimeout(poll, 5000); // Poll every 5s
      }
    };
    poll();
  });
};
```

---

## 🔀 Flow Differences

### **Agent Settings Flow**

```
1. User selects files
2. Frontend checks duplicates via GET /api/files/user/{userId}
3. If duplicates → Show dialog → User confirms
4. Frontend uploads to Supabase Storage (newsletter)
5. Frontend calls POST /api/file/process (source='agent_settings')
6. Backend: Delete old file if exists → Update/Insert record → Extract text
7. Frontend subscribes to SSE for progress
8. On completion: Refresh files list
```

### **Chat Flow - Documents**

```
1. User selects file
2. Check file type → If document (PDF/DOCX/TXT/MD):
3. Frontend checks duplicates via GET /api/files/user/{userId}
4. If duplicate → Show confirm() → User confirms
5. Frontend uploads to Supabase Storage (newsletter)
6. Frontend calls POST /api/file/process (source='chat')
7. Backend: Delete old file if exists → Update/Insert record → Extract text
8. Frontend polls status every 5s
9. On completion: Get extracted_text
10. Send message to n8n WITH extracted_text (not URL)
```

### **Chat Flow - Images** (Unchanged)

```
1. User selects file
2. Check file type → If image (PNG/JPG/JPEG):
3. Frontend uploads to Supabase Storage (newsletter)
4. Get public URL
5. Send message to n8n WITH image URL
```

---

## 🛠️ Implementation Changes

### **1. Agent Settings Frontend** (`AgentSettings.tsx`)

**Current**: Uses `POST /api/knowledge-base/file` (backend receives file)
**Change to**: 
- Upload to Supabase Storage first (like Chat)
- Call `POST /api/file/process` with URL
- Add duplicate check before upload

```typescript
// New handleSubmit for Agent Settings
const handleSubmit = async () => {
  // 1. Check duplicates
  const duplicates = await checkDuplicates(uploadedFiles);
  if (duplicates.length > 0) {
    const confirmed = await showDuplicateDialog(duplicates);
    if (!confirmed) return;
  }
  
  // 2. Upload each file to Supabase Storage
  for (const file of uploadedFiles) {
    const fileUrl = await uploadToStorage(file);
    
    // 3. Call unified endpoint
    const result = await processFile(file, fileUrl, 'agent_settings');
    
    // 4. Subscribe to SSE for status
    subscribeToFileStatus(result.file_id);
  }
};
```

### **2. Chat Frontend** (`N8nChatInterface.tsx`)

**Current**: All files → Supabase Storage → `/api/file/process`
**Change to**: 
- Differentiate images vs documents
- Documents: Add duplicate check + send extracted text to n8n
- Images: Keep current flow (send URL to n8n)

```typescript
const handleAttachmentClick = () => {
  fileInput.onchange = async (e) => {
    const file = e.target.files?.[0];
    
    const isImage = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type);
    const isDocument = ['application/pdf', 'text/plain', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(file.type);
    
    if (isImage) {
      await handleImageUpload(file);
    } else if (isDocument) {
      await handleDocumentUpload(file);
    }
  };
};

const handleImageUpload = async (file: File) => {
  // Current flow - unchanged
  const fileUrl = await uploadToStorage(file);
  await sendMessageToN8n({
    text: `I've uploaded an image: ${file.name}`,
    imageUrl: fileUrl
  });
};

const handleDocumentUpload = async (file: File) => {
  // 1. Check duplicates
  const duplicates = await checkDuplicates([file]);
  if (duplicates.length > 0) {
    const confirmed = confirm(`File "${file.name}" already exists. Replace it?`);
    if (!confirmed) return;
  }
  
  // 2. Upload to storage
  const fileUrl = await uploadToStorage(file);
  
  // 3. Process file
  const result = await processFile(file, fileUrl, 'chat');
  
  // 4. Wait for extraction
  const extractedText = await waitForExtraction(result.file_id);
  
  // 5. Send to n8n with extracted text
  await sendMessageToN8n({
    text: `I've uploaded a document: ${file.name}`,
    documentText: extractedText,
    fileName: file.name
  });
};
```

### **3. Backend** (`main.py`)

**No major changes needed!** The existing `/api/file/process` endpoint already:
- Handles duplicate checking via unique constraint
- Deletes old storage files
- Extracts text in background
- Updates `firm_users_knowledge_base`

**Optional**: Add `source` field to track where file came from:

```python
# In file_processing_service.py create_processing_record()
record_data = {
    ...
    "source": source  # 'agent_settings' or 'chat'
}
```

### **4. n8n Workflow**

**Before**:
```javascript
if (fileUrl) {
  // Call /api/file/extract-text
  const { extracted_text } = await extractText(fileUrl);
}
```

**After**:
```javascript
if (documentText) {
  // Use documentText directly - no API call needed
  agentContext.documentContent = documentText;
} else if (imageUrl) {
  // Handle image URL
  agentContext.imageUrl = imageUrl;
}
```

---

## 📊 Summary: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| **File Records DB** | Agent Settings: Neon, Chat: Supabase | Both: Supabase `firm_users_knowledge_base` |
| **Storage Bucket** | Agent Settings: `agentkbs`, Chat: `newsletter` | Both: `newsletter` |
| **Duplicate Check** | Chat only (backend) | Both (frontend) |
| **User Prompt** | None | Both show dialog |
| **Endpoint** | Agent Settings: `/api/knowledge-base/file`, Chat: `/api/file/process` | Both: `/api/file/process` |
| **n8n Documents** | Receives URL, calls `/api/file/extract-text` | Receives extracted text directly |
| **n8n Images** | Receives URL | Receives URL (unchanged) |
| **Extractions** | Chat: 2x (status + n8n) | Chat: 1x (unified) |

---

## ✅ Benefits

1. **Single source of truth**: All files in `firm_users_knowledge_base`
2. **Consistent UX**: Same duplicate handling in both flows
3. **Efficient**: Extract text once, use everywhere
4. **Clean n8n**: Receives ready-to-use text for documents
5. **Simpler backend**: One endpoint, one database
6. **Better file management**: Easy to list/delete all user files

---

## � Implementation Order

1. ✅ Add `source` column to `firm_users_knowledge_base` (optional)
2. ⬜ Update Agent Settings frontend:
   - Add duplicate check function
   - Add duplicate dialog component
   - Change to upload to Supabase first, then call `/api/file/process`
3. ⬜ Update Chat frontend:
   - Add file type detection
   - Add duplicate check for documents
   - Send extracted text to n8n for documents
   - Keep image flow unchanged
4. ⬜ Update n8n workflow:
   - Handle `documentText` field
   - Remove `/api/file/extract-text` calls
5. ⬜ Test both flows
6. ⬜ Update documentation

---

## 📝 Files to Modify

### Frontend
- `AgentSettings.tsx` - Add duplicate check, change upload method
- `N8nChatInterface.tsx` - Add file type detection, duplicate check for docs

### Backend
- `file_processing_service.py` - Add `source` field (optional)
- No other backend changes needed!

### n8n
- Update workflow to handle `documentText` instead of calling extract endpoint
- Both flows check duplicates and prompt user
- n8n receives ready-to-use content (text or image URL)
- No more double extraction
- Single source of truth (Neon DB for documents)
