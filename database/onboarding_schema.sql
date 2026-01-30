-- ===========================================
-- ONBOARDING SYSTEM DATABASE SCHEMA
-- ===========================================
-- Comprehensive database design for 4-step onboarding flow
-- Stores all onboarding data with proper user completion tracking

-- ===== ENSURE UNIQUE CONSTRAINT ON PROFILES.USER_ID =====
-- Add unique constraint to profiles.user_id if it doesn't exist
-- This allows us to reference it as a foreign key
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- ===== MAIN ONBOARDING TABLE =====
-- Stores the main onboarding progress and completion status
CREATE TABLE IF NOT EXISTS user_onboarding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Onboarding Status
    is_completed BOOLEAN DEFAULT FALSE,
    current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 6),
    completed_steps INTEGER[] DEFAULT '{}'::INTEGER[], -- Array of completed step numbers
    
    -- Step 1: Business Type Selection
    business_type VARCHAR(50), -- 'ecommerce', 'agency_creative', 'saas_tech', etc.
    
    -- Step 2: Support Areas (Departments)
    selected_departments TEXT[], -- Array of department IDs ['marketing', 'sales', etc.]
    
    -- Step 3: Assistant Selection
    selected_assistants TEXT[], -- Array of assistant IDs ['social_media_manager', etc.]
    
    -- Overall completion tracking
    onboarding_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one onboarding record per user
    UNIQUE(user_id)
);

-- ===== STEP 4: PERSONALIZATION TABLE =====
-- Stores individual assistant personalizations
CREATE TABLE IF NOT EXISTS assistant_personalizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    assistant_id VARCHAR(100) NOT NULL, -- Links to agents in YAML config
    
    -- Personalization Data
    custom_name VARCHAR(255), -- Custom name for the assistant
    avatar_style VARCHAR(50) DEFAULT 'professional', -- 'professional', 'friendly', 'corporate', 'creative'
    communication_tone VARCHAR(50) DEFAULT 'professional', -- 'professional', 'friendly', 'casual', 'formal'
    
    -- Additional customization options (future expansion)
    custom_instructions TEXT, -- Custom instructions for the assistant
    is_enabled BOOLEAN DEFAULT TRUE, -- Whether this assistant is active
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique personalization per user-assistant combination
    UNIQUE(user_id, assistant_id)
);

-- ===== STEP 5: COMPANY DETAILS TABLE =====
-- Stores detailed company information (extending existing business_details pattern)
CREATE TABLE IF NOT EXISTS onboarding_company_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Basic Company Information
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    company_phone VARCHAR(50),
    website_url VARCHAR(500),
    
    -- Industry and Size
    industry VARCHAR(100), -- 'Technology', 'Healthcare', 'Finance', etc.
    company_size VARCHAR(50), -- '1-10', '11-50', '51-200', '200+', etc.
    
    -- Location Information
    country VARCHAR(10) DEFAULT 'US',
    city VARCHAR(100),
    state VARCHAR(100),
    time_zone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Business Goals and Preferences
    primary_goals TEXT, -- Comma-separated primary business goals
    ai_experience_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    preferred_working_hours VARCHAR(100), -- 'Business hours', '24/7', 'Flexible'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique company details per user
    UNIQUE(user_id)
);

-- ===== ONBOARDING SESSION TRACKING =====
-- Tracks individual onboarding sessions for analytics
CREATE TABLE IF NOT EXISTS onboarding_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL, -- Browser session ID
    
    -- Session Details
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    abandoned_at_step INTEGER, -- Which step user abandoned (if incomplete)
    
    -- Technical Information
    user_agent TEXT,
    ip_address INET,
    referrer VARCHAR(500),
    
    -- Completion Status
    is_completed BOOLEAN DEFAULT FALSE,
    completion_time_minutes INTEGER, -- Total time taken to complete onboarding
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEXES FOR PERFORMANCE =====
-- Main onboarding table
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_business_type ON user_onboarding(business_type);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_last_updated ON user_onboarding(last_updated DESC);

-- Personalizations table
CREATE INDEX IF NOT EXISTS idx_assistant_personalizations_user_id ON assistant_personalizations(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_personalizations_assistant_id ON assistant_personalizations(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_personalizations_enabled ON assistant_personalizations(is_enabled);

-- Company details table
CREATE INDEX IF NOT EXISTS idx_onboarding_company_details_user_id ON onboarding_company_details(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_company_details_industry ON onboarding_company_details(industry);
CREATE INDEX IF NOT EXISTS idx_onboarding_company_details_company_size ON onboarding_company_details(company_size);

-- Sessions table
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_completed ON onboarding_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_started_at ON onboarding_sessions(started_at DESC);

-- ===== TRIGGERS FOR AUTO-UPDATING TIMESTAMPS =====
-- User onboarding trigger
CREATE OR REPLACE FUNCTION update_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    
    -- Auto-update completion timestamp when marked as completed
    IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
        NEW.onboarding_completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_timestamp
    BEFORE UPDATE ON user_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_timestamp();

-- Assistant personalizations trigger
CREATE OR REPLACE FUNCTION update_personalization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personalization_timestamp
    BEFORE UPDATE ON assistant_personalizations
    FOR EACH ROW
    EXECUTE FUNCTION update_personalization_timestamp();

-- Company details trigger
CREATE OR REPLACE FUNCTION update_company_details_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_details_onboarding_timestamp
    BEFORE UPDATE ON onboarding_company_details
    FOR EACH ROW
    EXECUTE FUNCTION update_company_details_onboarding_timestamp();

-- ===== ROW LEVEL SECURITY (RLS) =====
-- RLS removed for simplified database setup

-- ===== HELPER FUNCTIONS =====
-- Function to check if user has completed onboarding
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

-- Function to get user's onboarding progress
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

-- ===== EXAMPLE USAGE =====
-- Check if user completed onboarding:
-- SELECT is_onboarding_completed('user-uuid-here');

-- Get user's full onboarding progress:
-- SELECT get_onboarding_progress('user-uuid-here');

-- Insert sample onboarding data:
-- INSERT INTO user_onboarding (
--     user_id, business_type, selected_departments, selected_assistants, current_step
-- ) VALUES (
--     'user-uuid-here', 'saas_tech', 
--     ARRAY['marketing', 'sales', 'product_dev'], 
--     ARRAY['social_media_manager', 'content_strategist', 'lead_qualifier'],
--     4
-- );