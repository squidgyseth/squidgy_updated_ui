-- ============================================================================
-- Personal Assistant Config View with One-Time Setup Skip Logic
-- ============================================================================
-- This view adds two new columns to support smart step skipping:
-- 1. is_one_time_config: Identifies config types that are one-time setup (not per-agent)
-- 2. skip_for_additional_agents: True if user already completed onboarding, skip this config
--
-- One-Time Configs (skip after first agent):
--   - business_types
--   - target_audiences
--   - primary_goals
--   - calendar_types
--   - notification_options
--
-- Per-Agent Configs (always ask):
--   - brand_voices (each agent can have different tone)
--   - assistants (always show available agents)
-- ============================================================================

-- Drop dependent views first, then recreate
DROP VIEW IF EXISTS public.vw_user_skip_status CASCADE;
DROP VIEW IF EXISTS public.vw_personal_assistant_config_llm CASCADE;

CREATE OR REPLACE VIEW public.vw_personal_assistant_config_llm AS
WITH user_onboarding_status AS (
  -- Check if user has completed initial onboarding (has any enabled assistant)
  SELECT
    p.user_id,
    CASE WHEN COUNT(ap.id) > 0 THEN true ELSE false END AS has_completed_onboarding
  FROM profiles p
  LEFT JOIN assistant_personalizations ap
    ON ap.user_id = p.user_id
    AND ap.is_enabled = true
  GROUP BY p.user_id
)
SELECT DISTINCT
  'personal_assistant'::text AS agent,
  p.user_id,
  pac.config_type,

  -- =========================================================================
  -- llm_input_string: Formatted options for LLM display
  -- NOTE: Excludes 'personal_assistant' from assistants (it's the onboarding agent)
  -- =========================================================================
  CASE
    WHEN pac.config_type::text = 'business_types'::text THEN string_agg(
      DISTINCT (('- '::text || pac.code::text) || ': '::text) || pac.display_name::text,
      chr(10)
      ORDER BY (('- '::text || pac.code::text) || ': '::text) || pac.display_name::text
    )
    WHEN pac.config_type::text = 'assistants'::text THEN string_agg(
      CASE WHEN pac.code != 'personal_assistant' THEN
        (('$$**'::text || pac.emoji::text) || ' '::text || pac.display_name::text || ' - '::text || pac.description) || '**$$'::text
      ELSE NULL END,
      chr(10)
      ORDER BY pac.display_name
    )
    WHEN pac.config_type::text = ANY (
      ARRAY['brand_voices'::character varying::text, 'target_audiences'::character varying::text]
    ) THEN string_agg(
      DISTINCT (('$$**'::text || pac.emoji::text) || ' '::text || pac.display_name::text || ' - '::text || pac.description) || '**$$'::text,
      chr(10)
      ORDER BY (('$$**'::text || pac.emoji::text) || ' '::text || pac.display_name::text || ' - '::text || pac.description) || '**$$'::text
    )
    WHEN pac.config_type::text = 'primary_goals'::text THEN string_agg(
      DISTINCT (('$$**'::text || pac.emoji::text) || ' '::text || pac.display_name::text ||
        CASE WHEN pac.description IS NOT NULL THEN ' - '::text || pac.description ELSE ''::text END
      ) || '**$$'::text,
      chr(10)
      ORDER BY (('$$**'::text || pac.emoji::text) || ' '::text || pac.display_name::text ||
        CASE WHEN pac.description IS NOT NULL THEN ' - '::text || pac.description ELSE ''::text END
      ) || '**$$'::text
    )
    WHEN pac.config_type::text = ANY (
      ARRAY['calendar_types'::character varying::text, 'notification_options'::character varying::text]
    ) THEN string_agg(
      DISTINCT ((('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) || '**$$'::text,
      chr(10)
      ORDER BY ((('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) || '**$$'::text
    )
    ELSE NULL::text
  END AS llm_input_string,

  -- =========================================================================
  -- values_not_enabled: Assistants that are NOT enabled for this user
  -- NOTE: Excludes 'personal_assistant' (it's always enabled by default)
  -- =========================================================================
  CASE
    WHEN pac.config_type::text = 'assistants'::text THEN string_agg(
      CASE
        WHEN (ap2.is_enabled = false OR ap2.assistant_id IS NULL)
             AND pac.code != 'personal_assistant' THEN
          ('$$**'::text || pac.emoji::text || ' '::text || pac.display_name::text || ' - '::text || pac.description) || '**$$'::text
        ELSE NULL::text
      END,
      chr(10)
      ORDER BY pac.id
    )
    ELSE NULL::text
  END AS values_not_enabled,

  -- =========================================================================
  -- values_enabled: Assistants that ARE enabled for this user
  -- NOTE: Excludes 'personal_assistant' (it's the onboarding agent itself)
  -- =========================================================================
  CASE
    WHEN pac.config_type::text = 'assistants'::text THEN string_agg(
      CASE
        WHEN ap2.is_enabled = true AND pac.code != 'personal_assistant' THEN
          ('$$**'::text || pac.emoji::text || ' '::text || pac.display_name::text || ' - '::text || pac.description) || '**$$'::text
        ELSE NULL::text
      END,
      chr(10)
      ORDER BY pac.id
    )
    ELSE NULL::text
  END AS values_enabled,

  -- =========================================================================
  -- agent_department_value: Agent ID mapping with categories for LLM
  -- NOTE: Excludes 'personal_assistant' (it's the onboarding agent itself)
  -- =========================================================================
  CASE
    WHEN pac.config_type::text = 'assistants'::text THEN string_agg(
      CASE WHEN pac.code != 'personal_assistant' THEN
        (((('$$**'::text || pac.display_name::text) || '**$$ → ID: "'::text) || pac.code::text) || '" | Category: "'::text || COALESCE(pac.category, 'General'::character varying)::text) || '"'::text
      ELSE NULL END,
      chr(10)
      ORDER BY pac.display_name
    )
    ELSE NULL::text
  END AS agent_department_value,

  -- =========================================================================
  -- website_analysis_info: Company website analysis data
  -- =========================================================================
  CASE
    WHEN pac.config_type::text = 'assistants'::text THEN string_agg(
      DISTINCT (
        '$$**'::text || COALESCE(wa.company_name, 'Company'::text) || '**$$'::text ||
        chr(10) || '  - Website: '::text || wa.website_url::text ||
        chr(10) || '  - Description: '::text || COALESCE(wa.company_description, 'N/A'::text) ||
        chr(10) || '  - Value Proposition: '::text || COALESCE(wa.value_proposition, 'N/A'::text) ||
        chr(10) || '  - Business Niche: '::text || COALESCE(wa.business_niche, 'N/A'::text) ||
        chr(10) || '  - Tags: '::text || COALESCE(array_to_string(wa.tags, ', '::text), 'N/A'::text)
      ),
      chr(10) || chr(10)
    ) FILTER (WHERE wa.id IS NOT NULL)
    ELSE NULL::text
  END AS website_analysis_info,

  -- =========================================================================
  -- NEW COLUMN: is_one_time_config
  -- Identifies if this config type is a one-time setup (not asked per-agent)
  -- =========================================================================
  CASE
    WHEN pac.config_type::text IN (
      'business_types',
      'calendar_types',
      'notification_options',
      'target_audiences',
      'primary_goals'
    ) THEN true
    ELSE false
  END AS is_one_time_config,

  -- =========================================================================
  -- NEW COLUMN: skip_for_additional_agents
  -- True if this is a one-time config AND user has already completed onboarding
  -- Use this to skip questions when adding additional agents
  -- =========================================================================
  CASE
    WHEN pac.config_type::text IN (
      'business_types',
      'calendar_types',
      'notification_options',
      'target_audiences',
      'primary_goals'
    ) AND uos.has_completed_onboarding = true
    THEN true
    ELSE false
  END AS skip_for_additional_agents

FROM
  profiles p
  CROSS JOIN personal_assistant_config pac
  LEFT JOIN user_onboarding_status uos ON uos.user_id = p.user_id
  LEFT JOIN assistant_personalizations ap2 ON pac.code::text = ap2.assistant_id::text
    AND ap2.user_id = p.user_id
    AND pac.config_type::text = 'assistants'::text
  LEFT JOIN website_analysis wa ON wa.firm_user_id = p.user_id
    AND pac.config_type::text = 'assistants'::text
    AND wa.analysis_status::text = 'completed'::text
GROUP BY
  p.user_id,
  pac.config_type,
  uos.has_completed_onboarding;

-- ============================================================================
-- USAGE NOTES:
-- ============================================================================
--
-- Query Example:
-- SELECT * FROM vw_personal_assistant_config_llm WHERE user_id = 'xxx';
--
-- New Columns:
-- - is_one_time_config: true for business_types, calendar_types,
--                       notification_options, target_audiences, primary_goals
-- - skip_for_additional_agents: true if is_one_time_config AND user has
--                               any enabled assistant
--
-- LLM Usage:
-- - Check skip_for_additional_agents = true → Skip this question
-- - Check skip_for_additional_agents = false → Ask this question
-- - brand_voices always has skip_for_additional_agents = false (per-agent)
-- - assistants always has skip_for_additional_agents = false (always show)
--
-- ============================================================================


-- ============================================================================
-- HELPER VIEW: Generate skip_status string for LLM
-- ============================================================================
-- Use this to get a formatted skip_status string for a user
-- This can be passed directly to the LLM as {{ $json.skip_status }}
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_user_skip_status AS
SELECT
  user_id,
  string_agg(
    '- ' || config_type || ': ' ||
    CASE WHEN skip_for_additional_agents THEN 'SKIP' ELSE 'ASK' END,
    chr(10)
    ORDER BY
      CASE config_type
        WHEN 'assistants' THEN 1
        WHEN 'brand_voices' THEN 2
        WHEN 'target_audiences' THEN 3
        WHEN 'primary_goals' THEN 4
        WHEN 'business_types' THEN 5
        WHEN 'calendar_types' THEN 6
        WHEN 'notification_options' THEN 7
        ELSE 8
      END
  ) AS skip_status
FROM vw_personal_assistant_config_llm
GROUP BY user_id;

-- ============================================================================
-- N8N WORKFLOW QUERY EXAMPLE:
-- ============================================================================
--
-- To get all data for a user including skip_status, use:
--
-- SELECT
--   v.*,
--   s.skip_status
-- FROM vw_personal_assistant_config_llm v
-- LEFT JOIN vw_user_skip_status s ON s.user_id = v.user_id
-- WHERE v.user_id = '{{$json.user_id}}';
--
-- Or to get just the skip_status:
--
-- SELECT skip_status
-- FROM vw_user_skip_status
-- WHERE user_id = '{{$json.user_id}}';
--
-- Example skip_status output:
-- - assistants: ASK
-- - brand_voices: ASK
-- - target_audiences: SKIP
-- - primary_goals: SKIP
-- - business_types: SKIP
-- - calendar_types: SKIP
-- - notification_options: SKIP
--
-- ============================================================================
