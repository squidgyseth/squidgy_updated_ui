-- =====================================================
-- VERIFY AND RECREATE TABLES IF NEEDED
-- =====================================================
-- Check if tables exist and recreate them if necessary

-- Drop and recreate tables to ensure they're properly configured
DROP TABLE IF EXISTS referral_codes CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS user_tier_status CASCADE;
DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS referral_shares CASCADE;
DROP TABLE IF EXISTS referral_clicks CASCADE;
DROP TABLE IF EXISTS referral_waitlist CASCADE;
DROP TABLE IF EXISTS referral_leaderboard CASCADE;
DROP TABLE IF EXISTS referral_achievements CASCADE;

-- Keep referral_tiers as it has our data
-- DROP TABLE IF EXISTS referral_tiers CASCADE;

-- Create referral_codes table
CREATE TABLE referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    referral_link TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_tier_status table  
CREATE TABLE user_tier_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    current_tier_id UUID,
    successful_referrals INTEGER DEFAULT 0,
    pending_referrals INTEGER DEFAULT 0,
    total_referrals INTEGER DEFAULT 0,
    referrals_to_next_tier INTEGER DEFAULT 3,
    next_tier_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referral_waitlist table
CREATE TABLE referral_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    original_position INTEGER NOT NULL,
    current_position INTEGER NOT NULL,
    spots_skipped INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'waiting',
    is_priority BOOLEAN DEFAULT false,
    can_skip_instantly BOOLEAN DEFAULT false,
    estimated_wait_days INTEGER,
    referrals_count INTEGER DEFAULT 0,
    social_shares_count INTEGER DEFAULT 0,
    total_skips_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create other tables
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referee_id UUID NOT NULL,
    referral_code_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    signed_up_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    referral_source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    reward_value JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'earned',
    credits_earned INTEGER DEFAULT 0,
    credits_balance INTEGER DEFAULT 0,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referral_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    referral_code_id UUID,
    channel VARCHAR(50) NOT NULL,
    share_type VARCHAR(50) DEFAULT 'link',
    message_shared TEXT,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    shared_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referral_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    user_name VARCHAR(255) NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    current_tier VARCHAR(50) NOT NULL,
    global_rank INTEGER,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    total_rewards_earned INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referral_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    credits_earned INTEGER DEFAULT 0,
    badge_earned VARCHAR(100),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    UNIQUE(user_id, achievement_type)
);

-- Make sure referral_tiers exists with data
CREATE TABLE IF NOT EXISTS referral_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    tier_level INTEGER NOT NULL UNIQUE,
    min_referrals INTEGER NOT NULL,
    max_referrals INTEGER,
    icon VARCHAR(10),
    color VARCHAR(7),
    reward_multiplier DECIMAL(3,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert tier data
INSERT INTO referral_tiers (tier_name, tier_level, min_referrals, max_referrals, icon, color, reward_multiplier) 
VALUES
    ('bronze', 1, 0, 2, '🥉', '#CD7F32', 1.00),
    ('silver', 2, 3, 5, '🥈', '#C0C0C0', 1.25),
    ('gold', 3, 6, 9, '🥇', '#FFD700', 1.50),
    ('diamond', 4, 10, NULL, '💎', '#B9F2FF', 2.00)
ON CONFLICT (tier_name) DO UPDATE SET
    tier_level = EXCLUDED.tier_level,
    min_referrals = EXCLUDED.min_referrals,
    max_referrals = EXCLUDED.max_referrals,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    reward_multiplier = EXCLUDED.reward_multiplier;

-- Ensure all tables are in public schema and accessible
-- Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, postgres;

-- Specifically grant on our tables
GRANT ALL ON referral_codes TO authenticated, anon, postgres;
GRANT ALL ON referrals TO authenticated, anon, postgres;
GRANT ALL ON referral_tiers TO authenticated, anon, postgres;
GRANT ALL ON user_tier_status TO authenticated, anon, postgres;
GRANT ALL ON user_rewards TO authenticated, anon, postgres;
GRANT ALL ON referral_shares TO authenticated, anon, postgres;
GRANT ALL ON referral_waitlist TO authenticated, anon, postgres;
GRANT ALL ON referral_leaderboard TO authenticated, anon, postgres;
GRANT ALL ON referral_achievements TO authenticated, anon, postgres;

-- Disable RLS completely
ALTER TABLE referral_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tier_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_waitlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_leaderboard DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_achievements DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_user_tier_status_user_id ON user_tier_status(user_id);
CREATE INDEX idx_referral_waitlist_user_id ON referral_waitlist(user_id);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referral_shares_user_id ON referral_shares(user_id);