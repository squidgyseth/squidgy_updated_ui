-- Solar Setup Table Creation Script
-- This table stores solar setup data from the SolarSetup.tsx page

CREATE TABLE IF NOT EXISTS public.solar_setup (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID,  -- No FK constraint in actual DB
    agent_id VARCHAR(50) DEFAULT 'SOL',
    
    -- Pricing Information
    installation_price NUMERIC,
    dealer_fee NUMERIC,
    broker_fee NUMERIC,
    
    -- Purchase Options
    allow_financed BOOLEAN,
    allow_cash BOOLEAN,
    
    -- Financing Details
    financing_apr NUMERIC,
    financing_term INTEGER,
    
    -- Energy Information
    energy_price NUMERIC,
    yearly_electric_cost_increase NUMERIC,
    
    -- Installation Details
    installation_lifespan INTEGER,
    typical_panel_count INTEGER,
    max_roof_segments INTEGER,
    solar_incentive NUMERIC,
    
    -- Property and Currency (added fields from actual DB)
    property_type VARCHAR(20) NOT NULL DEFAULT 'Residential',
    currency VARCHAR(3) DEFAULT 'GBP',
    
    -- Setup JSON for additional configuration
    setup_json JSONB,
    
    -- GHL Integration
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    
    -- Metadata
    setup_status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint (enforced via index in actual DB)
CREATE UNIQUE INDEX IF NOT EXISTS unique_solar_setup 
    ON public.solar_setup(firm_user_id, agent_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_solar_setup_firm_user_id ON solar_setup(firm_user_id);
CREATE INDEX IF NOT EXISTS idx_solar_setup_agent_id ON solar_setup(agent_id);
CREATE INDEX IF NOT EXISTS idx_solar_setup_last_updated ON solar_setup(last_updated_timestamp);

-- Create trigger to automatically update last_updated_timestamp
CREATE OR REPLACE FUNCTION update_solar_setup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_solar_setup_timestamp
    BEFORE UPDATE ON solar_setup
    FOR EACH ROW
    EXECUTE FUNCTION update_solar_setup_timestamp();

-- Example usage:
-- INSERT INTO solar_setup (
--     firm_user_id, agent_id, installation_price, dealer_fee, broker_fee,
--     allow_financed, allow_cash, financing_apr, financing_term,
--     energy_price, yearly_electric_cost_increase, installation_lifespan,
--     typical_panel_count, max_roof_segments, solar_incentive
-- ) VALUES (
--     'user-uuid-here', 'SOL', 2.00, 15.0, 0.00,
--     true, true, 5.0, 240,
--     0.170, 4.0, 20,
--     40, 4, 3.0
-- );