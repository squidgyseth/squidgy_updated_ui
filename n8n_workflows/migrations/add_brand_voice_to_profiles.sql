-- Add brand_voice column to profiles table
-- Created: 2025-01-17

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS brand_voice TEXT;

COMMENT ON COLUMN public.profiles.brand_voice IS 'Communication tone for content (e.g., Professional and authoritative)';
