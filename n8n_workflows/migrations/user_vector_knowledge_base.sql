-- user_vector_knowledge_base Table (Knowledge Base / RAG Vector Store)
-- Stores business information with vector embeddings for semantic search
-- Created: 2025-01-17

-- Enable pgvector extension (required for vector data type)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm extension (for smart text similarity matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the vectors table
CREATE TABLE IF NOT EXISTS public.user_vector_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User reference (explicit column for better indexing)
  user_id UUID NOT NULL,

  -- Document content (the actual text stored)
  document TEXT NOT NULL,

  -- Category for filtering
  category TEXT NOT NULL,

  -- Vector embedding (OpenAI text-embedding-ada-002 = 1536 dimensions)
  embedding vector(1536),

  -- Source of the data
  source TEXT DEFAULT 'N8N-agent',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key to profiles
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Index for user_id filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_uvkb_user_id
ON public.user_vector_knowledge_base(user_id);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_uvkb_category
ON public.user_vector_knowledge_base(category);

-- Composite index for user + category (common query pattern)
CREATE INDEX IF NOT EXISTS idx_uvkb_user_category
ON public.user_vector_knowledge_base(user_id, category);

-- Index for fast vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_uvkb_embedding
ON public.user_vector_knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for text similarity (pg_trgm) - used by smart delete
CREATE INDEX IF NOT EXISTS idx_uvkb_document_trgm
ON public.user_vector_knowledge_base
USING GIN (document gin_trgm_ops);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_uvkb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER uvkb_updated_at
  BEFORE UPDATE ON public.user_vector_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_uvkb_updated_at();

-- Grant access for service role (N8N)
GRANT ALL ON public.user_vector_knowledge_base TO service_role;

-- Comments
COMMENT ON TABLE public.user_vector_knowledge_base IS 'Knowledge Base vector store for RAG. Stores business information with embeddings for semantic search.';
COMMENT ON COLUMN public.user_vector_knowledge_base.user_id IS 'Reference to profiles.user_id';
COMMENT ON COLUMN public.user_vector_knowledge_base.document IS 'The text content (e.g., "Company location: Japan")';
COMMENT ON COLUMN public.user_vector_knowledge_base.category IS 'Category: company, website, branding, products, contacts, social_media, sales, marketing, operations, competitive';
COMMENT ON COLUMN public.user_vector_knowledge_base.embedding IS 'OpenAI embedding vector (1536 dimensions)';
COMMENT ON COLUMN public.user_vector_knowledge_base.source IS 'Data source: N8N-agent, website_analysis, manual';

-----------------------------------------------------------
-- CATEGORIES
-----------------------------------------------------------
-- company      - Company info, location, size
-- website      - Website analysis data
-- branding     - Brand colors, voice, style
-- products     - Products and services
-- contacts     - Contact information
-- social_media - Social profiles
-- sales        - Sales process info
-- marketing    - Marketing channels
-- operations   - Workflows and processes
-- competitive  - Competitor information

-----------------------------------------------------------
-- EXAMPLE QUERIES
-----------------------------------------------------------

-- Insert new KB entry:
-- INSERT INTO public.user_vector_knowledge_base (user_id, document, category, embedding)
-- VALUES (
--   'uuid-here',
--   'Company location: Japan',
--   'company',
--   '[0.1, 0.2, ...]'::vector
-- );

-- Search by user and category:
-- SELECT * FROM public.user_vector_knowledge_base
-- WHERE user_id = 'uuid-here'
--   AND category = 'company';

-- Semantic search (find similar):
-- SELECT *, embedding <=> '[query_embedding]'::vector AS distance
-- FROM public.user_vector_knowledge_base
-- WHERE user_id = 'uuid-here'
-- ORDER BY distance
-- LIMIT 5;

-- Smart delete (similar text in same category):
-- DELETE FROM public.user_vector_knowledge_base
-- WHERE user_id = 'uuid-here'
--   AND category = 'company'
--   AND similarity(LOWER(document), LOWER('United States')) > 0.3;
