-- Add columns to track if user actually viewed and scrolled through terms
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_viewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_scrolled_to_bottom BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_viewed_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS privacy_viewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_scrolled_to_bottom BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_viewed_timestamp TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN profiles.terms_viewed IS 'Tracks if user opened and viewed the Beta User Agreement';
COMMENT ON COLUMN profiles.terms_scrolled_to_bottom IS 'Tracks if user scrolled to the bottom of the Beta User Agreement';
COMMENT ON COLUMN profiles.terms_viewed_timestamp IS 'Timestamp when user viewed the Beta User Agreement';
COMMENT ON COLUMN profiles.privacy_viewed IS 'Tracks if user opened and viewed the Privacy Policy';
COMMENT ON COLUMN profiles.privacy_scrolled_to_bottom IS 'Tracks if user scrolled to the bottom of the Privacy Policy';
COMMENT ON COLUMN profiles.privacy_viewed_timestamp IS 'Timestamp when user viewed the Privacy Policy';
