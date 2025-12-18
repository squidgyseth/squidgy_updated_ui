-- ============================================================================
-- COMPLETE MULTI-PLATFORM DATABASE SCHEMA v2
-- ============================================================================
-- 
-- Based on actual Supabase database analysis from December 2024
-- Run this script on EACH Supabase instance (squidgy, yeaa, fanatiq, trades, finance)
-- 
-- ============================================================================


-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";  -- For embeddings/RAG
CREATE EXTENSION IF NOT EXISTS "http";    -- For HTTP functions


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_last_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 1. PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE,
    email TEXT,
    full_name TEXT,
    profile_avatar_url TEXT,
    company_id UUID,
    role TEXT,
    email_confirmed BOOLEAN DEFAULT FALSE,
    ghl_record_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Trigger to create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
    new_company_id UUID;
    new_session_id UUID;
BEGIN
    new_user_id := gen_random_uuid();
    new_company_id := gen_random_uuid();
    new_session_id := gen_random_uuid();
    
    INSERT INTO public.profiles (
        id, user_id, email, full_name, company_id, role, email_confirmed
    ) VALUES (
        NEW.id, new_user_id, NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        new_company_id, 'member', FALSE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 2. AGENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    avatar_url TEXT,
    page_type VARCHAR(20) DEFAULT 'standard',
    figma_url TEXT,
    generated_component_path TEXT,
    n8n_webhook_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_category ON public.agents(category);


-- ============================================================================
-- 3. CHAT HISTORY (Main conversation storage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    agent_name TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    message_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    mcp_tool_used TEXT,
    mcp_context JSONB
);

CREATE INDEX IF NOT EXISTS idx_chat_history_session ON public.chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON public.chat_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_agent ON public.chat_history(user_id, agent_id);


-- ============================================================================
-- 4. AGENT CONVERSATIONS (Alternative chat storage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(50) NOT NULL REFERENCES public.agents(agent_id),
    user_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    message_content TEXT NOT NULL,
    is_user_message BOOLEAN NOT NULL DEFAULT true,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session ON public.agent_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON public.agent_conversations(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_sender ON public.agent_conversations(is_user_message);


-- ============================================================================
-- 5. ONBOARDING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_onboarding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
    is_completed BOOLEAN DEFAULT FALSE,
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER[] DEFAULT '{}'::INTEGER[],
    business_type VARCHAR(50),
    selected_departments TEXT[],
    selected_assistants TEXT[],
    onboarding_started_at TIMESTAMPTZ DEFAULT NOW(),
    onboarding_completed_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON public.user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON public.user_onboarding(is_completed);

CREATE OR REPLACE FUNCTION update_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
        NEW.onboarding_completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_onboarding_timestamp ON public.user_onboarding;
CREATE TRIGGER trigger_update_onboarding_timestamp
    BEFORE UPDATE ON public.user_onboarding
    FOR EACH ROW EXECUTE FUNCTION update_onboarding_timestamp();


-- ============================================================================
-- 6. ASSISTANT PERSONALIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assistant_personalizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    assistant_id VARCHAR(100) NOT NULL,
    custom_name VARCHAR(255),
    avatar_style VARCHAR(50) DEFAULT 'professional',
    communication_tone VARCHAR(50) DEFAULT 'professional',
    custom_instructions TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, assistant_id)
);

CREATE INDEX IF NOT EXISTS idx_assistant_personalizations_user_id ON public.assistant_personalizations(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_personalizations_assistant_id ON public.assistant_personalizations(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_personalizations_enabled ON public.assistant_personalizations(is_enabled);

CREATE OR REPLACE FUNCTION update_personalization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_personalization_timestamp ON public.assistant_personalizations;
CREATE TRIGGER trigger_update_personalization_timestamp
    BEFORE UPDATE ON public.assistant_personalizations
    FOR EACH ROW EXECUTE FUNCTION update_personalization_timestamp();


-- ============================================================================
-- 7. ASSISTANT CUSTOMIZATION (Alternative)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assistant_customization (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    agent_id TEXT NOT NULL,
    assistant_name TEXT NOT NULL,
    assistant_tone TEXT NOT NULL DEFAULT 'friendly',
    avatar_url TEXT,
    custom_avatar_url TEXT,
    specialization TEXT,
    tagline TEXT,
    capabilities JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_assistant_customization_user_company ON public.assistant_customization(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_assistant_customization_agent ON public.assistant_customization(agent_id);


-- ============================================================================
-- 8. ONBOARDING COMPANY DETAILS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_company_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    company_phone VARCHAR(50),
    website_url VARCHAR(500),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    country VARCHAR(10) DEFAULT 'US',
    city VARCHAR(100),
    state VARCHAR(100),
    time_zone VARCHAR(50) DEFAULT 'America/New_York',
    primary_goals TEXT[],
    ai_experience_level VARCHAR(50),
    preferred_working_hours VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_company_details_user_id ON public.onboarding_company_details(user_id);

CREATE OR REPLACE FUNCTION update_company_details_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_company_details_onboarding_timestamp ON public.onboarding_company_details;
CREATE TRIGGER trigger_update_company_details_onboarding_timestamp
    BEFORE UPDATE ON public.onboarding_company_details
    FOR EACH ROW EXECUTE FUNCTION update_company_details_onboarding_timestamp();


-- ============================================================================
-- 9. ONBOARDING SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    abandoned_at_step INTEGER,
    user_agent TEXT,
    ip_address INET,
    referrer VARCHAR(500),
    is_completed BOOLEAN DEFAULT FALSE,
    completion_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON public.onboarding_sessions(user_id);


-- ============================================================================
-- 10. BUSINESS DETAILS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID,
    agent_id VARCHAR(50) DEFAULT 'SOL',
    business_name VARCHAR(255),
    business_email VARCHAR(255),
    phone_number VARCHAR(50),
    emergency_numbers TEXT[],
    country VARCHAR(10) DEFAULT 'US',
    address_method VARCHAR(20) DEFAULT 'manual',
    address_line VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    setup_status VARCHAR(20) DEFAULT 'completed',
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(firm_user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_business_details_firm_user_id ON public.business_details(firm_user_id);
CREATE INDEX IF NOT EXISTS idx_business_details_agent_id ON public.business_details(agent_id);


-- ============================================================================
-- 11. BUSINESS SETTINGS (Alternative)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    company_name TEXT,
    industry TEXT,
    team_size TEXT,
    business_email TEXT,
    phone_number TEXT,
    emergency_numbers JSONB,
    country TEXT,
    address_method TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    company_logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- 12. SOLAR SETUP
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.solar_setup (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID,
    agent_id VARCHAR(50) DEFAULT 'SOL',
    installation_price NUMERIC,
    dealer_fee NUMERIC,
    broker_fee NUMERIC,
    allow_financed BOOLEAN,
    allow_cash BOOLEAN,
    financing_apr NUMERIC,
    financing_term INTEGER,
    energy_price NUMERIC,
    yearly_electric_cost_increase NUMERIC,
    installation_lifespan INTEGER,
    typical_panel_count INTEGER,
    max_roof_segments INTEGER,
    solar_incentive NUMERIC,
    setup_status VARCHAR(20) DEFAULT 'completed',
    setup_json JSONB,
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    property_type VARCHAR(20) NOT NULL DEFAULT 'Residential',
    currency VARCHAR(3) DEFAULT 'GBP',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(firm_user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_solar_setup_firm_user_id ON public.solar_setup(firm_user_id);


-- ============================================================================
-- 13. CALENDAR SETUP
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_setup (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID,
    agent_id VARCHAR(50) DEFAULT 'SOL',
    calendar_name VARCHAR(255),
    description TEXT,
    call_duration INTEGER,
    max_calls_per_day INTEGER,
    notice_hours INTEGER,
    book_ahead_days INTEGER,
    auto_confirm BOOLEAN,
    allow_rescheduling BOOLEAN,
    allow_cancellations BOOLEAN,
    business_hours JSONB,
    setup_status VARCHAR(20) DEFAULT 'completed',
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(firm_user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_setup_firm_user_id ON public.calendar_setup(firm_user_id);


-- ============================================================================
-- 14. NOTIFICATION PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID,
    agent_id VARCHAR(50) DEFAULT 'SOL',
    email_enabled BOOLEAN DEFAULT TRUE,
    messenger_enabled BOOLEAN DEFAULT FALSE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    ghl_enabled BOOLEAN DEFAULT FALSE,
    notification_email VARCHAR(255),
    appointment_confirmations BOOLEAN DEFAULT TRUE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    cancellations_reschedules BOOLEAN DEFAULT TRUE,
    setup_status VARCHAR(20) DEFAULT 'completed',
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(firm_user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_firm_user_id ON public.notification_preferences(firm_user_id);


-- ============================================================================
-- 15. WEBSITE ANALYSIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.website_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID NOT NULL,
    agent_id VARCHAR(50) NOT NULL,
    firm_id UUID NOT NULL,
    website_url VARCHAR(500) NOT NULL,
    company_description TEXT,
    value_proposition TEXT,
    business_niche TEXT,
    tags TEXT[],
    screenshot_url VARCHAR(500),
    favicon_url VARCHAR(500),
    analysis_status VARCHAR(20),
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    business_domain TEXT,
    newsletter_questions TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_analysis_firm_user_id ON public.website_analysis(firm_user_id);


-- ============================================================================
-- 16. LEADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    qualification_score INTEGER DEFAULT 0,
    estimated_value NUMERIC DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'GBP',
    lead_source TEXT DEFAULT 'website',
    assigned_to UUID,
    priority TEXT NOT NULL DEFAULT 'medium',
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'UK',
    industry TEXT,
    company_size TEXT,
    notes TEXT,
    tags TEXT[],
    external_lead_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    CONSTRAINT leads_status_check CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost')),
    CONSTRAINT leads_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON public.leads(next_followup_at);


-- ============================================================================
-- 17. LEAD INFORMATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_information (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    information_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB,
    activity_type TEXT,
    communication_direction TEXT,
    communication_status TEXT,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    survey_data JSONB,
    qualification_data JSONB,
    proposal_value NUMERIC,
    proposal_status TEXT,
    proposal_valid_until TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active',
    priority TEXT NOT NULL DEFAULT 'normal',
    assigned_to UUID,
    created_by UUID NOT NULL,
    metadata JSONB,
    tags TEXT[],
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_information_lead_id ON public.lead_information(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_information_user_id ON public.lead_information(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_information_type ON public.lead_information(information_type);
CREATE INDEX IF NOT EXISTS idx_lead_information_activity_type ON public.lead_information(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_information_scheduled_at ON public.lead_information(scheduled_at);


-- ============================================================================
-- 18. NOTIFICATIONS (GHL Messages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ghl_location_id VARCHAR(255) NOT NULL,
    ghl_contact_id VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'SMS',
    sender_name VARCHAR(255),
    sender_phone VARCHAR(50),
    sender_email VARCHAR(255),
    contact_type VARCHAR(100),
    message_attachment TEXT,
    tag VARCHAR(255),
    agent_message TEXT,
    conversation_id VARCHAR(255),
    read_status BOOLEAN DEFAULT FALSE,
    responded_status BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    mcp_context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_ghl_location_id ON public.notifications(ghl_location_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ghl_contact_id ON public.notifications(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_notifications_conversation_id ON public.notifications(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_contact_type ON public.notifications(contact_type);
CREATE INDEX IF NOT EXISTS idx_notifications_message_type ON public.notifications(message_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_location_contact ON public.notifications(ghl_location_id, ghl_contact_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_location_unread ON public.notifications(ghl_location_id, read_status) WHERE (read_status = false);

CREATE OR REPLACE FUNCTION generate_conversation_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.conversation_id := 'conv_' || NEW.ghl_location_id || '_' || NEW.ghl_contact_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_conversation_id_trigger ON public.notifications;
CREATE TRIGGER set_conversation_id_trigger
    BEFORE INSERT ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION generate_conversation_id();

CREATE OR REPLACE FUNCTION update_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notifications_timestamp ON public.notifications;
CREATE TRIGGER trigger_update_notifications_timestamp
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION update_notifications_timestamp();


-- ============================================================================
-- 19. BILLING SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.billing_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    plan_name TEXT NOT NULL DEFAULT 'Free',
    plan_price NUMERIC NOT NULL DEFAULT 0.00,
    plan_period TEXT NOT NULL DEFAULT 'month',
    plan_status TEXT NOT NULL DEFAULT 'active',
    next_billing_date TIMESTAMPTZ,
    payment_method_type TEXT,
    payment_method_last4 TEXT,
    payment_method_expiry TEXT,
    payment_method_brand TEXT,
    billing_email TEXT,
    billing_name TEXT,
    billing_address TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_postal_code TEXT,
    billing_country TEXT DEFAULT 'US',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_features JSONB,
    usage_limits JSONB,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_settings_user_id ON public.billing_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_settings_stripe_customer ON public.billing_settings(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_settings_subscription ON public.billing_settings(stripe_subscription_id);


-- ============================================================================
-- 20. BILLING INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.billing_invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    line_items JSONB,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    invoice_pdf_url TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id ON public.billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON public.billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_date ON public.billing_invoices(invoice_date);


-- ============================================================================
-- 21. PLATFORM PRICING (NEW - for multi-platform)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(50) NOT NULL UNIQUE,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_price_id_monthly VARCHAR(100),
    stripe_price_id_yearly VARCHAR(100),
    features JSONB,
    limits JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_pricing (plan_name, plan_type, price_monthly, price_yearly, features, limits, display_order) VALUES
('Free', 'free', 0, 0, 
    '["1 AI Agent", "100 conversations/month", "Basic analytics", "Email support"]'::jsonb,
    '{"agents": 1, "conversations_per_month": 100, "team_members": 1}'::jsonb, 1),
('Starter', 'starter', 29.00, 290.00,
    '["3 AI Agents", "1,000 conversations/month", "Advanced analytics", "Priority email support", "API access"]'::jsonb,
    '{"agents": 3, "conversations_per_month": 1000, "team_members": 3}'::jsonb, 2),
('Pro', 'pro', 79.00, 790.00,
    '["10 AI Agents", "10,000 conversations/month", "Full analytics suite", "Priority support", "API access", "Custom integrations", "Team collaboration"]'::jsonb,
    '{"agents": 10, "conversations_per_month": 10000, "team_members": 10}'::jsonb, 3),
('Enterprise', 'enterprise', 199.00, 1990.00,
    '["Unlimited AI Agents", "Unlimited conversations", "Enterprise analytics", "Dedicated support", "Full API access", "Custom integrations", "White-label options", "SLA guarantee"]'::jsonb,
    '{"agents": -1, "conversations_per_month": -1, "team_members": -1}'::jsonb, 4)
ON CONFLICT (plan_type) DO NOTHING;


-- ============================================================================
-- 22. GHL SUBACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ghl_subaccounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID,
    firm_id UUID,
    agent_id VARCHAR(50),
    subaccount_name VARCHAR(255),
    business_phone VARCHAR(20),
    business_address TEXT,
    business_city VARCHAR(100),
    business_state VARCHAR(50),
    business_country VARCHAR(5),
    business_postal_code VARCHAR(20),
    business_timezone VARCHAR(100),
    business_website VARCHAR(500),
    prospect_first_name VARCHAR(100),
    prospect_last_name VARCHAR(100),
    prospect_email VARCHAR(255),
    ghl_location_id VARCHAR(255),
    ghl_company_id VARCHAR(255),
    ghl_snapshot_id VARCHAR(255),
    soma_ghl_user_id VARCHAR(255),
    soma_ghl_email VARCHAR(255),
    soma_ghl_password VARCHAR(255),
    creation_status VARCHAR(50),
    automation_status VARCHAR(50),
    creation_error TEXT,
    automation_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    subaccount_created_at TIMESTAMPTZ,
    soma_user_created_at TIMESTAMPTZ,
    UNIQUE(firm_user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_ghl_subaccounts_firm_user_id ON public.ghl_subaccounts(firm_user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_subaccounts_ghl_location_id ON public.ghl_subaccounts(ghl_location_id);


-- ============================================================================
-- 23. FACEBOOK INTEGRATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.facebook_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID UNIQUE,
    firm_id UUID,
    ghl_subaccount_id UUID,
    ghl_location_id VARCHAR(255),
    facebook_email VARCHAR(255),
    facebook_password VARCHAR(255),
    soma_ghl_user_id VARCHAR(255),
    pit_token TEXT,
    access_token TEXT,
    firebase_token TEXT,
    access_token_expires_at TIMESTAMPTZ,
    facebook_business_id VARCHAR(255),
    facebook_ad_account_id VARCHAR(255),
    facebook_page_id VARCHAR(255),
    automation_status VARCHAR(50),
    automation_step VARCHAR(100),
    automation_started_at TIMESTAMPTZ,
    automation_completed_at TIMESTAMPTZ,
    automation_result JSONB,
    automation_error TEXT,
    playwright_config JSONB,
    retry_count INTEGER,
    max_retries INTEGER,
    pages JSONB,
    connected_pages JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facebook_integrations_firm_user_id ON public.facebook_integrations(firm_user_id);


-- ============================================================================
-- 24. CONTENT HISTORY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.history_content_repurposer (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    chat_history_id UUID REFERENCES public.chat_history(id),
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


CREATE TABLE IF NOT EXISTS public.history_newsletters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    chat_history_id UUID REFERENCES public.chat_history(id),
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


-- ============================================================================
-- 25. CONTENT REPURPOSER IMAGES
-- ============================================================================

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
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_post_id ON public.content_repurposer_images(post_id);
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_in_use ON public.content_repurposer_images(in_use);
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_history_in_use ON public.content_repurposer_images(history_content_repurposer_id, in_use);
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_user_in_use ON public.content_repurposer_images(user_id, in_use);

DROP TRIGGER IF EXISTS update_content_repurposer_images_updated_date ON public.content_repurposer_images;
CREATE TRIGGER update_content_repurposer_images_updated_date
    BEFORE UPDATE ON public.content_repurposer_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();


-- ============================================================================
-- 26. DOCUMENT TABLES (with embeddings for RAG)
-- ============================================================================

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


-- ============================================================================
-- 27. KNOWLEDGE BASE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.firm_users_knowledge_base (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id TEXT NOT NULL,
    file_id TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    extracted_text TEXT,
    processing_status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firm_users_knowledge_base_firm_user_id ON public.firm_users_knowledge_base(firm_user_id);
CREATE INDEX IF NOT EXISTS idx_firm_users_knowledge_base_agent_id ON public.firm_users_knowledge_base(agent_id);
CREATE INDEX IF NOT EXISTS idx_firm_users_knowledge_base_status ON public.firm_users_knowledge_base(processing_status);
CREATE INDEX IF NOT EXISTS idx_firm_users_knowledge_base_created_at ON public.firm_users_knowledge_base(created_at DESC);

CREATE OR REPLACE FUNCTION update_firm_users_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_firm_users_knowledge_base_updated_at ON public.firm_users_knowledge_base;
CREATE TRIGGER trigger_update_firm_users_knowledge_base_updated_at
    BEFORE UPDATE ON public.firm_users_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_firm_users_knowledge_base_updated_at();


-- ============================================================================
-- 28. MCP SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mcps (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    trust_level TEXT NOT NULL,
    status TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcps_status ON public.mcps(status);
CREATE INDEX IF NOT EXISTS idx_mcps_trust_level ON public.mcps(trust_level);
CREATE INDEX IF NOT EXISTS idx_mcps_created_at ON public.mcps(created_at);

DROP TRIGGER IF EXISTS update_mcps_updated_at ON public.mcps;
CREATE TRIGGER update_mcps_updated_at
    BEFORE UPDATE ON public.mcps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.mcp_audit_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    mcp_id UUID REFERENCES public.mcps(id),
    action TEXT NOT NULL,
    user_id UUID,
    tool_name TEXT,
    request_params JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_logs_mcp_id ON public.mcp_audit_logs(mcp_id);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_logs_timestamp ON public.mcp_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_logs_tool_name ON public.mcp_audit_logs(tool_name);


CREATE TABLE IF NOT EXISTS public.security_scans (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    mcp_id UUID REFERENCES public.mcps(id),
    scan_type TEXT NOT NULL DEFAULT 'full',
    risk_score INTEGER,
    vulnerabilities JSONB DEFAULT '[]',
    scan_details JSONB DEFAULT '{}',
    passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_scans_mcp_id ON public.security_scans(mcp_id);


-- ============================================================================
-- 29. TEAM MEMBERS
-- ============================================================================

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_company_id ON public.team_members(company_id);


-- ============================================================================
-- 30. REFERRAL SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referral_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    tier_level INTEGER NOT NULL UNIQUE,
    min_referrals INTEGER NOT NULL,
    max_referrals INTEGER,
    icon VARCHAR(10),
    color VARCHAR(7),
    badge_url TEXT,
    reward_multiplier NUMERIC DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.referral_tiers (tier_name, tier_level, min_referrals, max_referrals, icon, color, reward_multiplier) VALUES
    ('bronze', 1, 0, 2, '🥉', '#CD7F32', 1.00),
    ('silver', 2, 3, 5, '🥈', '#C0C0C0', 1.25),
    ('gold', 3, 6, 9, '🥇', '#FFD700', 1.50),
    ('diamond', 4, 10, NULL, '💎', '#B9F2FF', 2.00)
ON CONFLICT (tier_name) DO NOTHING;


CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_type VARCHAR(50) NOT NULL,
    reward_value JSONB NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    required_referrals INTEGER DEFAULT 1,
    tier_id UUID REFERENCES public.referral_tiers(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    referral_link TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);


CREATE TABLE IF NOT EXISTS public.user_tier_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    current_tier_id UUID REFERENCES public.referral_tiers(id),
    successful_referrals INTEGER DEFAULT 0,
    pending_referrals INTEGER DEFAULT 0,
    total_referrals INTEGER DEFAULT 0,
    referrals_to_next_tier INTEGER DEFAULT 3,
    next_tier_id UUID REFERENCES public.referral_tiers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tier_status_user_id ON public.user_tier_status(user_id);


CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referee_id UUID NOT NULL,
    referral_code_id UUID REFERENCES public.referral_codes(id),
    status VARCHAR(50) DEFAULT 'pending',
    signed_up_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    referral_source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);


CREATE TABLE IF NOT EXISTS public.user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    reward_value JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'earned',
    credits_earned INTEGER DEFAULT 0,
    credits_balance INTEGER DEFAULT 0,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON public.user_rewards(user_id);


CREATE TABLE IF NOT EXISTS public.referral_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    referral_code_id UUID REFERENCES public.referral_codes(id),
    channel VARCHAR(50) NOT NULL,
    share_type VARCHAR(50) DEFAULT 'link',
    message_shared TEXT,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    click_through_rate NUMERIC DEFAULT 0.00,
    conversion_rate NUMERIC DEFAULT 0.00,
    shared_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_shares_user_id ON public.referral_shares(user_id);


CREATE TABLE IF NOT EXISTS public.referral_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    original_position INTEGER NOT NULL,
    current_position INTEGER NOT NULL,
    spots_skipped INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'waiting',
    is_priority BOOLEAN DEFAULT FALSE,
    can_skip_instantly BOOLEAN DEFAULT FALSE,
    estimated_wait_days INTEGER,
    referrals_count INTEGER DEFAULT 0,
    social_shares_count INTEGER DEFAULT 0,
    total_skips_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_waitlist_user_id ON public.referral_waitlist(user_id);


CREATE TABLE IF NOT EXISTS public.referral_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    user_name VARCHAR(255) NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    current_tier VARCHAR(50) NOT NULL,
    global_rank INTEGER,
    conversion_rate NUMERIC DEFAULT 0.00,
    total_rewards_earned INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS public.referral_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    credits_earned INTEGER DEFAULT 0,
    badge_earned VARCHAR(100),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    UNIQUE(user_id, achievement_type)
);


-- ============================================================================
-- 31. REFERRAL FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_referral_code(p_user_id UUID)
RETURNS TABLE(code VARCHAR, referral_link TEXT) AS $$
DECLARE
    v_code VARCHAR;
    v_link TEXT;
BEGIN
    SELECT rc.code, rc.referral_link INTO v_code, v_link
    FROM referral_codes rc
    WHERE rc.user_id = p_user_id AND rc.is_active = true
    LIMIT 1;
    
    IF v_code IS NULL THEN
        SELECT 
            UPPER(SUBSTRING(COALESCE(u.raw_user_meta_data->>'full_name', u.email) FROM 1 FOR 3)) || 
            SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 4) || 
            EXTRACT(YEAR FROM NOW())::TEXT
        INTO v_code
        FROM auth.users u
        WHERE u.id = p_user_id;
        
        v_link := 'https://app.squidgy.ai/register?ref=' || v_code;
        
        INSERT INTO referral_codes (user_id, code, referral_link)
        VALUES (p_user_id, v_code, v_link);
    END IF;
    
    RETURN QUERY SELECT v_code, v_link;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION activate_referral(p_referee_id UUID)
RETURNS void AS $$
DECLARE
    v_referrer_id UUID;
    v_referral_id UUID;
BEGIN
    SELECT id, referrer_id INTO v_referral_id, v_referrer_id
    FROM referrals
    WHERE referee_id = p_referee_id AND status = 'pending'
    LIMIT 1;
    
    IF v_referral_id IS NULL THEN
        RETURN;
    END IF;
    
    UPDATE referrals
    SET status = 'completed', activated_at = NOW(), updated_at = NOW()
    WHERE id = v_referral_id;
    
    UPDATE user_tier_status
    SET 
        successful_referrals = successful_referrals + 1,
        pending_referrals = GREATEST(0, pending_referrals - 1),
        updated_at = NOW()
    WHERE user_id = v_referrer_id;
    
    INSERT INTO user_rewards (user_id, reward_type, reward_value, credits_earned, credits_balance)
    VALUES (v_referrer_id, 'credits', '{"amount": 100, "unit": "credits"}'::jsonb, 100, 100);
    
    INSERT INTO user_rewards (user_id, reward_type, reward_value, credits_earned, credits_balance)
    VALUES (p_referee_id, 'credits', '{"amount": 50, "unit": "credits"}'::jsonb, 50, 50);
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 32. ONBOARDING HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION is_onboarding_completed(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    completed_status BOOLEAN;
BEGIN
    SELECT is_completed INTO completed_status 
    FROM user_onboarding 
    WHERE user_id = p_user_id;
    RETURN COALESCE(completed_status, FALSE);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_onboarding_progress(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT row_to_json(t) INTO result
    FROM (
        SELECT 
            is_completed,
            current_step,
            completed_steps,
            business_type,
            selected_departments,
            selected_assistants,
            onboarding_started_at,
            onboarding_completed_at,
            last_updated
        FROM user_onboarding 
        WHERE user_id = p_user_id
    ) t;
    RETURN result;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES 
    ('agentkbs', 'agentkbs', true),
    ('avatars', 'avatars', true),
    ('company', 'company', true),
    ('content_repurposer', 'content_repurposer', true),
    ('invoices', 'invoices', true),
    ('newsletter', 'newsletter', true),
    ('newsletter-images', 'newsletter-images', true),
    ('profiles', 'profiles', true),
    ('static', 'static', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;


-- ============================================================================
-- DONE!
-- ============================================================================
-- 
-- Next steps after running this script:
-- 1. Configure email templates in Supabase Auth settings
-- 2. Set up custom SMTP for branded emails
-- 3. Update environment variables with this project's URL and keys
-- 4. Customize platform_pricing table with platform-specific pricing
-- 5. Enable RLS policies as needed for production
--
-- ============================================================================
