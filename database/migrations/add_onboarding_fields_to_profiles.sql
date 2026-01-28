-- Add one-time onboarding fields to profiles table
-- These are asked once during first agent setup, then reused for additional agents

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50),
ADD COLUMN IF NOT EXISTS primary_goals TEXT,
ADD COLUMN IF NOT EXISTS calendar_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.target_audience IS 'User selected target audience (b2b, b2c, both, enterprise) - set during first agent onboarding';
COMMENT ON COLUMN profiles.primary_goals IS 'User selected primary goals (comma-separated) - set during first agent onboarding';
COMMENT ON COLUMN profiles.calendar_type IS 'User selected calendar type (google, outlook, apple) - set during first agent onboarding';
COMMENT ON COLUMN profiles.notifications_enabled IS 'Whether user enabled notifications - set during first agent onboarding';
