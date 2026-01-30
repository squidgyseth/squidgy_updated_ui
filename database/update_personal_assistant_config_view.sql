-- Updated Personal Assistant Config View with $$**TEXT**$$ button format
-- Matches frontend parser: /\$\$([^$]+)\$\$/g in InteractiveMessageButtons.tsx
-- CTE-based structure for per-user flattened output (one row per user)

DROP VIEW IF EXISTS public.vw_personal_assistant_config_llm;

CREATE OR REPLACE VIEW public.vw_personal_assistant_config_llm AS
WITH
  user_onboarding_status AS (
    SELECT
      p_1.user_id,
      CASE
        WHEN p_1.target_audience IS NOT NULL
        AND p_1.primary_goals IS NOT NULL THEN true
        ELSE false
      END AS has_completed_onboarding
    FROM
      profiles p_1
  ),
  enabled_assistants AS (
    SELECT
      p_1.user_id,
      string_agg(
        CASE
          WHEN ap.is_enabled = true
          AND pac.code::text <> 'personal_assistant'::text THEN (
            (
              (
                (('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text
              ) || ' - '::text
            ) || pac.description
          ) || '**$$'::text
          ELSE NULL::text
        END,
        chr(10)
        ORDER BY
          pac.display_name
      ) AS values_enabled
    FROM
      profiles p_1
      CROSS JOIN personal_assistant_config pac
      LEFT JOIN assistant_personalizations ap ON pac.code::text = ap.assistant_id::text
      AND ap.user_id = p_1.user_id
    WHERE
      pac.config_type::text = 'assistants'::text
      AND pac.is_enabled = true
    GROUP BY
      p_1.user_id
  ),
  not_enabled_assistants AS (
    SELECT
      p_1.user_id,
      string_agg(
        CASE
          WHEN (
            ap.is_enabled = false
            OR ap.assistant_id IS NULL
          )
          AND pac.code::text <> 'personal_assistant'::text THEN (
            (
              (
                (('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text
              ) || ' - '::text
            ) || pac.description
          ) || '**$$'::text
          ELSE NULL::text
        END,
        chr(10)
        ORDER BY
          pac.display_name
      ) AS values_not_enabled
    FROM
      profiles p_1
      CROSS JOIN personal_assistant_config pac
      LEFT JOIN assistant_personalizations ap ON pac.code::text = ap.assistant_id::text
      AND ap.user_id = p_1.user_id
    WHERE
      pac.config_type::text = 'assistants'::text
      AND pac.is_enabled = true
    GROUP BY
      p_1.user_id
  ),
  all_assistants AS (
    SELECT
      p_1.user_id,
      string_agg(
        CASE
          WHEN pac.code::text <> 'personal_assistant'::text THEN (
            (
              (
                (('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text
              ) || ' - '::text
            ) || pac.description
          ) || '**$$'::text
          ELSE NULL::text
        END,
        chr(10)
        ORDER BY
          pac.display_name
      ) AS assistants,
      string_agg(
        CASE
          WHEN pac.code::text <> 'personal_assistant'::text THEN (
            (
              (
                (
                  ('$$**'::text || pac.display_name::text) || '**$$ → ID: "'::text
                ) || pac.code::text
              ) || '" | Category: "'::text
            ) || COALESCE(pac.category, 'General'::character varying)::text
          ) || '"'::text
          ELSE NULL::text
        END,
        chr(10)
        ORDER BY
          pac.display_name
      ) AS agent_department_value
    FROM
      profiles p_1
      CROSS JOIN personal_assistant_config pac
    WHERE
      pac.config_type::text = 'assistants'::text
      AND pac.is_enabled = true
    GROUP BY
      p_1.user_id
  ),
  website_info AS (
    SELECT
      website_analysis.firm_user_id AS user_id,
      (
        (
          (
            (
              (
                (
                  (
                    (
                      (
                        (
                          (
                            (
                              (
                                (
                                  (
                                    (
                                      '$$**'::text || COALESCE(website_analysis.company_name, 'Company'::text)
                                    ) || '**$$'::text
                                  ) || chr(10)
                                ) || '  - Website: '::text
                              ) || website_analysis.website_url::text
                            ) || chr(10)
                          ) || '  - Description: '::text
                        ) || COALESCE(website_analysis.company_description, 'N/A'::text)
                      ) || chr(10)
                    ) || '  - Value Proposition: '::text
                  ) || COALESCE(website_analysis.value_proposition, 'N/A'::text)
                ) || chr(10)
              ) || '  - Business Niche: '::text
            ) || COALESCE(website_analysis.business_niche, 'N/A'::text)
          ) || chr(10)
        ) || '  - Tags: '::text
      ) || COALESCE(
        array_to_string(website_analysis.tags, ', '::text),
        'N/A'::text
      ) AS website_analysis_info
    FROM
      website_analysis
    WHERE
      website_analysis.analysis_status::text = 'completed'::text
  ),
  brand_voices AS (
    SELECT
      p_1.user_id,
      string_agg(
        DISTINCT (
          (
            (
              (('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text
            ) || ' - '::text
          ) || pac.description
        ) || '**$$'::text,
        chr(10)
      ) AS brand_voices
    FROM
      profiles p_1
      CROSS JOIN personal_assistant_config pac
    WHERE
      pac.config_type::text = 'brand_voices'::text
    GROUP BY
      p_1.user_id
  ),
  target_audiences AS (
    SELECT
      p_1.user_id,
      string_agg(
        DISTINCT (
          (
            (
              (('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text
            ) || ' - '::text
          ) || pac.description
        ) || '**$$'::text,
        chr(10)
      ) AS target_audiences
    FROM
      profiles p_1
      CROSS JOIN personal_assistant_config pac
    WHERE
      pac.config_type::text = 'target_audiences'::text
    GROUP BY
      p_1.user_id
  ),
  primary_goals AS (
    SELECT
      p_1.user_id,
      string_agg(
        DISTINCT (
          (
            (('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text
          ) || CASE
            WHEN pac.description IS NOT NULL THEN ' - '::text || pac.description
            ELSE ''::text
          END
        ) || '**$$'::text,
        chr(10)
      ) AS primary_goals
    FROM
      profiles p_1
      CROSS JOIN personal_assistant_config pac
    WHERE
      pac.config_type::text = 'primary_goals'::text
    GROUP BY
      p_1.user_id
  ),
  calendar_types AS (
    SELECT
      p_1.user_id,
      string_agg(
        DISTINCT (
          (('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text
        ) || '**$$'::text,
        chr(10)
      ) AS calendar_types
    FROM
      profiles p_1
      CROSS JOIN personal_assistant_config pac
    WHERE
      pac.config_type::text = 'calendar_types'::text
    GROUP BY
      p_1.user_id
  ),
  notification_options AS (
    SELECT
      p_1.user_id,
      string_agg(
        DISTINCT (
          (('$$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text
        ) || '**$$'::text,
        chr(10)
      ) AS notification_options
    FROM
      profiles p_1
      CROSS JOIN personal_assistant_config pac
    WHERE
      pac.config_type::text = 'notification_options'::text
    GROUP BY
      p_1.user_id
  ),
  business_types AS (
    SELECT
      p_1.user_id,
      string_agg(
        DISTINCT (('- '::text || pac.code::text) || ': '::text) || pac.display_name::text,
        chr(10)
      ) AS business_types
    FROM
      profiles p_1
      CROSS JOIN personal_assistant_config pac
    WHERE
      pac.config_type::text = 'business_types'::text
    GROUP BY
      p_1.user_id
  )
SELECT
  'personal_assistant'::text AS agent,
  p.user_id,
  aa.assistants,
  ea.values_enabled AS enabled_agents,
  nea.values_not_enabled,
  aa.agent_department_value,
  wi.website_analysis_info,
  bv.brand_voices,
  ta.target_audiences,
  pg.primary_goals,
  ct.calendar_types,
  no.notification_options,
  bt.business_types,
  COALESCE(uos.has_completed_onboarding, false) AS has_completed_onboarding
FROM
  profiles p
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

-- Dependent view: user skip status (used by SA_Personal_Assistant workflow)
DROP VIEW IF EXISTS public.vw_user_skip_status;

CREATE OR REPLACE VIEW public.vw_user_skip_status AS
SELECT
  user_id,
  has_completed_onboarding,
  CASE
    WHEN has_completed_onboarding THEN 'One-time configs: SKIP'
    ELSE 'One-time configs: ASK'
  END AS skip_status
FROM vw_personal_assistant_config_llm;
