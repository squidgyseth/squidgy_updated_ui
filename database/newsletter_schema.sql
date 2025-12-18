-- ===========================================
-- NEWSLETTER AND CONTENT SCHEMA
-- ===========================================
-- Updated based on actual Supabase database analysis (December 2024)
-- Includes newsletter_projects, history tables, and document tables with embeddings

-- ===== NEWSLETTER PROJECTS TABLE =====
-- Stores newsletter creation projects with content, instructions, and metadata
CREATE TABLE IF NOT EXISTS public.newsletter_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  firm_user_id text NOT NULL,
  session_id character varying(255) NULL,
  content text NULL,
  uploaded_file_name character varying(255) NULL,
  uploaded_file_url text NULL,
  uploaded_file_size integer NULL,
  generation_instructions text NOT NULL,
  generated_newsletter text NULL,
  newsletter_subject character varying(500) NULL,
  newsletter_html text NULL,
  status character varying(50) NULL DEFAULT 'draft'::character varying,
  generation_model character varying(100) NULL,
  generation_time_ms integer NULL,
  error_message text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  generated_at timestamp with time zone NULL,
  CONSTRAINT newsletter_projects_pkey PRIMARY KEY (id),
  CONSTRAINT valid_status CHECK (
    (
      (status)::text = ANY (
        ARRAY[
          ('draft'::character varying)::text,
          ('generating'::character varying)::text,
          ('completed'::character varying)::text,
          ('failed'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;




-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_projects_firm_user_id ON public.newsletter_projects USING btree (firm_user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_newsletter_projects_status ON public.newsletter_projects USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_newsletter_projects_created_at ON public.newsletter_projects USING btree (created_at) TABLESPACE pg_default;

-- RLS is disabled for development/testing purposes
-- Uncomment the following lines to enable Row Level Security in production:

-- ALTER TABLE newsletter_projects ENABLE ROW LEVEL SECURITY;

-- Storage bucket configuration for newsletter files
-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('newsletter', 'newsletter', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS on storage bucket for development
UPDATE storage.buckets 
SET public = true
WHERE id = 'newsletter';

-- Create storage policies to allow uploads (for when RLS is enabled)
-- DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
-- CREATE POLICY "Allow public uploads" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'newsletter');

-- DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
-- CREATE POLICY "Allow public downloads" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'newsletter');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_newsletter_projects_updated_at BEFORE
UPDATE ON newsletter_projects FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion query (for testing)
-- INSERT INTO newsletter_projects (firm_user_id, session_id, content, generation_instructions, status)
-- VALUES (
--     auth.uid(),
--     'test_session_123',
--     'Sample newsletter content about AI developments...',
--     'Newsletter Generation Instructions:\n\n1. Tone & Style:\n   - Keep professional tone\n   - Use clear language',
--     'draft'
-- );


-- ===========================================
-- CONTENT HISTORY TABLES (from actual DB)
-- ===========================================

-- ===== HISTORY NEWSLETTERS TABLE =====
CREATE TABLE IF NOT EXISTS public.history_newsletters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    chat_history_id UUID,
    agent_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    call_to_actions JSONB DEFAULT '[]'::jsonb,
    content_repurposer_questions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_newsletters_user_id ON public.history_newsletters(user_id);
CREATE INDEX IF NOT EXISTS idx_history_newsletters_session_id ON public.history_newsletters(session_id);
CREATE INDEX IF NOT EXISTS idx_history_newsletters_chat_history_id ON public.history_newsletters(chat_history_id);
CREATE INDEX IF NOT EXISTS idx_history_newsletters_user_agent ON public.history_newsletters(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_history_newsletters_updated_at ON public.history_newsletters(updated_at DESC);

DROP TRIGGER IF EXISTS update_history_newsletters_updated_at ON public.history_newsletters;
CREATE TRIGGER update_history_newsletters_updated_at
    BEFORE UPDATE ON public.history_newsletters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ===== HISTORY CONTENT REPURPOSER TABLE =====
CREATE TABLE IF NOT EXISTS public.history_content_repurposer (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    chat_history_id UUID,
    agent_id TEXT DEFAULT 'content_repurposer',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    repurposed_content JSONB DEFAULT '[]'::jsonb,
    source_type TEXT,
    target_formats TEXT[],
    content_repurposer_questions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_user_id ON public.history_content_repurposer(user_id);
CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_session_id ON public.history_content_repurposer(session_id);
CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_chat_history_id ON public.history_content_repurposer(chat_history_id);
CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_user_agent ON public.history_content_repurposer(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_updated_at ON public.history_content_repurposer(updated_at DESC);

DROP TRIGGER IF EXISTS update_history_content_repurposer_updated_at ON public.history_content_repurposer;
CREATE TRIGGER update_history_content_repurposer_updated_at
    BEFORE UPDATE ON public.history_content_repurposer
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ===== CONTENT REPURPOSER IMAGES TABLE =====
CREATE TABLE IF NOT EXISTS public.content_repurposer_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    content TEXT,
    image_url TEXT,
    prompt TEXT,
    generation_type VARCHAR(50) DEFAULT 'custom',
    session_id TEXT,
    history_content_repurposer_id UUID REFERENCES public.history_content_repurposer(id),
    in_use BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_user_id ON public.content_repurposer_images(user_id);
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_agent_id ON public.content_repurposer_images(agent_id);
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_platform ON public.content_repurposer_images(platform);
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_in_use ON public.content_repurposer_images(in_use);

CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_repurposer_images_updated_date ON public.content_repurposer_images;
CREATE TRIGGER update_content_repurposer_images_updated_date
    BEFORE UPDATE ON public.content_repurposer_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();


-- ===========================================
-- DOCUMENT TABLES WITH EMBEDDINGS (for RAG)
-- ===========================================

-- Requires pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SEQUENCE IF NOT EXISTS newsletter_documents_id_seq;

CREATE TABLE IF NOT EXISTS public.newsletter_documents (
    id BIGINT NOT NULL DEFAULT nextval('newsletter_documents_id_seq') PRIMARY KEY,
    user_id TEXT,
    newsletter_id TEXT,
    content TEXT,
    metadata JSONB,
    embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_documents_user_id ON public.newsletter_documents(user_id);


CREATE SEQUENCE IF NOT EXISTS website_documents_id_seq;

CREATE TABLE IF NOT EXISTS public.website_documents (
    id BIGINT NOT NULL DEFAULT nextval('website_documents_id_seq') PRIMARY KEY,
    user_id TEXT,
    content TEXT,
    metadata JSONB,
    embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS idx_website_documents_user_id ON public.website_documents(user_id);


-- ===== STORAGE BUCKETS =====
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('content_repurposer', 'content_repurposer', true),
    ('newsletter-images', 'newsletter-images', true)
ON CONFLICT (id) DO NOTHING;