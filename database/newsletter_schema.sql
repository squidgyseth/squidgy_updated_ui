-- Newsletter Content Creator - Supabase Database Schema
-- This schema handles newsletter generation data storage

-- Table: newsletter_projects
-- Stores newsletter creation projects with content, instructions, and metadata
CREATE TABLE IF NOT EXISTS newsletter_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id VARCHAR(255),
    
    -- Content Input
    content TEXT,
    uploaded_file_name VARCHAR(255),
    uploaded_file_url TEXT,
    uploaded_file_size INTEGER,
    
    -- Project Instructions
    generation_instructions TEXT NOT NULL,
    
    -- Generated Newsletter Data
    generated_newsletter TEXT,
    newsletter_subject VARCHAR(500),
    newsletter_html TEXT,
    
    -- Metadata
    status VARCHAR(50) DEFAULT 'draft', -- draft, generating, completed, failed
    generation_model VARCHAR(100), -- e.g., 'gpt-4', 'claude-3'
    generation_time_ms INTEGER,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('draft', 'generating', 'completed', 'failed'))
);




-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_projects_user_id ON newsletter_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_projects_status ON newsletter_projects(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_projects_created_at ON newsletter_projects(created_at);

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
CREATE TRIGGER update_newsletter_projects_updated_at
    BEFORE UPDATE ON newsletter_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion query (for testing)
-- INSERT INTO newsletter_projects (user_id, session_id, content, generation_instructions, status)
-- VALUES (
--     auth.uid(),
--     'test_session_123',
--     'Sample newsletter content about AI developments...',
--     'Newsletter Generation Instructions:\n\n1. Tone & Style:\n   - Keep professional tone\n   - Use clear language',
--     'draft'
-- );