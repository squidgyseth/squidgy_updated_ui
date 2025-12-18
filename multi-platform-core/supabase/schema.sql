-- ============================================================================
-- Multi-Platform Agent System Schema
-- ============================================================================
-- 
-- Run this on each Supabase instance (squidgy, yeaa, fanatiq, trades, finance)
-- 
-- Prerequisites:
-- 1. Create a new Supabase project
-- 2. Run this SQL in the SQL Editor
-- 3. Configure environment variables with the project URL and keys
--
-- ============================================================================


-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================================
-- PROFILES (extends Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- WORKSPACES (Teams/Organizations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    logo_url TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS workspaces_owner_id_idx ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS workspaces_slug_idx ON public.workspaces(slug);

CREATE TRIGGER workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- WORKSPACE MEMBERS
-- ============================================================================

CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE IF NOT EXISTS public.workspace_members (
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role workspace_role DEFAULT 'member',
    
    -- Permissions (can extend with JSONB for granular control)
    permissions JSONB DEFAULT '{}',
    
    -- Metadata
    invited_by UUID REFERENCES public.profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx ON public.workspace_members(user_id);

-- RLS Policies for workspaces and members
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
    FOR SELECT USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their workspaces" ON public.workspaces
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );


-- ============================================================================
-- PROJECTS (within workspaces)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS projects_workspace_id_idx ON public.projects(workspace_id);

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Users can view projects in their workspaces" ON public.projects
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );


-- ============================================================================
-- AGENT RUNS (execution log)
-- ============================================================================

CREATE TYPE agent_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Agent info
    agent_id TEXT NOT NULL,
    agent_version TEXT,
    
    -- Execution
    status agent_run_status DEFAULT 'pending',
    input JSONB,
    output JSONB,
    error TEXT,
    
    -- Usage tracking
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    tokens_total INTEGER GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS agent_runs_workspace_id_idx ON public.agent_runs(workspace_id);
CREATE INDEX IF NOT EXISTS agent_runs_project_id_idx ON public.agent_runs(project_id);
CREATE INDEX IF NOT EXISTS agent_runs_user_id_idx ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS agent_runs_agent_id_idx ON public.agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS agent_runs_status_idx ON public.agent_runs(status);
CREATE INDEX IF NOT EXISTS agent_runs_created_at_idx ON public.agent_runs(created_at DESC);

CREATE POLICY "Users can view runs in their workspaces" ON public.agent_runs
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );


-- ============================================================================
-- CONTENT (generated content)
-- ============================================================================

CREATE TYPE content_status AS ENUM ('draft', 'review', 'approved', 'scheduled', 'published', 'failed', 'archived');
CREATE TYPE content_type AS ENUM ('post', 'image', 'video', 'carousel', 'story', 'reel', 'article', 'email', 'other');
CREATE TYPE social_platform AS ENUM ('linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'threads', 'other');

CREATE TABLE IF NOT EXISTS public.content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    
    -- Content details
    content_type content_type DEFAULT 'post',
    platform social_platform,
    
    -- The actual content (flexible structure)
    title TEXT,
    body TEXT,
    media_urls TEXT[],
    content_data JSONB DEFAULT '{}',
    
    -- Status and scheduling
    status content_status DEFAULT 'draft',
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS content_workspace_id_idx ON public.content(workspace_id);
CREATE INDEX IF NOT EXISTS content_project_id_idx ON public.content(project_id);
CREATE INDEX IF NOT EXISTS content_status_idx ON public.content(status);
CREATE INDEX IF NOT EXISTS content_platform_idx ON public.content(platform);
CREATE INDEX IF NOT EXISTS content_scheduled_for_idx ON public.content(scheduled_for);

CREATE TRIGGER content_updated_at
    BEFORE UPDATE ON public.content
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Users can view content in their workspaces" ON public.content
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create content in their workspaces" ON public.content
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update content in their workspaces" ON public.content
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );


-- ============================================================================
-- USAGE TRACKING (for billing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- What was used
    agent_id TEXT,
    action TEXT NOT NULL,
    
    -- Quantity
    units INTEGER DEFAULT 1,
    unit_type TEXT DEFAULT 'run', -- 'run', 'token', 'image', 'video_minute'
    
    -- Cost
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    
    -- Billing period
    period_start DATE,
    period_end DATE,
    
    -- Reference
    agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Indexes for billing queries
CREATE INDEX IF NOT EXISTS usage_workspace_id_idx ON public.usage(workspace_id);
CREATE INDEX IF NOT EXISTS usage_period_idx ON public.usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS usage_agent_id_idx ON public.usage(agent_id);
CREATE INDEX IF NOT EXISTS usage_created_at_idx ON public.usage(created_at DESC);

CREATE POLICY "Users can view usage in their workspaces" ON public.usage
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );


-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'paused', 'trialing');

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
    
    -- Plan info
    tier TEXT NOT NULL, -- 'starter', 'pro', 'enterprise', etc.
    
    -- Status
    status subscription_status DEFAULT 'active',
    
    -- Billing
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Stripe integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    
    -- Limits (can be overridden per subscription)
    limits JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS subscriptions_workspace_id_idx ON public.subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Users can view their workspace subscription" ON public.subscriptions
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );


-- ============================================================================
-- API KEYS (for MCP server access)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Owner
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    
    -- Key info (store hash, not the key itself)
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL, -- First 8 chars for identification
    name TEXT,
    
    -- Scope
    scopes TEXT[] DEFAULT '{}', -- ['read', 'write', 'agents:*', 'agents:content-creator']
    allowed_projects UUID[], -- NULL = all projects
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    -- Usage
    last_used_at TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS api_keys_key_prefix_idx ON public.api_keys(key_prefix);

CREATE POLICY "Users can view their own API keys" ON public.api_keys
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create API keys" ON public.api_keys
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys" ON public.api_keys
    FOR UPDATE USING (user_id = auth.uid());


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is member of workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(
    _workspace_id UUID,
    _user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = _workspace_id AND user_id = _user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role in workspace
CREATE OR REPLACE FUNCTION public.has_workspace_role(
    _workspace_id UUID,
    _role workspace_role,
    _user_id UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = _workspace_id 
          AND user_id = _user_id 
          AND role = _role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's workspaces
CREATE OR REPLACE FUNCTION public.get_user_workspaces(
    _user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
    workspace_id UUID,
    workspace_name TEXT,
    role workspace_role
) AS $$
BEGIN
    RETURN QUERY
    SELECT w.id, w.name, wm.role
    FROM public.workspaces w
    JOIN public.workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = _user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('content', 'content', false),
    ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can access content in their workspaces"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'content'
    AND (storage.foldername(name))[1]::uuid IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
    )
);


-- ============================================================================
-- DONE
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
