-- Complete Database Setup for Chat History System
-- Run this in your Supabase SQL editor

-- Rename existing chat_history table to preserve old data
ALTER TABLE IF EXISTS chat_history RENAME TO chat_history_old_backup;

-- Create the new chat_history table with correct structure
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('User', 'Agent')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    agent_name TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    message_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_agent ON chat_history(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user data access
CREATE POLICY IF NOT EXISTS "Users can view own chat history" 
    ON chat_history FOR SELECT 
    USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own chat history" 
    ON chat_history FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own chat history" 
    ON chat_history FOR DELETE 
    USING (auth.uid()::text = user_id);

-- Note: Old data is preserved in chat_history_old_backup table
-- You can drop it later after confirming the new system works:
-- DROP TABLE chat_history_old_backup;