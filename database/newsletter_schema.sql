-- Newsletter Content Creator - Supabase Database Schema
-- This schema handles newsletter generation data storage

-- Table: newsletter_projects
-- Stores newsletter creation projects with content, instructions, and metadata
CREATE TABLE public.newsletter_projects (
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