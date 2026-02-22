-- =====================================================
-- BRANDY AGENT - BRANDS TABLE SCHEMA
-- =====================================================
-- This table stores brand foundations created through the Brandy wizard
-- or imported from existing brand documents.
--
-- Each user can have one brand record that stores:
-- - 6 core brand foundation elements (Phase 1)
-- - Optional full brand bible (Phase 2)
-- - Signature phrases extracted over time
--
-- The brand data is used by Brandy in advisor mode to:
-- - Generate on-brand content
-- - Review copy for brand alignment
-- - Answer brand strategy questions
-- =====================================================

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Phase 1: Brand Foundation (6 core elements from wizard)
  atmosphere TEXT,
  -- The overall vibe/feeling people experience
  -- Example: "High-energy rebellious tech conference meets punk rock show"

  rebellious_edge TEXT,
  -- What makes them different and what they won't compromise
  -- Example: "We refuse to use dark patterns, even if it costs us conversions"

  enemy_statement TEXT,
  -- What they stand against (industry BS, not competitors)
  -- Example: "The consulting industry that sells hours instead of outcomes"

  visual_direction TEXT,
  -- Visual vibe description (not exact specs)
  -- Example: "Dark mode brutalist with electric blue accents - terminal from the future"

  hook_style TEXT,
  -- How they grab attention in content
  -- Example: "Provocative questions that challenge industry assumptions, backed by data"

  voice_messaging TEXT,
  -- How they sound (authentic voice)
  -- Example: "Direct, no-BS, occasional profanity, zero corporate speak"

  -- Additional brand elements
  signature_phrases TEXT[],
  -- Array of key phrases they use frequently
  -- Example: ["no corporate BS", "real talk", "punk branding"]
  -- Populated over time as advisor mode extracts patterns

  -- Phase 2: Full Brand Bible (optional deep dive)
  full_brand_bible JSONB,
  -- Complete brand bible with:
  -- - Expanded foundation with examples
  -- - Voice guidelines (dos/don'ts, phrase bank)
  -- - Content templates
  -- - Visual mood board descriptions
  -- - Messaging hierarchy
  -- Schema: {
  --   "foundation": {...},
  --   "voice_guidelines": {...},
  --   "content_templates": {...},
  --   "visual_references": {...},
  --   "messaging_hierarchy": {...}
  -- }

  -- Import metadata
  import_source TEXT,
  -- How the brand was created: "wizard" | "import_pdf" | "import_docx" | "import_url" | "import_text"

  import_metadata JSONB,
  -- Additional data about import process
  -- For wizard: {"wizard_version": "1.0", "completion_date": "..."}
  -- For import: {"original_file": "brand_guidelines.pdf", "parse_date": "..."}

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one brand per user
  UNIQUE(user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Fast lookups by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);

-- Search within signature phrases
CREATE INDEX IF NOT EXISTS idx_brands_signature_phrases ON brands USING GIN(signature_phrases);

-- Search within full brand bible JSON
CREATE INDEX IF NOT EXISTS idx_brands_full_bible ON brands USING GIN(full_brand_bible);

-- Track when brands were last updated
CREATE INDEX IF NOT EXISTS idx_brands_updated_at ON brands(updated_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Users can only see their own brand
CREATE POLICY "Users can view own brand"
  ON brands
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own brand
CREATE POLICY "Users can insert own brand"
  ON brands
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own brand
CREATE POLICY "Users can update own brand"
  ON brands
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own brand
CREATE POLICY "Users can delete own brand"
  ON brands
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brands_updated_at_trigger
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_brands_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if brand foundation is complete
-- Returns true if all 6 core elements are filled
CREATE OR REPLACE FUNCTION is_brand_foundation_complete(brand_record brands)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    brand_record.atmosphere IS NOT NULL AND brand_record.atmosphere != '' AND
    brand_record.rebellious_edge IS NOT NULL AND brand_record.rebellious_edge != '' AND
    brand_record.enemy_statement IS NOT NULL AND brand_record.enemy_statement != '' AND
    brand_record.visual_direction IS NOT NULL AND brand_record.visual_direction != '' AND
    brand_record.hook_style IS NOT NULL AND brand_record.hook_style != '' AND
    brand_record.voice_messaging IS NOT NULL AND brand_record.voice_messaging != ''
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get brand completion percentage
-- Returns 0-100 based on how many of 6 elements are filled
CREATE OR REPLACE FUNCTION get_brand_completion_percentage(brand_record brands)
RETURNS INTEGER AS $$
DECLARE
  completed_count INTEGER := 0;
BEGIN
  IF brand_record.atmosphere IS NOT NULL AND brand_record.atmosphere != '' THEN
    completed_count := completed_count + 1;
  END IF;

  IF brand_record.rebellious_edge IS NOT NULL AND brand_record.rebellious_edge != '' THEN
    completed_count := completed_count + 1;
  END IF;

  IF brand_record.enemy_statement IS NOT NULL AND brand_record.enemy_statement != '' THEN
    completed_count := completed_count + 1;
  END IF;

  IF brand_record.visual_direction IS NOT NULL AND brand_record.visual_direction != '' THEN
    completed_count := completed_count + 1;
  END IF;

  IF brand_record.hook_style IS NOT NULL AND brand_record.hook_style != '' THEN
    completed_count := completed_count + 1;
  END IF;

  IF brand_record.voice_messaging IS NOT NULL AND brand_record.voice_messaging != '' THEN
    completed_count := completed_count + 1;
  END IF;

  RETURN (completed_count * 100 / 6);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXAMPLE QUERIES
-- =====================================================

-- Get current user's brand
-- SELECT * FROM brands WHERE user_id = auth.uid();

-- Check if user has complete brand foundation
-- SELECT is_brand_foundation_complete(brands.*) FROM brands WHERE user_id = auth.uid();

-- Get brand completion percentage
-- SELECT get_brand_completion_percentage(brands.*) FROM brands WHERE user_id = auth.uid();

-- Update atmosphere during wizard
-- UPDATE brands
-- SET atmosphere = 'High-energy rebellious tech conference meets punk rock show'
-- WHERE user_id = auth.uid();

-- Add signature phrase
-- UPDATE brands
-- SET signature_phrases = array_append(signature_phrases, 'no corporate BS')
-- WHERE user_id = auth.uid();

-- Save full brand bible after Phase 2
-- UPDATE brands
-- SET full_brand_bible = '{
--   "foundation": {...},
--   "voice_guidelines": {...},
--   "content_templates": {...}
-- }'::jsonb
-- WHERE user_id = auth.uid();

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Insert sample brand (replace user_id with actual test user)
/*
INSERT INTO brands (
  user_id,
  atmosphere,
  rebellious_edge,
  enemy_statement,
  visual_direction,
  hook_style,
  voice_messaging,
  signature_phrases,
  import_source,
  import_metadata
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with test user ID
  'High-energy rebellious tech conference meets punk rock show',
  'We refuse to use dark patterns or manipulative tactics, even if it costs us conversions',
  'The marketing industry that treats customers like conversion metrics instead of humans',
  'Dark mode brutalist with electric blue accents - like a terminal from the future',
  'Provocative questions that challenge industry assumptions, backed by data',
  'Direct, no-BS, occasional profanity, zero corporate speak - like a smart friend at a bar',
  ARRAY['no corporate BS', 'real talk', 'punk branding', 'anti-brand'],
  'wizard',
  '{"wizard_version": "1.0", "completion_date": "2025-01-15T10:30:00Z"}'::jsonb
);
*/

-- =====================================================
-- MIGRATION NOTES
-- =====================================================

-- To run this schema:
-- 1. Execute in Supabase SQL Editor
-- 2. Verify RLS policies are active
-- 3. Test with sample insert (update user_id)
-- 4. Verify helper functions work
-- 5. Update N8N workflow to use these queries

-- To rollback:
-- DROP TABLE IF EXISTS brands CASCADE;
-- DROP FUNCTION IF EXISTS update_brands_updated_at() CASCADE;
-- DROP FUNCTION IF EXISTS is_brand_foundation_complete(brands) CASCADE;
-- DROP FUNCTION IF EXISTS get_brand_completion_percentage(brands) CASCADE;
