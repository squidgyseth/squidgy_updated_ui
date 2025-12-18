-- ===========================================
-- WEBSITE ANALYSIS TABLE
-- ===========================================
-- Updated based on actual Supabase database analysis (December 2024)
-- Stores website analysis data from the WebsiteDetails.tsx page

CREATE TABLE IF NOT EXISTS public.website_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    firm_user_id UUID NOT NULL,
    agent_id VARCHAR(50) NOT NULL,
    firm_id UUID NOT NULL,
    website_url VARCHAR(500) NOT NULL,
    company_description TEXT,
    value_proposition TEXT,
    business_niche TEXT,
    tags TEXT[],
    screenshot_url VARCHAR(500),
    favicon_url VARCHAR(500),
    analysis_status VARCHAR(20),
    
    -- Additional fields from actual DB
    business_domain TEXT,
    newsletter_questions TEXT,
    company_name TEXT,
    
    -- GHL Integration
    ghl_location_id VARCHAR(255),
    ghl_user_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_analysis_firm_user_id ON website_analysis(firm_user_id);
CREATE INDEX IF NOT EXISTS idx_website_analysis_agent_id ON website_analysis(agent_id);
CREATE INDEX IF NOT EXISTS idx_website_analysis_last_updated ON website_analysis(last_updated_timestamp);

-- Create trigger to automatically update last_updated_timestamp
CREATE OR REPLACE FUNCTION update_website_analysis_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_website_analysis_timestamp
    BEFORE UPDATE ON website_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_website_analysis_timestamp();

-- Example usage:
-- INSERT INTO website_analysis (firm_user_id, agent_id, website_url, company_description, value_proposition, business_niche, tags)
-- VALUES ('user-uuid-here', 'SOL', 'https://www.nike.com', 'Nike is a leading athletic wear company...', 'Innovation in sports...', 'Athletic apparel market', ARRAY['Sports', 'Innovation', 'Athletic Wear', 'Footwear', 'Apparel']);