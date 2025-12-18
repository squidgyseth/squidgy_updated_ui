-- ===========================================
-- NOTIFICATION PREFERENCES TABLE
-- ===========================================
-- Updated based on actual Supabase database analysis (December 2024)
-- Stores notification preferences data from the NotificationPreferences.tsx page

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID,  -- No FK constraint in actual DB
    agent_id VARCHAR(50) DEFAULT 'SOL',
    
    -- Notification Channels (enabled/disabled)
    email_enabled BOOLEAN DEFAULT TRUE,
    messenger_enabled BOOLEAN DEFAULT FALSE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    ghl_enabled BOOLEAN DEFAULT FALSE,
    
    -- Email for notifications
    notification_email VARCHAR(255),
    
    -- Notification Types (what to get notified about)
    appointment_confirmations BOOLEAN DEFAULT TRUE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    cancellations_reschedules BOOLEAN DEFAULT TRUE,
    
    -- GHL Integration
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    
    -- Metadata
    setup_status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint (enforced via index in actual DB)
CREATE UNIQUE INDEX IF NOT EXISTS unique_notification_preferences 
    ON public.notification_preferences(firm_user_id, agent_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_firm_user_id ON notification_preferences(firm_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_agent_id ON notification_preferences(agent_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_notification_email ON notification_preferences(notification_email);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_last_updated ON notification_preferences(last_updated_timestamp);

-- Create trigger to automatically update last_updated_timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_timestamp
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_timestamp();

-- Example usage:
-- INSERT INTO notification_preferences (
--     firm_user_id, agent_id, email_enabled, messenger_enabled, sms_enabled,
--     whatsapp_enabled, ghl_enabled, notification_email,
--     appointment_confirmations, appointment_reminders, cancellations_reschedules
-- ) VALUES (
--     'user-uuid-here', 'SOL', true, true, false,
--     false, false, 'info@rmsenergy.com',
--     true, true, true
-- );