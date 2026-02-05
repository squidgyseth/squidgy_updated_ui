-- Add GDPR consent fields to profiles table for registration
-- These track user consent for terms, AI processing, and marketing communications

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS ai_processing_consent BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN profiles.terms_accepted IS 'User accepted Beta User Agreement and Privacy Policy (required for registration)';
COMMENT ON COLUMN profiles.ai_processing_consent IS 'User consented to content being processed by AI services (required for registration)';
COMMENT ON COLUMN profiles.marketing_consent IS 'User opted in to receive marketing communications (optional)';
COMMENT ON COLUMN profiles.consent_timestamp IS 'Timestamp when consent was given during registration';

-- Create index for querying users by consent status
CREATE INDEX IF NOT EXISTS idx_profiles_consent ON profiles(terms_accepted, ai_processing_consent);
