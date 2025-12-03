-- Migration script to populate content_repurposer_images table from history_content_repurposer data

-- First, add unique constraint to prevent duplicate posts
ALTER TABLE content_repurposer_images 
ADD CONSTRAINT IF NOT EXISTS unique_user_post_id 
UNIQUE (user_id, post_id);

-- Create a function to parse JSON content and insert into content_repurposer_images
CREATE OR REPLACE FUNCTION migrate_content_to_images(
  p_user_id TEXT,
  p_agent_id TEXT,
  p_session_id TEXT,
  p_history_id UUID,
  p_content JSONB
) RETURNS VOID AS $$
DECLARE
  platform_key TEXT;
  post_key TEXT;
  post_data JSONB;
  platform_name TEXT;
  post_content TEXT;
  image_prompt TEXT;
  video_concept TEXT;
  script_content TEXT;
  post_id_value TEXT;
BEGIN
  -- Process LinkedIn posts
  IF p_content ? 'LinkedIn' THEN
    FOR post_key IN SELECT jsonb_object_keys(p_content->'LinkedIn')
    LOOP
      post_data := p_content->'LinkedIn'->post_key;
      post_content := COALESCE(post_data->>'Caption', '');
      image_prompt := COALESCE(post_data->>'ImagePrompt', '');
      video_concept := COALESCE(post_data->>'VideoConcept', '');
      script_content := COALESCE(post_data->>'Script', '');
      
      -- Use script as content if it exists (for video posts), otherwise use caption
      IF script_content != '' THEN
        post_content := script_content;
      END IF;
      
      post_id_value := p_session_id || '_linkedin_' || post_key;
      
      INSERT INTO content_repurposer_images (
        user_id, agent_id, platform, post_id, content, prompt, 
        generation_type, session_id, history_content_repurposer_id, in_use
      ) VALUES (
        p_user_id, p_agent_id, 'linkedin', post_id_value, post_content, 
        image_prompt, 'migrated', p_session_id, p_history_id, true
      ) ON CONFLICT (user_id, post_id) DO NOTHING;
    END LOOP;
  END IF;

  -- Process Instagram/Facebook posts
  IF p_content ? 'InstagramFacebook' THEN
    FOR post_key IN SELECT jsonb_object_keys(p_content->'InstagramFacebook')
    LOOP
      post_data := p_content->'InstagramFacebook'->post_key;
      post_content := COALESCE(post_data->>'Caption', '');
      image_prompt := COALESCE(post_data->>'ImagePrompt', '');
      
      post_id_value := p_session_id || '_instagram_' || post_key;
      
      INSERT INTO content_repurposer_images (
        user_id, agent_id, platform, post_id, content, prompt, 
        generation_type, session_id, history_content_repurposer_id, in_use
      ) VALUES (
        p_user_id, p_agent_id, 'instagram', post_id_value, post_content, 
        image_prompt, 'migrated', p_session_id, p_history_id, true
      ) ON CONFLICT (user_id, post_id) DO NOTHING;
    END LOOP;
  END IF;

  -- Process TikTok/Reels posts
  IF p_content ? 'TikTokReels' THEN
    FOR post_key IN SELECT jsonb_object_keys(p_content->'TikTokReels')
    LOOP
      post_data := p_content->'TikTokReels'->post_key;
      post_content := COALESCE(post_data->>'Script', post_data->>'Idea', '');
      image_prompt := ''; -- TikTok usually doesn't have image prompts
      
      post_id_value := p_session_id || '_tiktok_' || post_key;
      
      INSERT INTO content_repurposer_images (
        user_id, agent_id, platform, post_id, content, prompt, 
        generation_type, session_id, history_content_repurposer_id, in_use
      ) VALUES (
        p_user_id, p_agent_id, 'tiktok', post_id_value, post_content, 
        image_prompt, 'migrated', p_session_id, p_history_id, true
      ) ON CONFLICT (user_id, post_id) DO NOTHING;
    END LOOP;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Migrate the specific record you provided
DO $$
DECLARE
  content_json JSONB;
BEGIN
  -- Parse your provided JSON content
  content_json := '{
    "LinkedIn": {
      "Post1": {
        "Caption": "The digital revolution is reshaping global finance. Are you ready to embrace the intelligent automation and AI-powered insights transforming the industry?",
        "ImagePrompt": "A confident team in a modern office reviewing digital dashboards and analytics on their laptop screens."
      },
      "Post2": {
        "Caption": "From navigating complex regulations to aligning your financial strategy with sustainability - our experts are here to guide you through the evolving landscape of international banking.",
        "ImagePrompt": "A senior executive delivering a presentation to a group of colleagues in a stylish UK workspace."
      },
      "Post3": {
        "Caption": "Looking to expand your business globally? Master the intricacies of cross-border liquidity, currency risk, and regulatory compliance with our comprehensive playbook.",
        "ImagePrompt": "An open laptop displaying a finance-related report in warm natural light."
      },
      "Post4": {
        "VideoConcept": "Navigating the New Era of Cross-Border Finance",
        "Script": "The financial services landscape is rapidly transforming, with new digital tools, global regulations, and sustainability demands reshaping the way businesses operate. In our latest guide, our experts unpack the key trends and strategies you need to succeed in this evolving landscape. From intelligent automation to sustainable financing, we will show you how to position your organisation for long-term growth and resilience. Explore the full guide and discover how HSBC can help you navigate the future of international business."
      }
    },
    "InstagramFacebook": {
      "Post1": {
        "Caption": "Proper busy with the latest trends reshaping global finance! 🤖 Intelligent automation, digital banking, and more - our experts have the insights to help your business thrive in this new era. 👀",
        "ImagePrompt": "A team of professionals collaborating on a digital project in a stylish modern office."
      },
      "Post2": {
        "Caption": "Navigating the complex web of financial regulations? Our compliance gurus have got your back. 🧭 Discover the frameworks and tools you need to stay ahead of the curve - no awkward surprises here! 😉",
        "ImagePrompt": "A person reviewing financial documents and digital reports on their laptop in a cosy office setting."
      },
      "Post3": {
        "Caption": "Fancy expanding your business globally? 🌍 Mastering cross-border liquidity, currency risk, and regulatory compliance is key. Our new playbook has all the insights you need to crack on! 🤑",
        "ImagePrompt": "A professional reviewing financial charts and analytics on multiple screens in an open-plan office."
      },
      "Post4": {
        "Caption": "Aligning your financial strategy with sustainability goals? 🌳 We have got a range of green financing solutions and ESG advisory services to help build a more eco-friendly future. Lets do this! 💪",
        "ImagePrompt": "A diverse team celebrating a successful sustainability initiative in their modern office space."
      }
    },
    "TikTokReels": {
      "Video1": {
        "Idea": "The AI-Powered Future of Banking",
        "Script": "Intelligent automation is revolutionising the financial services industry. 🤖 No more tedious paperwork or manual number-crunching - our AI-powered tools are helping clients make smarter, more efficient decisions. Wanna see how it works? Lets take a quick peek behind the scenes! 👀"
      },
      "Video2": {
        "Idea": "Cracking the Code of Global Regulations",
        "Script": "Navigating the complex web of financial regulations? Our compliance experts have you covered. 🧭 From currency controls to sustainability frameworks, we will show you the tips and tricks to stay ahead of the curve. No more awkward surprises - just a smooth, stress-free experience. Lets crack on, shall we? 😉"
      }
    }
  }'::JSONB;

  -- Call the migration function for your specific record
  PERFORM migrate_content_to_images(
    '6e9eaac9-0bb0-4529-a51d-4d6a17fa95b2',
    'content_repurposer',
    'session_1761144134398_6l7do3txb',
    '4c07ee7c-3637-4ddf-bcba-baceaa8bc0f2'::UUID,
    content_json
  );
END $$;

-- ⚠️ NOTE: DO NOT CREATE TRIGGERS! 
-- The application code (contentRepurposerWebhookService.ts) already handles 
-- inserting into content_repurposer_images table when processing webhook responses.
-- Adding triggers would create duplicate records.

-- If you need to manually populate content_repurposer_images from existing 
-- history_content_repurposer records, use the migrate_content_to_images() function above.

-- Create a function to migrate ALL existing content_repurposer records
CREATE OR REPLACE FUNCTION migrate_all_content_repurposer_records()
RETURNS INTEGER AS $$
DECLARE
  record_count INTEGER := 0;
  history_record RECORD;
  content_json JSONB;
BEGIN
  -- Loop through all existing content_repurposer records
  FOR history_record IN 
    SELECT id, user_id, agent_id, session_id, content 
    FROM history_content_repurposer 
    WHERE agent_id = 'content_repurposer'
    ORDER BY created_at DESC
  LOOP
    BEGIN
      -- Parse the content as JSON
      content_json := history_record.content::JSONB;
      
      -- Call our migration function
      PERFORM migrate_content_to_images(
        history_record.user_id,
        history_record.agent_id,
        history_record.session_id,
        history_record.id,
        content_json
      );
      
      record_count := record_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but continue with next record
      RAISE NOTICE 'Failed to migrate record ID %: %', history_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN record_count;
END;
$$ LANGUAGE plpgsql;

-- Uncomment the following line if you want to migrate ALL existing content_repurposer records
-- SELECT migrate_all_content_repurposer_records();

-- Add some helpful comments
COMMENT ON FUNCTION migrate_content_to_images IS 'Parses JSON content from content_repurposer and populates content_repurposer_images table - USE ONLY FOR MANUAL MIGRATION';
COMMENT ON FUNCTION migrate_all_content_repurposer_records IS 'Migrates ALL existing content_repurposer records to content_repurposer_images table - USE ONLY FOR BACKFILL';

-- Summary:
-- 1. contentRepurposerWebhookService.ts already handles inserting new records into content_repurposer_images
-- 2. This migration is only needed for existing/historical data that wasn't processed by the webhook service
-- 3. DO NOT add database triggers as they would create duplicates with the existing application logic