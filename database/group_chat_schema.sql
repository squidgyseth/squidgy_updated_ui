-- Group Chat Database Schema for Squidgy
-- Run this in Supabase SQL Editor

-- Create group_chats table
CREATE TABLE public.group_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    participants JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for group_chats
CREATE INDEX idx_group_chats_user_id ON public.group_chats(user_id);
CREATE INDEX idx_group_chats_created_at ON public.group_chats(created_at);

-- Create group_chat_messages table
CREATE TABLE public.group_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.group_chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'assistant')),
    sender_id VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for group_chat_messages
CREATE INDEX idx_group_messages_group_id ON public.group_chat_messages(group_id);
CREATE INDEX idx_group_messages_created_at ON public.group_chat_messages(created_at);