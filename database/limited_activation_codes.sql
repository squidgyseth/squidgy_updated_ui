-- Migration: Create limited activation codes table
-- Single table managing activation codes with usage limits

CREATE TABLE IF NOT EXISTS public.limited_activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    max_uses INTEGER NOT NULL DEFAULT 50,
    current_uses INTEGER NOT NULL DEFAULT 0,
    registered_users UUID[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.limited_activation_codes IS 'Activation codes with limited usage counters for special promotions or beta access';
COMMENT ON COLUMN public.limited_activation_codes.code IS 'The activation code that users will enter (e.g. BETA50, EARLY2026)';
COMMENT ON COLUMN public.limited_activation_codes.max_uses IS 'Maximum number of times this code can be used';
COMMENT ON COLUMN public.limited_activation_codes.current_uses IS 'Current number of times this code has been used';
COMMENT ON COLUMN public.limited_activation_codes.registered_users IS 'Array of user IDs who have registered using this activation code';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_limited_activation_codes_code ON public.limited_activation_codes (code);
CREATE INDEX IF NOT EXISTS idx_limited_activation_codes_active ON public.limited_activation_codes (is_active);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_limited_activation_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_limited_activation_codes_updated_at ON public.limited_activation_codes;
CREATE TRIGGER trigger_update_limited_activation_codes_updated_at
    BEFORE UPDATE ON public.limited_activation_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_limited_activation_codes_updated_at();

-- Function to validate and use a limited activation code
CREATE OR REPLACE FUNCTION validate_and_use_limited_code(
    p_code VARCHAR,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    code_record RECORD;
    result JSON;
BEGIN
    -- Find the activation code
    SELECT id, code, max_uses, current_uses, is_active, expires_at, registered_users
    INTO code_record
    FROM public.limited_activation_codes
    WHERE code = UPPER(TRIM(p_code))
    AND is_active = true;
    
    -- Check if code exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Invalid activation code');
    END IF;
    
    -- Check if code has expired
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
        RETURN json_build_object('success', false, 'message', 'Activation code has expired');
    END IF;
    
    -- Check if usage limit has been reached
    IF code_record.current_uses >= code_record.max_uses THEN
        RETURN json_build_object('success', false, 'message', 'Activation code has reached its usage limit');
    END IF;
    
    -- Check if user has already used this code
    IF p_user_id = ANY(code_record.registered_users) THEN
        RETURN json_build_object('success', false, 'message', 'You have already used this activation code');
    END IF;
    
    -- Increment usage count and add user to registered_users array
    UPDATE public.limited_activation_codes
    SET 
        current_uses = current_uses + 1,
        registered_users = array_append(registered_users, p_user_id)
    WHERE id = code_record.id
    AND NOT (p_user_id = ANY(registered_users)); -- Prevent duplicate entries
    
    -- Return success with remaining uses (after increment)
    -- current_uses in code_record is the OLD value (before UPDATE)
    -- After UPDATE, current_uses will be +1, so remaining = max_uses - (old_current_uses + 1)
    RETURN json_build_object(
        'success', true,
        'message', 'Activation code successfully used',
        'remaining_uses', (code_record.max_uses - code_record.current_uses - 1)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error processing activation code: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Seed sample codes
INSERT INTO public.limited_activation_codes (code, description, max_uses) VALUES
('BETA50', 'Early Beta Access - First 50 users only', 50),
('EARLY2026', 'Early Adopter Programme - Limited to 100 users', 100),
('FOUNDERS', 'Founders Circle - Exclusive 25 user access', 25),
('LAUNCH20', 'Launch Special - First 20 users get premium features', 20)
ON CONFLICT (code) DO NOTHING;

-- Verify
SELECT code, max_uses, current_uses, (max_uses - current_uses) AS remaining
FROM public.limited_activation_codes;