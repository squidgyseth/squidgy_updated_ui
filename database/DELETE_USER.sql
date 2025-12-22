-- ============================================================================
-- DELETE USER FROM ALL TABLES (INCLUDING auth.users)
-- ============================================================================
-- 
-- This script removes a user and all their data from the database.
-- Run this in a transaction to ensure atomicity.
--
-- IMPORTANT: This script also deletes from auth.users which requires
-- service_role access. Run this in Supabase SQL Editor or with admin privileges.
--
-- USAGE:
--   1. Replace 'YOUR_USER_ID_HERE' with the actual user_id (UUID)
--      OR replace 'YOUR_EMAIL_HERE' with the user's email
--   2. Run in a transaction for safety
--
-- ============================================================================

-- Set the user_id to delete (use ONE of these methods)
DO $$
DECLARE
    target_user_id UUID := 'YOUR_USER_ID_HERE';  -- Replace with actual user_id
    -- OR find by email:
    -- target_user_id UUID := (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
    target_profile_id UUID;
    target_company_id UUID;
    target_auth_id UUID;
BEGIN
    -- Get auth.users id (the id in auth.users IS the user_id in profiles)
    SELECT id INTO target_auth_id
    FROM auth.users
    WHERE id = target_user_id OR email = target_user_id::TEXT;

    -- Get profile id and company_id for this user
    SELECT id, company_id INTO target_profile_id, target_company_id
    FROM public.profiles
    WHERE user_id = target_user_id OR id = target_user_id;

    IF target_profile_id IS NULL AND target_auth_id IS NULL THEN
        RAISE NOTICE 'User not found with user_id: %', target_user_id;
        RETURN;
    END IF;

    RAISE NOTICE 'Deleting user: % (profile_id: %, company_id: %, auth_id: %)', target_user_id, target_profile_id, target_company_id, target_auth_id;

    -- ========================================================================
    -- 1. REFERRAL SYSTEM (delete first due to dependencies)
    -- ========================================================================
    DELETE FROM public.referral_achievements WHERE user_id = target_user_id;
    DELETE FROM public.referral_leaderboard WHERE user_id = target_user_id;
    DELETE FROM public.referral_waitlist WHERE user_id = target_user_id;
    DELETE FROM public.referral_shares WHERE user_id = target_user_id;
    DELETE FROM public.user_rewards WHERE user_id = target_user_id;
    DELETE FROM public.referrals WHERE referrer_id = target_user_id OR referee_id = target_user_id;
    DELETE FROM public.user_tier_status WHERE user_id = target_user_id;
    DELETE FROM public.referral_codes WHERE user_id = target_user_id;

    -- ========================================================================
    -- 2. LEADS & LEAD INFORMATION
    -- ========================================================================
    DELETE FROM public.lead_information WHERE user_id = target_user_id;
    DELETE FROM public.leads WHERE user_id = target_user_id;

    -- ========================================================================
    -- 3. BILLING
    -- ========================================================================
    DELETE FROM public.billing_invoices WHERE user_id = target_user_id;
    DELETE FROM public.billing_settings WHERE user_id = target_user_id;

    -- ========================================================================
    -- 4. TEAM MEMBERS
    -- ========================================================================
    DELETE FROM public.team_members WHERE user_id = target_user_id OR sent_user_id = target_user_id;

    -- ========================================================================
    -- 5. API KEYS
    -- ========================================================================
    DELETE FROM public.api_keys WHERE user_id = target_user_id;

    -- ========================================================================
    -- 6. CHAT & CONVERSATIONS (user_id is TEXT in these tables)
    -- ========================================================================
    DELETE FROM public.chat_history WHERE user_id = target_user_id::TEXT;
    DELETE FROM public.agent_conversations WHERE user_id = target_user_id::TEXT;

    -- ========================================================================
    -- 7. CONTENT HISTORY (user_id is TEXT)
    -- ========================================================================
    DELETE FROM public.content_repurposer_images WHERE user_id = target_user_id::TEXT;
    DELETE FROM public.history_content_repurposer WHERE user_id = target_user_id::TEXT;
    DELETE FROM public.history_newsletters WHERE user_id = target_user_id::TEXT;

    -- ========================================================================
    -- 8. DOCUMENTS (user_id is TEXT)
    -- ========================================================================
    DELETE FROM public.newsletter_documents WHERE user_id = target_user_id::TEXT;
    DELETE FROM public.website_documents WHERE user_id = target_user_id::TEXT;

    -- ========================================================================
    -- 9. KNOWLEDGE BASE (firm_user_id is TEXT)
    -- ========================================================================
    DELETE FROM public.firm_users_knowledge_base WHERE firm_user_id = target_user_id::TEXT;

    -- ========================================================================
    -- 10. ASSISTANT CUSTOMIZATION
    -- ========================================================================
    DELETE FROM public.assistant_customization WHERE user_id = target_user_id;
    -- These have ON DELETE CASCADE from profiles, but delete explicitly for safety
    DELETE FROM public.assistant_personalizations WHERE user_id = target_user_id;

    -- ========================================================================
    -- 11. BUSINESS SETTINGS
    -- ========================================================================
    DELETE FROM public.business_settings WHERE user_id = target_user_id;

    -- ========================================================================
    -- 12. SETUP TABLES (firm_user_id)
    -- ========================================================================
    DELETE FROM public.business_details WHERE firm_user_id = target_user_id;
    DELETE FROM public.solar_setup WHERE firm_user_id = target_user_id;
    DELETE FROM public.calendar_setup WHERE firm_user_id = target_user_id;
    DELETE FROM public.notification_preferences WHERE firm_user_id = target_user_id;
    DELETE FROM public.website_analysis WHERE firm_user_id = target_user_id;

    -- ========================================================================
    -- 13. GHL & FACEBOOK INTEGRATIONS
    -- ========================================================================
    DELETE FROM public.facebook_integrations WHERE firm_user_id = target_user_id;
    DELETE FROM public.ghl_subaccounts WHERE firm_user_id = target_user_id;

    -- ========================================================================
    -- 14. ONBOARDING (has ON DELETE CASCADE, but explicit for clarity)
    -- ========================================================================
    DELETE FROM public.onboarding_sessions WHERE user_id = target_user_id;
    DELETE FROM public.onboarding_company_details WHERE user_id = target_user_id;
    DELETE FROM public.user_onboarding WHERE user_id = target_user_id;

    -- ========================================================================
    -- 15. MCP AUDIT LOGS
    -- ========================================================================
    DELETE FROM public.mcp_audit_logs WHERE user_id = target_user_id;

    -- ========================================================================
    -- 16. DELETE PROFILE
    -- ========================================================================
    DELETE FROM public.profiles WHERE user_id = target_user_id;

    -- ========================================================================
    -- 17. FINALLY: DELETE FROM auth.users (CRITICAL!)
    -- ========================================================================
    -- This is required for the user to be able to sign up again with the same email
    IF target_auth_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = target_auth_id;
        RAISE NOTICE 'Deleted from auth.users: %', target_auth_id;
    END IF;

    RAISE NOTICE 'Successfully deleted all data for user: %', target_user_id;

END $$;


-- ============================================================================
-- ALTERNATIVE: Function to delete user (reusable)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    target_profile_id UUID;
    target_company_id UUID;
    target_auth_id UUID;
    deleted_counts JSONB := '{}';
    row_count INTEGER;
BEGIN
    -- Get auth.users id
    SELECT id INTO target_auth_id
    FROM auth.users
    WHERE id = target_user_id;

    -- Get profile info
    SELECT id, company_id INTO target_profile_id, target_company_id
    FROM public.profiles
    WHERE user_id = target_user_id;

    IF target_profile_id IS NULL AND target_auth_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- Referral system
    DELETE FROM public.referral_achievements WHERE user_id = target_user_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := deleted_counts || jsonb_build_object('referral_achievements', row_count);

    DELETE FROM public.referral_leaderboard WHERE user_id = target_user_id;
    DELETE FROM public.referral_waitlist WHERE user_id = target_user_id;
    DELETE FROM public.referral_shares WHERE user_id = target_user_id;
    DELETE FROM public.user_rewards WHERE user_id = target_user_id;
    DELETE FROM public.referrals WHERE referrer_id = target_user_id OR referee_id = target_user_id;
    DELETE FROM public.user_tier_status WHERE user_id = target_user_id;
    DELETE FROM public.referral_codes WHERE user_id = target_user_id;

    -- Leads
    DELETE FROM public.lead_information WHERE user_id = target_user_id;
    DELETE FROM public.leads WHERE user_id = target_user_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := deleted_counts || jsonb_build_object('leads', row_count);

    -- Billing
    DELETE FROM public.billing_invoices WHERE user_id = target_user_id;
    DELETE FROM public.billing_settings WHERE user_id = target_user_id;

    -- Team
    DELETE FROM public.team_members WHERE user_id = target_user_id OR sent_user_id = target_user_id;

    -- API Keys
    DELETE FROM public.api_keys WHERE user_id = target_user_id;

    -- Chat (TEXT user_id)
    DELETE FROM public.chat_history WHERE user_id = target_user_id::TEXT;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := deleted_counts || jsonb_build_object('chat_history', row_count);

    DELETE FROM public.agent_conversations WHERE user_id = target_user_id::TEXT;

    -- Content history (TEXT user_id)
    DELETE FROM public.content_repurposer_images WHERE user_id = target_user_id::TEXT;
    DELETE FROM public.history_content_repurposer WHERE user_id = target_user_id::TEXT;
    DELETE FROM public.history_newsletters WHERE user_id = target_user_id::TEXT;

    -- Documents (TEXT user_id)
    DELETE FROM public.newsletter_documents WHERE user_id = target_user_id::TEXT;
    DELETE FROM public.website_documents WHERE user_id = target_user_id::TEXT;

    -- Knowledge base (TEXT firm_user_id)
    DELETE FROM public.firm_users_knowledge_base WHERE firm_user_id = target_user_id::TEXT;

    -- Assistant customization
    DELETE FROM public.assistant_customization WHERE user_id = target_user_id;
    DELETE FROM public.assistant_personalizations WHERE user_id = target_user_id;

    -- Business settings
    DELETE FROM public.business_settings WHERE user_id = target_user_id;

    -- Setup tables (firm_user_id)
    DELETE FROM public.business_details WHERE firm_user_id = target_user_id;
    DELETE FROM public.solar_setup WHERE firm_user_id = target_user_id;
    DELETE FROM public.calendar_setup WHERE firm_user_id = target_user_id;
    DELETE FROM public.notification_preferences WHERE firm_user_id = target_user_id;
    DELETE FROM public.website_analysis WHERE firm_user_id = target_user_id;

    -- Integrations
    DELETE FROM public.facebook_integrations WHERE firm_user_id = target_user_id;
    DELETE FROM public.ghl_subaccounts WHERE firm_user_id = target_user_id;

    -- Onboarding
    DELETE FROM public.onboarding_sessions WHERE user_id = target_user_id;
    DELETE FROM public.onboarding_company_details WHERE user_id = target_user_id;
    DELETE FROM public.user_onboarding WHERE user_id = target_user_id;

    -- MCP audit
    DELETE FROM public.mcp_audit_logs WHERE user_id = target_user_id;

    -- Profile (last)
    DELETE FROM public.profiles WHERE user_id = target_user_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    deleted_counts := deleted_counts || jsonb_build_object('profiles', row_count);

    -- auth.users (CRITICAL - allows re-signup with same email)
    IF target_auth_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = target_auth_id;
        deleted_counts := deleted_counts || jsonb_build_object('auth_users', 1);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', target_user_id,
        'auth_id', target_auth_id,
        'deleted_counts', deleted_counts
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================
-- 
-- Option 1: Run the DO block above after replacing YOUR_USER_ID_HERE
--
-- Option 2: Use the function:
--   SELECT public.delete_user_completely('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
--
-- Option 3: Wrap in transaction for safety:
--   BEGIN;
--   SELECT public.delete_user_completely('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
--   -- Review results, then:
--   COMMIT;  -- or ROLLBACK; if something went wrong
--
-- ============================================================================


-- ============================================================================
-- QUICK DELETE BY EMAIL (Standalone - run this directly)
-- ============================================================================
-- Replace 'user@example.com' with the actual email address

DO $$
DECLARE
    target_email TEXT := 'user@example.com';  -- Replace with actual email
    target_auth_id UUID;
    target_user_id UUID;
BEGIN
    -- Find user in auth.users
    SELECT id INTO target_auth_id
    FROM auth.users
    WHERE email = target_email;

    IF target_auth_id IS NULL THEN
        RAISE NOTICE 'No user found in auth.users with email: %', target_email;
        RETURN;
    END IF;

    -- Find user_id from profiles (may be different from auth id)
    SELECT user_id INTO target_user_id
    FROM public.profiles
    WHERE email = target_email;

    RAISE NOTICE 'Found user - auth_id: %, user_id: %', target_auth_id, target_user_id;

    -- Delete from all public tables if profile exists
    IF target_user_id IS NOT NULL THEN
        DELETE FROM public.referral_achievements WHERE user_id = target_user_id;
        DELETE FROM public.referral_leaderboard WHERE user_id = target_user_id;
        DELETE FROM public.referral_waitlist WHERE user_id = target_user_id;
        DELETE FROM public.referral_shares WHERE user_id = target_user_id;
        DELETE FROM public.user_rewards WHERE user_id = target_user_id;
        DELETE FROM public.referrals WHERE referrer_id = target_user_id OR referee_id = target_user_id;
        DELETE FROM public.user_tier_status WHERE user_id = target_user_id;
        DELETE FROM public.referral_codes WHERE user_id = target_user_id;
        DELETE FROM public.lead_information WHERE user_id = target_user_id;
        DELETE FROM public.leads WHERE user_id = target_user_id;
        DELETE FROM public.billing_invoices WHERE user_id = target_user_id;
        DELETE FROM public.billing_settings WHERE user_id = target_user_id;
        DELETE FROM public.team_members WHERE user_id = target_user_id OR sent_user_id = target_user_id;
        DELETE FROM public.api_keys WHERE user_id = target_user_id;
        DELETE FROM public.chat_history WHERE user_id = target_user_id::TEXT;
        DELETE FROM public.agent_conversations WHERE user_id = target_user_id::TEXT;
        DELETE FROM public.content_repurposer_images WHERE user_id = target_user_id::TEXT;
        DELETE FROM public.history_content_repurposer WHERE user_id = target_user_id::TEXT;
        DELETE FROM public.history_newsletters WHERE user_id = target_user_id::TEXT;
        DELETE FROM public.newsletter_documents WHERE user_id = target_user_id::TEXT;
        DELETE FROM public.website_documents WHERE user_id = target_user_id::TEXT;
        DELETE FROM public.firm_users_knowledge_base WHERE firm_user_id = target_user_id::TEXT;
        DELETE FROM public.assistant_customization WHERE user_id = target_user_id;
        DELETE FROM public.assistant_personalizations WHERE user_id = target_user_id;
        DELETE FROM public.business_settings WHERE user_id = target_user_id;
        DELETE FROM public.business_details WHERE firm_user_id = target_user_id;
        DELETE FROM public.solar_setup WHERE firm_user_id = target_user_id;
        DELETE FROM public.calendar_setup WHERE firm_user_id = target_user_id;
        DELETE FROM public.notification_preferences WHERE firm_user_id = target_user_id;
        DELETE FROM public.website_analysis WHERE firm_user_id = target_user_id;
        DELETE FROM public.facebook_integrations WHERE firm_user_id = target_user_id;
        DELETE FROM public.ghl_subaccounts WHERE firm_user_id = target_user_id;
        DELETE FROM public.onboarding_sessions WHERE user_id = target_user_id;
        DELETE FROM public.onboarding_company_details WHERE user_id = target_user_id;
        DELETE FROM public.user_onboarding WHERE user_id = target_user_id;
        DELETE FROM public.mcp_audit_logs WHERE user_id = target_user_id;
        DELETE FROM public.profiles WHERE user_id = target_user_id;
        RAISE NOTICE 'Deleted all public table data for user_id: %', target_user_id;
    END IF;

    -- Also delete profile by email (in case user_id was different)
    DELETE FROM public.profiles WHERE email = target_email;

    -- DELETE FROM auth.users (CRITICAL!)
    DELETE FROM auth.users WHERE id = target_auth_id;
    RAISE NOTICE 'Deleted from auth.users: %', target_auth_id;

    RAISE NOTICE 'Successfully deleted user with email: %', target_email;
END $$;
