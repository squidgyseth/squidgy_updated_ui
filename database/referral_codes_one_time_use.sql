-- Migration: Add one-time use tracking to referral_codes table
-- This migration adds the used_at column to track when a referral code was used
-- making codes single-use only

-- Existing schema:
-- - id: uuid (primary key)
-- - user_id: uuid (owner of the code)
-- - code: varchar(50) (unique referral code)
-- - referral_link: text (full URL with code)
-- - is_active: boolean (default true)
-- - created_at: timestamp
-- - updated_at: timestamp

-- Add used_at column to track when code was used
-- Add used_by_user_id to track which user used this code
ALTER TABLE public.referral_codes
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS used_by_user_id UUID NULL DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN public.referral_codes.used_at IS 'Timestamp when this referral code was used for registration. NULL means unused.';
COMMENT ON COLUMN public.referral_codes.used_by_user_id IS 'User ID of the person who used this referral code. NULL means unused.';

-- Create index for better query performance when checking if code is used
CREATE INDEX IF NOT EXISTS idx_referral_codes_used_at ON public.referral_codes USING btree (used_at) TABLESPACE pg_default;

-- Create index for used_by_user_id for tracking
CREATE INDEX IF NOT EXISTS idx_referral_codes_used_by ON public.referral_codes USING btree (used_by_user_id) TABLESPACE pg_default;

-- Update existing codes to ensure they are marked as unused (used_at = NULL is already the default)
-- This ensures all existing codes can still be used once
UPDATE public.referral_codes
SET used_at = NULL, used_by_user_id = NULL
WHERE used_at IS NOT NULL;

-- Note: After this migration:
-- 1. Codes with used_at = NULL are available for use (one-time use)
-- 2. Codes with used_at = <timestamp> have been used and cannot be used again
-- 3. When a user registers with a code:
--    - used_at is set to current timestamp
--    - used_by_user_id is set to the new user's ID
--    - is_active is set to false
-- 4. Each code can only be used ONCE by ONE user
