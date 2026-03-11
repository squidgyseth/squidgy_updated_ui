-- Quick verification of Phase 2 migration results

-- Show migration summary
SELECT 
    'MIGRATION SUMMARY' as check_type,
    COUNT(*) as total_records_created
FROM content_repurposer_images;

-- Show breakdown by platform
SELECT 
    'PLATFORM BREAKDOWN' as check_type,
    platform,
    COUNT(*) as record_count,
    COUNT(DISTINCT history_content_repurposer_id) as unique_history_records
FROM content_repurposer_images
GROUP BY platform
ORDER BY platform;

-- Show records by user
SELECT 
    'USER BREAKDOWN' as check_type,
    user_id,
    COUNT(*) as total_posts,
    COUNT(DISTINCT platform) as platforms_used
FROM content_repurposer_images
GROUP BY user_id;

-- Check in_use status
SELECT 
    'IN_USE STATUS' as check_type,
    in_use,
    COUNT(*) as count
FROM content_repurposer_images
GROUP BY in_use;