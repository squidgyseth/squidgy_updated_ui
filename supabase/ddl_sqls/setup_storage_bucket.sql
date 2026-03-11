-- Create Supabase storage bucket for content repurposer images
-- Run this in your Supabase SQL editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content_repurposer', 'content_repurposer', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for content_repurposer bucket

-- Policy: Allow users to upload their own files
CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'content_repurposer' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (bucket_id = 'content_repurposer' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'content_repurposer' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'content_repurposer' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;