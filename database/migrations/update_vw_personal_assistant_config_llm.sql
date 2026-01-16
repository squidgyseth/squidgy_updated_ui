-- Update the view to check if user has ACTUALLY completed one-time config
-- Instead of just checking if they have any enabled assistant

CREATE OR REPLACE VIEW public.vw_personal_assistant_config_llm AS
WITH user_onboarding_status AS (
    SELECT
        p_1.user_id,
        -- Check if user has actually set the one-time config values
        CASE
            WHEN p_1.target_audience IS NOT NULL
             AND p_1.primary_goals IS NOT NULL
            THEN true
            ELSE false
        END AS has_completed_onboarding
    FROM profiles p_1
)
SELECT
    'personal_assistant'::text AS agent,
    p.user_id,
    pac.config_type,
    CASE
        WHEN pac.config_type::text = 'business_types'::text THEN
            string_agg(
                DISTINCT (('- '::text || pac.code::text) || ': '::text) || pac.display_name::text,
                chr(10)
                ORDER BY ((('- '::text || pac.code::text) || ': '::text) || pac.display_name::text)
            )
        WHEN pac.config_type::text = 'assistants'::text THEN
            string_agg(
                CASE
                    WHEN pac.code::text <> 'personal_assistant'::text THEN
                        (((('$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) || ' - '::text) || pac.description || '**$'::text
                    ELSE NULL::text
                END,
                chr(10)
                ORDER BY pac.display_name
            )
        WHEN pac.config_type::text = ANY (ARRAY['brand_voices'::character varying::text, 'target_audiences'::character varying::text]) THEN
            string_agg(
                DISTINCT ((((('$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) || ' - '::text) || pac.description) || '**$'::text,
                chr(10)
                ORDER BY (((((('$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) || ' - '::text) || pac.description) || '**$'::text)
            )
        WHEN pac.config_type::text = 'primary_goals'::text THEN
            string_agg(
                DISTINCT (((('$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) ||
                    CASE WHEN pac.description IS NOT NULL THEN ' - '::text || pac.description ELSE ''::text END) || '**$'::text,
                chr(10)
                ORDER BY ((((('$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) ||
                    CASE WHEN pac.description IS NOT NULL THEN ' - '::text || pac.description ELSE ''::text END) || '**$'::text)
            )
        WHEN pac.config_type::text = ANY (ARRAY['calendar_types'::character varying::text, 'notification_options'::character varying::text]) THEN
            string_agg(
                DISTINCT ((('$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) || '**$'::text,
                chr(10)
                ORDER BY (((('$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) || '**$'::text)
            )
        ELSE NULL::text
    END AS llm_input_string,
    CASE
        WHEN pac.config_type::text = 'assistants'::text THEN
            string_agg(
                CASE
                    WHEN (ap2.is_enabled = false OR ap2.assistant_id IS NULL) AND pac.code::text <> 'personal_assistant'::text THEN
                        (((('$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) || ' - '::text) || pac.description || '**$'::text
                    ELSE NULL::text
                END,
                chr(10)
                ORDER BY pac.id
            )
        ELSE NULL::text
    END AS values_not_enabled,
    CASE
        WHEN pac.config_type::text = 'assistants'::text THEN
            string_agg(
                CASE
                    WHEN ap2.is_enabled = true AND pac.code::text <> 'personal_assistant'::text THEN
                        (((('$**'::text || pac.emoji::text) || ' '::text) || pac.display_name::text) || ' - '::text) || pac.description || '**$'::text
                    ELSE NULL::text
                END,
                chr(10)
                ORDER BY pac.id
            )
        ELSE NULL::text
    END AS values_enabled,
    CASE
        WHEN pac.config_type::text = 'assistants'::text THEN
            string_agg(
                CASE
                    WHEN pac.code::text <> 'personal_assistant'::text THEN
                        (((('$**'::text || pac.display_name::text) || '**$ → ID: "'::text) || pac.code::text) || '" | Category: "'::text) || COALESCE(pac.category, 'General'::character varying)::text || '"'::text
                    ELSE NULL::text
                END,
                chr(10)
                ORDER BY pac.display_name
            )
        ELSE NULL::text
    END AS agent_department_value,
    CASE
        WHEN pac.config_type::text = 'assistants'::text THEN
            string_agg(
                DISTINCT (((((((((((((('$**'::text || COALESCE(wa.company_name, 'Company'::text)) || '**$'::text) || chr(10)) || '  - Website: '::text) || wa.website_url::text) || chr(10)) || '  - Description: '::text) || COALESCE(wa.company_description, 'N/A'::text)) || chr(10)) || '  - Value Proposition: '::text) || COALESCE(wa.value_proposition, 'N/A'::text)) || chr(10)) || '  - Business Niche: '::text) || COALESCE(wa.business_niche, 'N/A'::text)) || chr(10) || '  - Tags: '::text || COALESCE(array_to_string(wa.tags, ', '::text), 'N/A'::text),
                chr(10) || chr(10)
            ) FILTER (WHERE wa.id IS NOT NULL)
        ELSE NULL::text
    END AS website_analysis_info,
    CASE
        WHEN pac.config_type::text = ANY (ARRAY['business_types'::text, 'calendar_types'::text, 'notification_options'::text, 'target_audiences'::text, 'primary_goals'::text]) THEN true
        ELSE false
    END AS is_one_time_config,
    -- THIS IS THE KEY FIX: Check if user has actually set target_audience and primary_goals
    CASE
        WHEN pac.config_type::text = ANY (ARRAY['business_types'::text, 'calendar_types'::text, 'notification_options'::text, 'target_audiences'::text, 'primary_goals'::text])
         AND uos.has_completed_onboarding = true
        THEN true
        ELSE false
    END AS skip_for_additional_agents
FROM profiles p
CROSS JOIN personal_assistant_config pac
LEFT JOIN user_onboarding_status uos ON uos.user_id = p.user_id
LEFT JOIN assistant_personalizations ap2 ON pac.code::text = ap2.assistant_id::text AND ap2.user_id = p.user_id AND pac.config_type::text = 'assistants'::text
LEFT JOIN website_analysis wa ON wa.firm_user_id = p.user_id AND pac.config_type::text = 'assistants'::text AND wa.analysis_status::text = 'completed'::text
GROUP BY p.user_id, pac.config_type, uos.has_completed_onboarding;
