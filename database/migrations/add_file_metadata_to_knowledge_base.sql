-- Migration: Add file_name and file_url columns to user_vector_knowledge_base
-- Date: 2026-01-29
-- Purpose: Track uploaded file metadata (filename + storage URL) for knowledge base entries

-- Add file_name column (stores original filename like "document.pdf")
ALTER TABLE public.user_vector_knowledge_base
ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT NULL;

-- Add file_url column (stores Supabase Storage URL)
ALTER TABLE public.user_vector_knowledge_base
ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT NULL;

-- Add comment to explain columns
COMMENT ON COLUMN public.user_vector_knowledge_base.file_name IS 'Original filename when source=file_upload (e.g., "report.pdf")';
COMMENT ON COLUMN public.user_vector_knowledge_base.file_url IS 'Supabase Storage URL when source=file_upload';

-- Create index for faster file lookups
CREATE INDEX IF NOT EXISTS idx_uvkb_file_url
ON public.user_vector_knowledge_base(file_url)
WHERE file_url IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_vector_knowledge_base'
  AND column_name IN ('file_name', 'file_url');
