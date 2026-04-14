-- Phase 1: Database Schema Updates for Content Repurposer Migration
-- This script adds the necessary columns for the new data sync strategy

-- =====================================================
-- Step 1: Add in_use column to content_repurposer_images
-- =====================================================

-- Add the in_use column with default value true for existing records
ALTER TABLE content_repurposer_images 
ADD COLUMN IF NOT EXISTS in_use BOOLEAN NOT NULL DEFAULT true;

-- Add comment to document the column purpose
COMMENT ON COLUMN content_repurposer_images.in_use IS 'Soft delete flag - false means post is deleted/hidden but data preserved';

-- =====================================================
-- Step 2: Verify repurposed_content column exists in history table
-- =====================================================

-- Check if repurposed_content column exists (it should already exist based on your schema)
-- This is just for verification - no action needed if it already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'history_content_repurposer' 
        AND column_name = 'repurposed_content'
    ) THEN
        -- Add the column if it doesn't exist (unlikely based on your current data)
        ALTER TABLE history_content_repurposer 
        ADD COLUMN repurposed_content JSONB;
        
        RAISE NOTICE 'Added repurposed_content column to history_content_repurposer table';
    ELSE
        RAISE NOTICE 'repurposed_content column already exists in history_content_repurposer table';
    END IF;
END
$$;

-- =====================================================
-- Step 3: Create indexes for better query performance
-- =====================================================

-- Index on in_use column for fast filtering
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_in_use 
ON content_repurposer_images(in_use);

-- Index on user_id + in_use for user-specific queries
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_user_in_use 
ON content_repurposer_images(user_id, in_use);

-- Index on history_content_repurposer_id + in_use for grouping queries
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_history_in_use 
ON content_repurposer_images(history_content_repurposer_id, in_use);

-- =====================================================
-- Step 4: Update existing records to set in_use = true
-- =====================================================

-- Set all existing records to in_use = true (they're all currently active)
UPDATE content_repurposer_images 
SET in_use = true 
WHERE in_use IS NULL;

-- =====================================================
-- Step 5: Add constraints and defaults
-- =====================================================

-- Ensure in_use column cannot be null going forward
ALTER TABLE content_repurposer_images 
ALTER COLUMN in_use SET NOT NULL;

-- Set default value for new records
ALTER TABLE content_repurposer_images 
ALTER COLUMN in_use SET DEFAULT true;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check the schema changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'content_repurposer_images' 
AND column_name IN ('in_use', 'history_content_repurposer_id', 'created_date')
ORDER BY ordinal_position;

-- Check existing data counts
SELECT 
    'Total records' as metric,
    COUNT(*) as count
FROM content_repurposer_images
UNION ALL
SELECT 
    'Records with in_use = true' as metric,
    COUNT(*) as count
FROM content_repurposer_images 
WHERE in_use = true
UNION ALL
SELECT 
    'Records with in_use = false' as metric,
    COUNT(*) as count
FROM content_repurposer_images 
WHERE in_use = false;

-- Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'content_repurposer_images' 
AND indexname LIKE '%in_use%';

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================

/*
-- ROLLBACK INSTRUCTIONS (run these if you need to undo changes):

-- Remove the indexes
DROP INDEX IF EXISTS idx_content_repurposer_images_in_use;
DROP INDEX IF EXISTS idx_content_repurposer_images_user_in_use; 
DROP INDEX IF EXISTS idx_content_repurposer_images_history_in_use;

-- Remove the column
ALTER TABLE content_repurposer_images DROP COLUMN IF EXISTS in_use;

*/