-- ============================================================
-- NEON VECTOR TABLES MIGRATION
-- ============================================================
-- Purpose: Create vector/embedding tables in Neon database
-- These tables store embeddings for RAG-based retrieval
--
-- Tables:
--   1. agent_instructions - Agent instruction embeddings
--   2. user_vector_knowledge_base - User knowledge base embeddings
--
-- Run this in Neon SQL Editor: https://console.neon.tech
-- ============================================================

-- Enable pgvector extension (Neon supports this natively)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for text similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- TABLE 1: agent_instructions
-- ============================================================
-- Stores embedded instruction documents for agents
-- Used for RAG-based instruction retrieval in N8N workflows

CREATE TABLE IF NOT EXISTS agent_instructions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Agent reference
  agent_id TEXT NOT NULL,  -- 'personal_assistant', 'newsletter_multi', 'shared', etc.

  -- Document content
  document TEXT NOT NULL,

  -- Source file reference
  source_file TEXT NOT NULL,  -- e.g., 'security_rules.md', 'instructions.md'

  -- Vector embedding (OpenAI text-embedding-3-small = 1536 dimensions)
  embedding vector(1536),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agent_instructions
CREATE INDEX IF NOT EXISTS idx_ai_agent_id ON agent_instructions(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_source_file ON agent_instructions(source_file);
CREATE INDEX IF NOT EXISTS idx_ai_agent_source ON agent_instructions(agent_id, source_file);

-- Vector similarity search index (IVFFlat for cosine distance)
CREATE INDEX IF NOT EXISTS idx_ai_embedding
ON agent_instructions
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_updated_at ON agent_instructions;
CREATE TRIGGER ai_updated_at
  BEFORE UPDATE ON agent_instructions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

-- ============================================================
-- TABLE 2: user_vector_knowledge_base
-- ============================================================
-- Stores business information with vector embeddings for semantic search
-- Used for RAG-based knowledge retrieval per user

CREATE TABLE IF NOT EXISTS user_vector_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User reference (matches Supabase profiles.user_id)
  user_id UUID NOT NULL,

  -- Document content (the actual text stored)
  document TEXT NOT NULL,

  -- Category for filtering
  category TEXT NOT NULL,

  -- Vector embedding (OpenAI text-embedding-3-small = 1536 dimensions)
  embedding vector(1536),

  -- Source of the data
  source TEXT DEFAULT 'N8N-agent',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_vector_knowledge_base
CREATE INDEX IF NOT EXISTS idx_uvkb_user_id ON user_vector_knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_uvkb_category ON user_vector_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_uvkb_user_category ON user_vector_knowledge_base(user_id, category);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_uvkb_embedding
ON user_vector_knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Text similarity index (for smart delete)
CREATE INDEX IF NOT EXISTS idx_uvkb_document_trgm
ON user_vector_knowledge_base
USING GIN (document gin_trgm_ops);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_uvkb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS uvkb_updated_at ON user_vector_knowledge_base;
CREATE TRIGGER uvkb_updated_at
  BEFORE UPDATE ON user_vector_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_uvkb_updated_at();

-- ============================================================
-- TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE agent_instructions IS 'Vector store for agent instruction documents. Used for RAG-based instruction retrieval.';
COMMENT ON COLUMN agent_instructions.agent_id IS 'Agent identifier: personal_assistant, newsletter_multi, shared, etc.';
COMMENT ON COLUMN agent_instructions.document IS 'The instruction text content';
COMMENT ON COLUMN agent_instructions.source_file IS 'Source file name: security_rules.md, instructions.md, etc.';
COMMENT ON COLUMN agent_instructions.embedding IS 'OpenAI embedding vector (1536 dimensions)';

COMMENT ON TABLE user_vector_knowledge_base IS 'Knowledge Base vector store for RAG. Stores business information with embeddings.';
COMMENT ON COLUMN user_vector_knowledge_base.user_id IS 'Reference to Supabase profiles.user_id';
COMMENT ON COLUMN user_vector_knowledge_base.document IS 'The text content (e.g., "Company location: Japan")';
COMMENT ON COLUMN user_vector_knowledge_base.category IS 'Category: company, website, branding, products, contacts, social_media, etc.';
COMMENT ON COLUMN user_vector_knowledge_base.embedding IS 'OpenAI embedding vector (1536 dimensions)';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify tables created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verify extensions:
-- SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pg_trgm');

-- ============================================================
-- EXAMPLE QUERIES
-- ============================================================

-- Insert instruction:
-- INSERT INTO agent_instructions (agent_id, source_file, document, embedding)
-- VALUES ('personal_assistant', 'instructions.md', 'Content here...', '[0.1, 0.2, ...]'::vector);

-- Semantic search:
-- SELECT document, source_file, embedding <=> '[query_embedding]'::vector AS distance
-- FROM agent_instructions
-- WHERE agent_id = 'personal_assistant'
-- ORDER BY distance
-- LIMIT 5;

-- Get all instructions for an agent:
-- SELECT document, source_file FROM agent_instructions
-- WHERE agent_id = 'personal_assistant'
-- ORDER BY source_file;
