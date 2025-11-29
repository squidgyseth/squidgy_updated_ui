-- Create history_content_repurposer table similar to history_newsletters
CREATE TABLE public.history_content_repurposer (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NULL,
  chat_history_id UUID NULL,
  agent_id TEXT NULL DEFAULT 'content_repurposer',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  repurposed_content JSONB NULL DEFAULT '[]'::jsonb, -- Store different formats of repurposed content
  source_type TEXT NULL, -- e.g., 'blog', 'article', 'video', 'newsletter'
  target_formats TEXT[] NULL, -- e.g., ['twitter', 'linkedin', 'instagram']
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  content_repurposer_questions TEXT NULL,
  CONSTRAINT history_content_repurposer_pkey PRIMARY KEY (id),
  CONSTRAINT history_content_repurposer_chat_history_id_fkey FOREIGN KEY (chat_history_id) REFERENCES chat_history (id)
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_user_id 
ON public.history_content_repurposer USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_session_id 
ON public.history_content_repurposer USING btree (session_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_chat_history_id 
ON public.history_content_repurposer USING btree (chat_history_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_user_agent 
ON public.history_content_repurposer USING btree (user_id, agent_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_history_content_repurposer_updated_at 
ON public.history_content_repurposer USING btree (updated_at DESC) TABLESPACE pg_default;

-- Create triggers
CREATE TRIGGER after_history_content_repurposer_content_change
AFTER INSERT OR UPDATE OF content 
ON history_content_repurposer 
FOR EACH ROW
EXECUTE FUNCTION trigger_content_repurpose_questions_async();

CREATE TRIGGER update_history_content_repurposer_updated_at 
BEFORE UPDATE ON history_content_repurposer 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- OPTION 1: No RLS (Simple approach - similar to history_newsletters)
-- If you want no RLS, just comment out or remove the RLS section below

-- OPTION 2: RLS with public access (if needed for development)
-- ALTER TABLE public.history_content_repurposer ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Enable all access for authenticated users" 
-- ON public.history_content_repurposer
-- FOR ALL 
-- USING (true)
-- WITH CHECK (true);

-- OPTION 3: RLS with user-based access (if using Supabase Auth)
-- ALTER TABLE public.history_content_repurposer ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can manage their own content repurposer records" 
-- ON public.history_content_repurposer
-- FOR ALL 
-- USING (auth.uid()::text = user_id)
-- WITH CHECK (auth.uid()::text = user_id);