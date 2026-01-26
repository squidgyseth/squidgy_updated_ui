-- ============================================================================
-- Personal Assistant Config View - FLATTENED (One Row Per User)
-- ============================================================================
-- Returns ONE row per user with all config values as columns.
-- This simplifies N8N workflow - just get first row and use all fields directly.
--
-- Columns:
--   - assistants: All available assistants (formatted)
--   - enabled_agents: Only enabled assistants
--   - values_not_enabled: Assistants not yet enabled
--   - agent_department_value: Name → ID mapping
--   - website_analysis_info: Company info from website analysis
--   - brand_voices: Brand voice options
--   - target_audiences: Target audience options
--   - primary_goals: Primary goal options
--   - calendar_types: Calendar options
--   - notification_options: Notification options
--   - business_types: Business type options
--   - has_completed_onboarding: Boolean flag
-- ============================================================================

-- Drop dependent views first, then recreate
DROP VIEW IF EXISTS public.vw_user_skip_status CASCADE;
DROP VIEW IF EXISTS public.vw_personal_assistant_config_llm CASCADE;

-- Create the flattened view (one row per user)
CREATE OR REPLACE VIEW public.vw_personal_assistant_config_llm AS
WITH
  user_onboarding_status AS (
    SELECT
      p.user_id,
      CASE
        WHEN p.target_audience IS NOT NULL AND p.primary_goals IS NOT NULL
        THEN true
        ELSE false
      END AS has_completed_onboarding
    FROM profiles p
  ),

  -- Assistants (enabled)
  enabled_assistants AS (
    SELECT
      p.user_id,
      string_agg(
        CASE
          WHEN ap.is_enabled = true AND pac.code != 'personal_assistant'
          THEN '$**' || pac.emoji || ' ' || pac.display_name || ' - ' || pac.description || '**$'
        END,
        chr(10) ORDER BY pac.display_name
      ) AS values_enabled
    FROM profiles p
    CROSS JOIN personal_assistant_config pac
    LEFT JOIN assistant_personalizations ap ON pac.code = ap.assistant_id AND ap.user_id = p.user_id
    WHERE pac.config_type = 'assistants' AND pac.is_enabled = true
    GROUP BY p.user_id
  ),

  -- Assistants (not enabled)
  not_enabled_assistants AS (
    SELECT
      p.user_id,
      string_agg(
        CASE
          WHEN (ap.is_enabled = false OR ap.assistant_id IS NULL) AND pac.code != 'personal_assistant'
          THEN '$**' || pac.emoji || ' ' || pac.display_name || ' - ' || pac.description || '**$'
        END,
        chr(10) ORDER BY pac.display_name
      ) AS values_not_enabled
    FROM profiles p
    CROSS JOIN personal_assistant_config pac
    LEFT JOIN assistant_personalizations ap ON pac.code = ap.assistant_id AND ap.user_id = p.user_id
    WHERE pac.config_type = 'assistants' AND pac.is_enabled = true
    GROUP BY p.user_id
  ),

  -- All assistants (for llm_input_string)
  all_assistants AS (
    SELECT
      p.user_id,
      string_agg(
        CASE
          WHEN pac.code != 'personal_assistant'
          THEN '$**' || pac.emoji || ' ' || pac.display_name || ' - ' || pac.description || '**$'
        END,
        chr(10) ORDER BY pac.display_name
      ) AS assistants,
      string_agg(
        CASE
          WHEN pac.code != 'personal_assistant'
          THEN '$**' || pac.display_name || '**$ → ID: "' || pac.code || '" | Category: "' || COALESCE(pac.category, 'General') || '"'
        END,
        chr(10) ORDER BY pac.display_name
      ) AS agent_department_value
    FROM profiles p
    CROSS JOIN personal_assistant_config pac
    WHERE pac.config_type = 'assistants' AND pac.is_enabled = true
    GROUP BY p.user_id
  ),

  -- Website analysis
  website_info AS (
    SELECT
      firm_user_id AS user_id,
      '$**' || COALESCE(company_name, 'Company') || '**$' || chr(10) ||
      '  - Website: ' || website_url || chr(10) ||
      '  - Description: ' || COALESCE(company_description, 'N/A') || chr(10) ||
      '  - Value Proposition: ' || COALESCE(value_proposition, 'N/A') || chr(10) ||
      '  - Business Niche: ' || COALESCE(business_niche, 'N/A') || chr(10) ||
      '  - Tags: ' || COALESCE(array_to_string(tags, ', '), 'N/A') AS website_analysis_info
    FROM website_analysis
    WHERE analysis_status = 'completed'
  ),

  -- Brand voices
  brand_voices AS (
    SELECT
      p.user_id,
      string_agg(
        DISTINCT '$**' || pac.emoji || ' ' || pac.display_name || ' - ' || pac.description || '**$',
        chr(10)
      ) AS brand_voices
    FROM profiles p
    CROSS JOIN personal_assistant_config pac
    WHERE pac.config_type = 'brand_voices'
    GROUP BY p.user_id
  ),

  -- Target audiences
  target_audiences AS (
    SELECT
      p.user_id,
      string_agg(
        DISTINCT '$**' || pac.emoji || ' ' || pac.display_name || ' - ' || pac.description || '**$',
        chr(10)
      ) AS target_audiences
    FROM profiles p
    CROSS JOIN personal_assistant_config pac
    WHERE pac.config_type = 'target_audiences'
    GROUP BY p.user_id
  ),

  -- Primary goals
  primary_goals AS (
    SELECT
      p.user_id,
      string_agg(
        DISTINCT '$**' || pac.emoji || ' ' || pac.display_name ||
        CASE WHEN pac.description IS NOT NULL THEN ' - ' || pac.description ELSE '' END || '**$',
        chr(10)
      ) AS primary_goals
    FROM profiles p
    CROSS JOIN personal_assistant_config pac
    WHERE pac.config_type = 'primary_goals'
    GROUP BY p.user_id
  ),

  -- Calendar types
  calendar_types AS (
    SELECT
      p.user_id,
      string_agg(
        DISTINCT '$**' || pac.emoji || ' ' || pac.display_name || '**$',
        chr(10)
      ) AS calendar_types
    FROM profiles p
    CROSS JOIN personal_assistant_config pac
    WHERE pac.config_type = 'calendar_types'
    GROUP BY p.user_id
  ),

  -- Notification options
  notification_options AS (
    SELECT
      p.user_id,
      string_agg(
        DISTINCT '$**' || pac.emoji || ' ' || pac.display_name || '**$',
        chr(10)
      ) AS notification_options
    FROM profiles p
    CROSS JOIN personal_assistant_config pac
    WHERE pac.config_type = 'notification_options'
    GROUP BY p.user_id
  ),

  -- Business types
  business_types AS (
    SELECT
      p.user_id,
      string_agg(
        DISTINCT '- ' || pac.code || ': ' || pac.display_name,
        chr(10)
      ) AS business_types
    FROM profiles p
    CROSS JOIN personal_assistant_config pac
    WHERE pac.config_type = 'business_types'
    GROUP BY p.user_id
  )

-- Final SELECT: One row per user with all config as columns
SELECT
  'personal_assistant'::text AS agent,
  p.user_id,
  -- Assistants
  aa.assistants,
  ea.values_enabled AS enabled_agents,
  nea.values_not_enabled,
  aa.agent_department_value,
  wi.website_analysis_info,
  -- Onboarding options
  bv.brand_voices,
  ta.target_audiences,
  pg.primary_goals,
  ct.calendar_types,
  no.notification_options,
  bt.business_types,
  -- Flags
  COALESCE(uos.has_completed_onboarding, false) AS has_completed_onboarding
FROM profiles p
LEFT JOIN user_onboarding_status uos ON uos.user_id = p.user_id
LEFT JOIN enabled_assistants ea ON ea.user_id = p.user_id
LEFT JOIN not_enabled_assistants nea ON nea.user_id = p.user_id
LEFT JOIN all_assistants aa ON aa.user_id = p.user_id
LEFT JOIN website_info wi ON wi.user_id = p.user_id
LEFT JOIN brand_voices bv ON bv.user_id = p.user_id
LEFT JOIN target_audiences ta ON ta.user_id = p.user_id
LEFT JOIN primary_goals pg ON pg.user_id = p.user_id
LEFT JOIN calendar_types ct ON ct.user_id = p.user_id
LEFT JOIN notification_options no ON no.user_id = p.user_id
LEFT JOIN business_types bt ON bt.user_id = p.user_id;

-- Recreate the dependent view vw_user_skip_status (simplified)
CREATE OR REPLACE VIEW public.vw_user_skip_status AS
SELECT
  user_id,
  has_completed_onboarding,
  CASE
    WHEN has_completed_onboarding THEN 'One-time configs: SKIP'
    ELSE 'One-time configs: ASK'
  END AS skip_status
FROM vw_personal_assistant_config_llm;
