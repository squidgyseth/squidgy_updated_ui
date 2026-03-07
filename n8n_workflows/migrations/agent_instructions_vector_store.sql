-- agent_instructions Vector Store
-- Stores embedded instruction documents for agents
-- Created: 2025-01-17

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the agent instructions vector table
CREATE TABLE IF NOT EXISTS public.agent_instructions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Agent reference
  agent_id TEXT NOT NULL,  -- 'personal_assistant', 'newsletter_multi', 'shared', etc.

  -- Document content
  document TEXT NOT NULL,

  -- Source file reference
  source_file TEXT NOT NULL,  -- e.g., 'security_rules.md', 'instructions.md'

  -- Vector embedding (OpenAI text-embedding-ada-002 = 1536 dimensions)
  embedding vector(1536),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for agent_id filtering
CREATE INDEX IF NOT EXISTS idx_ai_agent_id
ON public.agent_instructions(agent_id);

-- Index for source_file filtering
CREATE INDEX IF NOT EXISTS idx_ai_source_file
ON public.agent_instructions(source_file);

-- Composite index for agent + source
CREATE INDEX IF NOT EXISTS idx_ai_agent_source
ON public.agent_instructions(agent_id, source_file);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_ai_embedding
ON public.agent_instructions
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_updated_at
  BEFORE UPDATE ON public.agent_instructions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

-- Grant access for service role (N8N)
GRANT ALL ON public.agent_instructions TO service_role;

-- Comments
COMMENT ON TABLE public.agent_instructions IS 'Vector store for agent instruction documents. Used for RAG-based instruction retrieval.';
COMMENT ON COLUMN public.agent_instructions.agent_id IS 'Agent identifier: personal_assistant, newsletter_multi, shared, etc.';
COMMENT ON COLUMN public.agent_instructions.document IS 'The instruction text content';
COMMENT ON COLUMN public.agent_instructions.source_file IS 'Source file name: security_rules.md, instructions.md, etc.';
COMMENT ON COLUMN public.agent_instructions.embedding IS 'OpenAI embedding vector (1536 dimensions)';

-----------------------------------------------------------
-- AGENT_ID VALUES
-----------------------------------------------------------
-- 'shared'              - Shared docs used by all child agents
-- 'personal_assistant'  - PA-specific + shared (minus actions)
-- 'newsletter_multi'    - Newsletter Multi specific
-- 'content_repurposer'  - Content Repurposer specific
-- 'smm'                 - Social Media Manager specific
-- 'SOL'                 - Solar Sales Assistant specific

-----------------------------------------------------------
-- DOCUMENT MAPPING
-----------------------------------------------------------

-- SHARED (agent_id = 'shared'):
-- - security_rules.md
-- - button_patterns.md
-- - response_format.md
-- - content_previews.md
-- - actions_performed.md
-- - actions_todo.md

-- PERSONAL_ASSISTANT (agent_id = 'personal_assistant'):
-- - instructions.md (PA specific)
-- - actions_performed.md (PA elevated)
-- - actions_todo.md (PA elevated)
-- - security_rules.md (from shared)
-- - button_patterns.md (from shared)
-- - response_format.md (from shared)
-- - content_previews.md (from shared)
-- NOTE: Does NOT include shared/actions_performed.md or shared/actions_todo.md

-----------------------------------------------------------
-- EXAMPLE QUERIES
-----------------------------------------------------------

-- Get all instructions for Personal Assistant:
-- SELECT document, source_file FROM public.agent_instructions
-- WHERE agent_id = 'personal_assistant'
-- ORDER BY source_file;

-- Semantic search for relevant instructions:
-- SELECT document, source_file, embedding <=> '[query_embedding]'::vector AS distance
-- FROM public.agent_instructions
-- WHERE agent_id = 'personal_assistant'
-- ORDER BY distance
-- LIMIT 5;

-- Get specific instruction file:
-- SELECT document FROM public.agent_instructions
-- WHERE agent_id = 'personal_assistant' AND source_file = 'security_rules.md';
