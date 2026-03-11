-- Phase 2: Data Migration Script for Content Repurposer
-- This script migrates data from history_content_repurposer JSON to individual content_repurposer_images records

-- =====================================================
-- BACKUP CURRENT DATA (SAFETY FIRST!)
-- =====================================================

-- Create backup table of existing content_repurposer_images data
CREATE TABLE IF NOT EXISTS content_repurposer_images_backup AS 
SELECT * FROM content_repurposer_images;

-- Log the backup
SELECT 
    'BACKUP CREATED' as status,
    COUNT(*) as records_backed_up,
    NOW() as backup_time
FROM content_repurposer_images_backup;

-- =====================================================
-- Step 1: Clear existing data to start fresh
-- =====================================================

-- Delete all existing records in content_repurposer_images
-- (We'll repopulate from history_content_repurposer JSON)
DELETE FROM content_repurposer_images;

-- Verify the table is empty
SELECT 'CLEARED EXISTING DATA' as status, COUNT(*) as remaining_records 
FROM content_repurposer_images;

-- =====================================================
-- Step 2: Migration function to parse JSON and create records
-- =====================================================

-- Create a function to extract posts from JSON content
CREATE OR REPLACE FUNCTION migrate_content_repurposer_data()
RETURNS TABLE(
    user_id_out UUID,
    agent_id_out TEXT,
    platform_out TEXT,
    post_id_out TEXT,
    content_out TEXT,
    prompt_out TEXT,
    session_id_out TEXT,
    history_content_repurposer_id_out UUID,
    created_date_out TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    history_record RECORD;
    content_json JSONB;
    linkedin_posts JSONB;
    instagram_posts JSONB;
    tiktok_posts JSONB;
    post_key TEXT;
    post_content JSONB;
BEGIN
    -- Loop through all history_content_repurposer records
    FOR history_record IN 
        SELECT id, user_id, session_id, agent_id, content, created_at
        FROM history_content_repurposer 
        WHERE content IS NOT NULL 
    LOOP
        BEGIN
            -- Parse the JSON content
            content_json := history_record.content::JSONB;
            
            -- Extract LinkedIn posts
            IF content_json ? 'LinkedIn' THEN
                linkedin_posts := content_json->'LinkedIn';
                FOR post_key IN SELECT * FROM jsonb_object_keys(linkedin_posts)
                LOOP
                    post_content := linkedin_posts->post_key;
                    
                    -- Return LinkedIn post record
                    user_id_out := history_record.user_id;
                    agent_id_out := COALESCE(history_record.agent_id, 'content_repurposer');
                    platform_out := 'LinkedIn';
                    post_id_out := history_record.session_id || '_linkedin_' || post_key;
                    content_out := COALESCE(post_content->>'Caption', post_content->>'Script', '');
                    prompt_out := COALESCE(post_content->>'ImagePrompt', '');
                    session_id_out := history_record.session_id;
                    history_content_repurposer_id_out := history_record.id;
                    created_date_out := history_record.created_at;
                    
                    IF content_out != '' THEN
                        RETURN NEXT;
                    END IF;
                END LOOP;
            END IF;
            
            -- Extract Instagram/Facebook posts  
            IF content_json ? 'InstagramFacebook' THEN
                instagram_posts := content_json->'InstagramFacebook';
                FOR post_key IN SELECT * FROM jsonb_object_keys(instagram_posts)
                LOOP
                    post_content := instagram_posts->post_key;
                    
                    -- Return Instagram post record
                    user_id_out := history_record.user_id;
                    agent_id_out := COALESCE(history_record.agent_id, 'content_repurposer');
                    platform_out := 'Instagram/Facebook';
                    post_id_out := history_record.session_id || '_instagram_' || post_key;
                    content_out := COALESCE(post_content->>'Caption', '');
                    prompt_out := COALESCE(post_content->>'ImagePrompt', '');
                    session_id_out := history_record.session_id;
                    history_content_repurposer_id_out := history_record.id;
                    created_date_out := history_record.created_at;
                    
                    IF content_out != '' THEN
                        RETURN NEXT;
                    END IF;
                END LOOP;
            END IF;
            
            -- Extract TikTok/Reels posts
            IF content_json ? 'TikTokReels' THEN
                tiktok_posts := content_json->'TikTokReels';
                FOR post_key IN SELECT * FROM jsonb_object_keys(tiktok_posts)
                LOOP
                    post_content := tiktok_posts->post_key;
                    
                    -- Return TikTok post record
                    user_id_out := history_record.user_id;
                    agent_id_out := COALESCE(history_record.agent_id, 'content_repurposer');
                    platform_out := 'TikTok';
                    post_id_out := history_record.session_id || '_tiktok_' || post_key;
                    content_out := COALESCE(post_content->>'Script', post_content->>'Idea', '');
                    prompt_out := COALESCE(post_content->>'Idea', post_content->>'VideoConcept', '');
                    session_id_out := history_record.session_id;
                    history_content_repurposer_id_out := history_record.id;
                    created_date_out := history_record.created_at;
                    
                    IF content_out != '' THEN
                        RETURN NEXT;
                    END IF;
                END LOOP;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log any JSON parsing errors but continue
            RAISE NOTICE 'Error parsing JSON for record %: %', history_record.id, SQLERRM;
            CONTINUE;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Step 3: Execute the migration
-- =====================================================

-- Insert migrated data into content_repurposer_images
INSERT INTO content_repurposer_images (
    user_id,
    agent_id, 
    platform,
    post_id,
    content,
    prompt,
    session_id,
    history_content_repurposer_id,
    created_date,
    updated_date,
    in_use
)
SELECT 
    user_id_out,
    agent_id_out,
    platform_out,
    post_id_out,
    content_out,
    prompt_out,
    session_id_out,
    history_content_repurposer_id_out,
    created_date_out,
    created_date_out, -- Set updated_date same as created_date initially
    true -- All migrated records are in_use = true
FROM migrate_content_repurposer_data();

-- =====================================================
-- Step 4: Verification and cleanup
-- =====================================================

-- Show migration results
SELECT 
    'MIGRATION COMPLETE' as status,
    COUNT(*) as total_records_created
FROM content_repurposer_images;

-- Show breakdown by platform
SELECT 
    platform,
    COUNT(*) as record_count,
    COUNT(DISTINCT history_content_repurposer_id) as unique_history_records
FROM content_repurposer_images
GROUP BY platform
ORDER BY platform;

-- Show breakdown by user  
SELECT 
    user_id,
    COUNT(*) as total_posts,
    COUNT(DISTINCT platform) as platforms_used,
    COUNT(DISTINCT history_content_repurposer_id) as content_generations
FROM content_repurposer_images
GROUP BY user_id;

-- Verify all records have in_use = true
SELECT 
    'IN_USE VERIFICATION' as check_type,
    COUNT(*) as total_records,
    SUM(CASE WHEN in_use = true THEN 1 ELSE 0 END) as in_use_true,
    SUM(CASE WHEN in_use = false THEN 1 ELSE 0 END) as in_use_false
FROM content_repurposer_images;

-- Check for any potential issues
SELECT 
    'DATA QUALITY CHECK' as check_type,
    COUNT(*) FILTER (WHERE content = '' OR content IS NULL) as empty_content,
    COUNT(*) FILTER (WHERE platform IS NULL) as missing_platform,
    COUNT(*) FILTER (WHERE history_content_repurposer_id IS NULL) as missing_parent_id
FROM content_repurposer_images;

-- Drop the temporary function
DROP FUNCTION IF EXISTS migrate_content_repurposer_data();

-- =====================================================
-- Step 5: Update repurposed_content in history table
-- =====================================================

-- Update the repurposed_content column with the original JSON for consistency
UPDATE history_content_repurposer 
SET repurposed_content = content::JSONB
WHERE content IS NOT NULL 
AND (repurposed_content IS NULL OR repurposed_content::TEXT = '[]');

-- Verify the update
SELECT 
    'REPURPOSED_CONTENT UPDATE' as status,
    COUNT(*) FILTER (WHERE repurposed_content IS NOT NULL) as records_with_repurposed_content,
    COUNT(*) as total_history_records
FROM history_content_repurposer;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================

/*
-- ROLLBACK STEPS (run these if you need to restore the backup):

-- 1. Clear migrated data
DELETE FROM content_repurposer_images;

-- 2. Restore from backup
INSERT INTO content_repurposer_images 
SELECT * FROM content_repurposer_images_backup;

-- 3. Drop backup table
DROP TABLE content_repurposer_images_backup;

-- 4. Clear repurposed_content if needed
UPDATE history_content_repurposer SET repurposed_content = NULL;

*/

-- Keep backup table for safety (you can drop it manually later if all looks good)
SELECT 'BACKUP TABLE PRESERVED: content_repurposer_images_backup' as notice;