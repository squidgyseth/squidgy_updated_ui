-- ===========================================
-- ADMIN SYSTEM DATABASE SCHEMA
-- ===========================================
-- Simple role-based admin system with is_super_admin flag

-- ===== ADD SUPER ADMIN FLAG TO PROFILES =====
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Create index for quick admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin) WHERE is_super_admin = TRUE;

-- ===== ADMIN ACTIVITY LOG TABLE =====
-- Track all admin actions for audit purposes
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- 'user_created', 'user_deleted', 'user_updated', 'settings_changed', etc.
    target_user_id UUID, -- The user being acted upon (if applicable)
    target_resource_type VARCHAR(100), -- 'user', 'agent', 'company', 'settings', etc.
    target_resource_id VARCHAR(255), -- ID of the resource being modified
    action_details JSONB DEFAULT '{}', -- Additional details about the action
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin activity log
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target_user ON admin_activity_log(target_user_id);

-- ===== PLATFORM SETTINGS TABLE =====
-- Store platform-wide settings that only admins can modify
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID, -- Admin who last updated this setting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES
    ('registration_enabled', 'true', 'Allow new user registrations'),
    ('maintenance_mode', 'false', 'Enable maintenance mode'),
    ('max_agents_per_user', '10', 'Maximum number of agents a user can create'),
    ('default_user_role', '"member"', 'Default role for new users')
ON CONFLICT (setting_key) DO NOTHING;

-- ===== HELPER FUNCTIONS =====

-- Function to check if a user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    SELECT is_super_admin INTO admin_status 
    FROM profiles 
    WHERE user_id = p_user_id OR id = p_user_id;
    
    RETURN COALESCE(admin_status, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_user_id UUID,
    p_action_type VARCHAR(100),
    p_target_user_id UUID DEFAULT NULL,
    p_target_resource_type VARCHAR(100) DEFAULT NULL,
    p_target_resource_id VARCHAR(255) DEFAULT NULL,
    p_action_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_activity_log (
        admin_user_id,
        action_type,
        target_user_id,
        target_resource_type,
        target_resource_id,
        action_details
    ) VALUES (
        p_admin_user_id,
        p_action_type,
        p_target_user_id,
        p_target_resource_type,
        p_target_resource_id,
        p_action_details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update platform_settings timestamp
CREATE OR REPLACE FUNCTION update_platform_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_platform_settings_timestamp ON platform_settings;
CREATE TRIGGER trigger_update_platform_settings_timestamp
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_settings_timestamp();

-- ===== FOREIGN KEY CONSTRAINTS =====
-- Link activity log to profiles for easier tracking in Supabase
ALTER TABLE admin_activity_log
ADD CONSTRAINT fk_admin_activity_log_target_user
FOREIGN KEY (target_user_id) REFERENCES profiles(user_id)
ON DELETE SET NULL;

ALTER TABLE admin_activity_log
ADD CONSTRAINT fk_admin_activity_log_admin_user
FOREIGN KEY (admin_user_id) REFERENCES profiles(user_id)
ON DELETE SET NULL;

-- ===== GRANT FIRST SUPER ADMIN =====
-- Run this manually to set your first admin (replace with actual email)
-- UPDATE profiles SET is_super_admin = TRUE WHERE email = 'your-admin-email@example.com';

-- ===== EXAMPLE USAGE =====
-- Check if user is admin:
-- SELECT is_super_admin('user-uuid-here');

-- Log an admin action:
-- SELECT log_admin_activity(
--     'admin-uuid',
--     'user_deleted',
--     'target-user-uuid',
--     'user',
--     'target-user-uuid',
--     '{"reason": "Spam account"}'::jsonb
-- );

-- Get all admin users:
-- SELECT id, email, full_name FROM profiles WHERE is_super_admin = TRUE;

-- Get recent admin activity:
-- SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT 50;
