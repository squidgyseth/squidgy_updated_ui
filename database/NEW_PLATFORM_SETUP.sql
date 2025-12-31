-- ============================================================================
-- NEW PLATFORM SETUP (Minimal Architecture)
-- ============================================================================
-- Run this ONCE on a fresh Supabase project for any new platform (YEAA, etc.)
-- 
-- ARCHITECTURE: Database-level isolation (no platform_id on user tables)
-- Each platform has its own Supabase instance, so tables are fully isolated.
-- 
-- This creates:
-- - Core tables (profiles, chat_history, team_members, billing_settings)
-- - Platform config (1 row to identify this platform)
-- - API keys for MCP access
-- - Helper functions
-- 
-- ============================================================================


-- ============================================================================
-- PART 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================================
-- PART 2: HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 3: CORE TABLES (Isolated per platform - no platform_id needed)
-- ============================================================================

-- 3.1 PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    company_id UUID,
    company_name TEXT,
    timezone TEXT DEFAULT 'UTC',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, user_id, email, full_name, avatar_url, company_id)
    VALUES (
        gen_random_uuid(),
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        gen_random_uuid()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);


-- 3.2 BILLING SETTINGS (Same structure as Squidgy for consistency)
CREATE TABLE IF NOT EXISTS public.billing_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    
    -- Plan info
    plan_name TEXT NOT NULL DEFAULT 'Free',
    plan_price NUMERIC NOT NULL DEFAULT 0.00,
    plan_period TEXT NOT NULL DEFAULT 'month',
    plan_status TEXT NOT NULL DEFAULT 'active',
    next_billing_date TIMESTAMPTZ,
    
    -- Payment method
    payment_method_type TEXT,
    payment_method_last4 TEXT,
    payment_method_expiry TEXT,
    payment_method_brand TEXT,
    
    -- Billing address
    billing_email TEXT,
    billing_name TEXT,
    billing_address TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_postal_code TEXT,
    billing_country TEXT DEFAULT 'US',
    
    -- Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Features and limits (JSONB for flexibility)
    subscription_features JSONB,
    usage_limits JSONB,
    
    -- Dates
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    
    -- Multi-platform billing extensions
    billing_model TEXT DEFAULT 'all_access',
    seats_purchased INTEGER DEFAULT 1,
    seats_used INTEGER DEFAULT 0,
    agent_access JSONB DEFAULT '{}',
    usage_this_period JSONB DEFAULT '{"runs": 0, "tokens": 0}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_settings_user_id ON public.billing_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_settings_stripe_customer ON public.billing_settings(stripe_customer_id);


-- 3.3 TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    sent_user_id UUID,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    avatar_text TEXT,
    avatar_color TEXT,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    
    -- Multi-platform extensions
    permissions JSONB DEFAULT '{}',
    allowed_agents TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_company_id ON public.team_members(company_id);


-- 3.4 CHAT HISTORY
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    agent_id TEXT,
    role TEXT NOT NULL,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Usage tracking
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON public.chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_agent_id ON public.chat_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at DESC);


-- 3.5 AGENTS (Available agents for this platform)
-- Each platform has its OWN Supabase instance with its own agents table.
-- This table lists which agents are available on THIS platform.
-- Agent behavior/config comes from YAML files, this table controls availability.
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(50) UNIQUE NOT NULL,                 -- Agent identifier (matches YAML id)
    name VARCHAR(100) NOT NULL,                           -- Display name
    category VARCHAR(50),                                 -- MARKETING, SALES, HR, SUPPORT, OPERATIONS
    description TEXT,
    avatar_url TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,                      -- Enable/disable agent
    display_order INTEGER DEFAULT 0,                      -- Order in sidebar
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON public.agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_category ON public.agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_enabled ON public.agents(is_enabled);


-- ============================================================================
-- PART 4: PLATFORM CONFIG (Identifies this database)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id TEXT NOT NULL UNIQUE,
    
    -- Platform info
    platform_name TEXT NOT NULL,
    domain TEXT,
    
    -- Billing model: 'all_access', 'per_agent', 'hybrid'
    billing_model TEXT NOT NULL DEFAULT 'all_access',
    
    -- Team settings
    supports_teams BOOLEAN DEFAULT FALSE,
    max_team_size INTEGER DEFAULT 1,
    
    -- Trial settings
    trial_days INTEGER DEFAULT 14,
    
    -- Default plan
    default_plan_name TEXT DEFAULT 'Free',
    default_plan_price NUMERIC DEFAULT 0,
    
    -- Stripe (for platform-specific accounts)
    stripe_account_id TEXT,
    
    -- Flexible config as JSONB
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTE: After running this script, insert your platform config:
-- INSERT INTO platform_config (platform_id, platform_name, billing_model, ...)
-- VALUES ('yeaa', 'YEAA', 'per_agent', ...);


-- ============================================================================
-- PART 5: API KEYS (For MCP server access)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID,
    
    -- Key info
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    name TEXT,
    
    -- Permissions
    scopes TEXT[] DEFAULT '{}',
    allowed_agents TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);


-- ============================================================================
-- PART 6: HELPER FUNCTIONS
-- ============================================================================

-- Check if user has access to an agent
-- Uses platform_config to determine billing model for this platform's database
CREATE OR REPLACE FUNCTION public.check_agent_access(
    _user_id UUID,
    _agent_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    _has_access BOOLEAN := FALSE;
    _billing_model TEXT;
    _plan_status TEXT;
    _agent_access JSONB;
BEGIN
    -- Get platform billing model (only one row in platform_config per database)
    SELECT billing_model INTO _billing_model
    FROM public.platform_config
    LIMIT 1;
    
    IF _billing_model IS NULL THEN
        _billing_model := 'all_access';
    END IF;
    
    -- Get user's billing settings
    SELECT plan_status, COALESCE(bs.agent_access, '{}')
    INTO _plan_status, _agent_access
    FROM public.billing_settings bs
    JOIN public.profiles p ON bs.user_id = p.user_id
    WHERE p.id = _user_id
    LIMIT 1;
    
    -- All-access: check subscription status
    IF _billing_model = 'all_access' THEN
        RETURN COALESCE(_plan_status, 'active') = 'active';
    END IF;
    
    -- Per-agent: check agent_access JSONB
    IF _billing_model IN ('per_agent', 'hybrid') THEN
        IF _agent_access ? _agent_id THEN
            RETURN COALESCE((_agent_access->_agent_id->>'active')::BOOLEAN, FALSE);
        END IF;
    END IF;
    
    -- Hybrid: active plan gives base access
    IF _billing_model = 'hybrid' AND _plan_status = 'active' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get user's available agents
CREATE OR REPLACE FUNCTION public.get_user_agents(
    _user_id UUID
) RETURNS TEXT[] AS $$
DECLARE
    _agents TEXT[] := '{}';
    _billing_model TEXT;
    _agent_access JSONB;
BEGIN
    SELECT billing_model INTO _billing_model
    FROM public.platform_config
    LIMIT 1;
    
    IF _billing_model IS NULL OR _billing_model = 'all_access' THEN
        RETURN ARRAY['*'];
    END IF;
    
    SELECT COALESCE(bs.agent_access, '{}')
    INTO _agent_access
    FROM public.billing_settings bs
    JOIN public.profiles p ON bs.user_id = p.user_id
    WHERE p.id = _user_id
    LIMIT 1;
    
    SELECT ARRAY_AGG(key)
    INTO _agents
    FROM jsonb_each(_agent_access) 
    WHERE (value->>'active')::BOOLEAN = TRUE;
    
    RETURN COALESCE(_agents, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Track usage (call after each agent interaction)
CREATE OR REPLACE FUNCTION public.track_usage(
    _user_id UUID,
    _agent_id TEXT,
    _tokens INTEGER DEFAULT 0,
    _cost DECIMAL DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    -- Update billing_settings usage
    UPDATE public.billing_settings bs
    SET usage_this_period = jsonb_set(
        jsonb_set(
            COALESCE(usage_this_period, '{"runs": 0, "tokens": 0}'),
            '{runs}',
            to_jsonb(COALESCE((usage_this_period->>'runs')::INTEGER, 0) + 1)
        ),
        '{tokens}',
        to_jsonb(COALESCE((usage_this_period->>'tokens')::INTEGER, 0) + _tokens)
    ),
    updated_at = NOW()
    FROM public.profiles p
    WHERE bs.user_id = p.user_id AND p.id = _user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- PART 7: STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('content', 'content', false),
    ('documents', 'documents', false),
    ('knowledge-base', 'knowledge-base', true)  -- Shared KB storage for all agents
ON CONFLICT (id) DO NOTHING;

-- Storage policies for knowledge-base bucket (user-specific folders)
CREATE POLICY "Users can upload to own KB folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'knowledge-base' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own KB files" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'knowledge-base' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own KB files" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'knowledge-base' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================================
-- PART 7.1: USER KNOWLEDGE BASE TABLE
-- ============================================================================
-- Stores extracted/structured KB content per user
-- General Assistant creates KB, other agents read/use it
-- Files stored in: {userId}/uploads/{timestamp}_{filename}

CREATE TABLE IF NOT EXISTS public.user_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,  -- 01-12 KB categories (company-overview, icp-target-audience, etc.)
    content JSONB NOT NULL,  -- Structured KB content
    source_file TEXT,        -- Original filename
    source_url TEXT,         -- File URL in storage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_kb_user_id ON public.user_knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kb_category ON public.user_knowledge_base(category);

DROP TRIGGER IF EXISTS user_kb_updated_at ON public.user_knowledge_base;
CREATE TRIGGER user_kb_updated_at
    BEFORE UPDATE ON public.user_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS for user_knowledge_base
ALTER TABLE public.user_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KB" ON public.user_knowledge_base
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KB" ON public.user_knowledge_base
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KB" ON public.user_knowledge_base
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own KB" ON public.user_knowledge_base
FOR DELETE USING (auth.uid() = user_id);


-- Function to clean up user's KB storage folder when account is deleted
CREATE OR REPLACE FUNCTION delete_user_kb_storage()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'knowledge-base' 
    AND (storage.foldername(name))[1] = OLD.id::text;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_delete_kb_storage ON auth.users;
CREATE TRIGGER on_user_delete_kb_storage
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION delete_user_kb_storage();


-- ============================================================================
-- PART 8: GRANTS & RLS (Disabled for development)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Disable RLS for development
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;


-- ============================================================================
-- DONE!
-- ============================================================================
-- 
-- Next steps:
-- 1. Configure your platform (required):
--    INSERT INTO platform_config (platform_id, platform_name, billing_model, supports_teams, features, limits)
--    VALUES ('yeaa', 'YEAA', 'per_agent', false, '{"feature1": true}', '{"max_agents": 5}');
--
-- 2. Add agents available on this platform:
--    INSERT INTO agents (agent_id, name, description, is_premium)
--    VALUES ('content_writer', 'Content Writer', 'AI content generation', false);
--
-- 3. Set environment variables:
--    YEAA_SUPABASE_URL=https://your-project.supabase.co
--    YEAA_SUPABASE_ANON_KEY=eyJ...
--
-- Architecture notes:
-- - NO platform_id on user tables (database-level isolation)
-- - Same table structure as Squidgy for code compatibility
-- - Functions don't require platform_id parameter
-- - platform_config has 1 row to identify this database
--
-- ============================================================================
