-- ============================================================================
-- VERIFY NEW PLATFORM SETUP
-- ============================================================================
-- Run this AFTER running NEW_PLATFORM_SETUP.sql to verify core tables exist.
-- 
-- This checks the 7 core tables required for multi-platform compatibility.
-- ============================================================================


-- ============================================================================
-- VERIFICATION QUERIES (Run each section separately in Supabase SQL Editor)
-- ============================================================================


-- 1. CHECK ALL CORE TABLES EXIST
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT unnest(ARRAY['profiles', 'billing_settings', 'team_members', 'chat_history', 'agents', 'platform_config', 'api_keys']) as required_table
) r
LEFT JOIN information_schema.tables t 
    ON t.table_schema = 'public' AND t.table_name = r.required_table
ORDER BY required_table;


-- 2. CHECK PROFILES TABLE COLUMNS
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;


-- 3. CHECK BILLING_SETTINGS HAS MULTI-PLATFORM COLUMNS
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'billing_settings'
AND column_name IN ('billing_model', 'seats_purchased', 'seats_used', 'agent_access', 'usage_this_period')
ORDER BY column_name;


-- 4. CHECK TEAM_MEMBERS HAS MULTI-PLATFORM COLUMNS
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'team_members'
AND column_name IN ('permissions', 'allowed_agents');


-- 5. CHECK CHAT_HISTORY HAS USAGE TRACKING COLUMNS
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'chat_history'
AND column_name IN ('tokens_used', 'cost_usd');


-- 6. CHECK PLATFORM_CONFIG TABLE STRUCTURE
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'platform_config'
ORDER BY ordinal_position;


-- 7. CHECK API_KEYS TABLE STRUCTURE
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'api_keys'
ORDER BY ordinal_position;


-- 8. CHECK HELPER FUNCTIONS EXIST
SELECT proname as function_name, 
       CASE WHEN proname IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('check_agent_access', 'get_user_agents', 'track_usage', 'handle_new_user', 'update_updated_at');


-- 9. CHECK STORAGE BUCKETS
SELECT id, name, public
FROM storage.buckets
WHERE id IN ('avatars', 'content', 'documents');


-- 10. CHECK EXTENSIONS


-- ============================================================================
-- EXPECTED RESULTS SUMMARY
-- ============================================================================
-- 
-- Query 1: All 7 tables should show "✅ EXISTS"
-- Query 2: profiles should have: id, user_id, email, full_name, company_id, etc.
-- Query 3: billing_settings should have 5 multi-platform columns
-- Query 4: team_members should have: permissions, allowed_agents
-- Query 5: chat_history should have: tokens_used, cost_usd
-- Query 6: platform_config should have: platform_id, platform_name, billing_model, etc.
-- Query 7: api_keys should have: user_id, key_hash, key_prefix, scopes, etc.
-- Query 8: All 5 functions should show "✅ EXISTS"
-- Query 9: 3 storage buckets should exist
-- Query 10: uuid-ossp and pg_trgm extensions should be installed
--
-- ============================================================================


-- ============================================================================
-- AFTER VERIFICATION: Configure your platform
-- ============================================================================
-- 
-- INSERT INTO platform_config (platform_id, platform_name, billing_model, supports_teams, features, limits)
-- VALUES (
--     'yeaa',                    -- Your platform ID
--     'YEAA',                    -- Display name
--     'per_agent',               -- 'all_access', 'per_agent', or 'hybrid'
--     false,                     -- supports_teams
--     '{"newsletter": true, "content_repurposer": true}',  -- enabled features
--     '{"max_agents": 5}'        -- limits
-- );
--
-- ============================================================================
