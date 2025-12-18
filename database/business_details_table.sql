-- ===========================================
-- BUSINESS DETAILS TABLE
-- ===========================================
-- Updated based on actual Supabase database analysis (December 2024)
-- Stores business details data from the BusinessDetails.tsx page

CREATE TABLE IF NOT EXISTS public.business_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID,  -- No FK constraint in actual DB
    agent_id VARCHAR(50) DEFAULT 'SOL',
    
    -- Business Information
    business_name VARCHAR(255),
    business_email VARCHAR(255),
    phone_number VARCHAR(50),
    emergency_numbers TEXT[],  -- Array of emergency phone numbers
    
    -- Location Information
    country VARCHAR(10) DEFAULT 'US',
    address_method VARCHAR(20) DEFAULT 'manual',
    address_line VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- GHL Integration
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    
    -- Metadata
    setup_status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint (enforced via index in actual DB)
CREATE UNIQUE INDEX IF NOT EXISTS unique_business_details 
    ON public.business_details(firm_user_id, agent_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_details_firm_user_id ON business_details(firm_user_id);
CREATE INDEX IF NOT EXISTS idx_business_details_agent_id ON business_details(agent_id);
CREATE INDEX IF NOT EXISTS idx_business_details_business_email ON business_details(business_email);
CREATE INDEX IF NOT EXISTS idx_business_details_last_updated ON business_details(last_updated_timestamp);

-- Create trigger to automatically update last_updated_timestamp
CREATE OR REPLACE FUNCTION update_business_details_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_business_details_timestamp
    BEFORE UPDATE ON business_details
    FOR EACH ROW
    EXECUTE FUNCTION update_business_details_timestamp();

-- Example usage:
-- INSERT INTO business_details (
--     firm_user_id, agent_id, business_name, business_email, phone_number,
--     emergency_numbers, country, address_line, city, state, postal_code
-- ) VALUES (
--     'user-uuid-here', 'SOL', 'RMS Energy Ltd.', 'info@rmsenergy.com', '888-683-3630',
--     ARRAY['888-683-3631'], 'US', '15396 183rd St Little Falls, MN 56345', 
--     'Little Falls', 'Minnesota', '56345'
-- );