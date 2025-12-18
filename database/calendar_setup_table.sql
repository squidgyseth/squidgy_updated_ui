-- ===========================================
-- CALENDAR SETUP TABLE
-- ===========================================
-- Updated based on actual Supabase database analysis (December 2024)
-- Stores calendar setup data from the CalendarSetup.tsx page

CREATE TABLE IF NOT EXISTS public.calendar_setup (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID,  -- No FK constraint in actual DB
    agent_id VARCHAR(50) DEFAULT 'SOL',
    
    -- Calendar Information
    calendar_name VARCHAR(255) NOT NULL DEFAULT 'Solar consultations',
    description TEXT,
    
    -- Scheduling Configuration
    call_duration INTEGER NOT NULL DEFAULT 60, -- Minutes (30, 45, 60, 90)
    max_calls_per_day INTEGER NOT NULL DEFAULT 8,
    
    -- Rules
    notice_hours INTEGER NOT NULL DEFAULT 24, -- Hours notice required
    book_ahead_days INTEGER NOT NULL DEFAULT 24, -- Maximum days ahead to book
    auto_confirm BOOLEAN NOT NULL DEFAULT true,
    allow_rescheduling BOOLEAN NOT NULL DEFAULT true,
    allow_cancellations BOOLEAN NOT NULL DEFAULT true,
    
    -- Business Hours (JSON object for flexibility)
    business_hours JSONB NOT NULL DEFAULT '{
        "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "thursday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "friday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "saturday": {"enabled": false, "start": "09:00", "end": "17:00"},
        "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}
    }',
    
    -- GHL Integration
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    
    -- Metadata
    setup_status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint (enforced via index in actual DB)
    -- UNIQUE(firm_user_id, agent_id)
);

-- Create indexes for better performance
CREATE UNIQUE INDEX IF NOT EXISTS unique_calendar_setup 
    ON public.calendar_setup(firm_user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_calendar_setup_firm_user_id ON calendar_setup(firm_user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_setup_agent_id ON calendar_setup(agent_id);
CREATE INDEX IF NOT EXISTS idx_calendar_setup_last_updated ON calendar_setup(last_updated_timestamp);

-- Create trigger to automatically update last_updated_timestamp
CREATE OR REPLACE FUNCTION update_calendar_setup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_setup_timestamp
    BEFORE UPDATE ON calendar_setup
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_setup_timestamp();

-- Example usage:
-- INSERT INTO calendar_setup (
--     firm_user_id, agent_id, calendar_name, description,
--     call_duration, max_calls_per_day, notice_hours, book_ahead_days,
--     auto_confirm, allow_rescheduling, allow_cancellations,
--     business_hours
-- ) VALUES (
--     'user-uuid-here', 'SOL', 'Solar consultations', 
--     'Schedule solar consultations and site visits with potential customers.',
--     60, 8, 24, 24,
--     true, true, true,
--     '{"monday": {"enabled": true, "start": "09:00", "end": "17:00"}}'::jsonb
-- );