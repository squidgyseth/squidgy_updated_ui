-- ============================================================================
-- Multi-Topic Newsletter Database Schema (UPDATED v2)
-- ============================================================================
-- GENERIC system - topics are GLOBAL (shared by all users)
-- Combined view joins topics with client KB for single N8N query
-- ============================================================================

-- ============================================================================
-- Drop existing objects
-- ============================================================================
DROP VIEW IF EXISTS vw_newsletter_topics_for_llm CASCADE;
DROP VIEW IF EXISTS vw_newsletter_multi_topic_llm CASCADE;
DROP TABLE IF EXISTS newsletter_topic_questions CASCADE;
DROP TABLE IF EXISTS newsletter_topics CASCADE;

-- ============================================================================
-- Table: newsletter_topics
-- user_id = NULL means GLOBAL (available to all users)
-- ============================================================================
CREATE TABLE newsletter_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL,
    topic_code VARCHAR(50) NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    topic_description TEXT,
    emoji VARCHAR(10) DEFAULT '📧',
    display_order INT DEFAULT 0,
    is_hero_eligible BOOLEAN DEFAULT true,
    min_words INT DEFAULT 100,
    max_words INT DEFAULT 400,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_newsletter_topics_user_id ON newsletter_topics(user_id);
CREATE INDEX idx_newsletter_topics_global ON newsletter_topics(user_id) WHERE user_id IS NULL;

-- ============================================================================
-- Table: newsletter_topic_questions
-- ============================================================================
CREATE TABLE newsletter_topic_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES newsletter_topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_hint TEXT,
    question_order INT DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    question_type VARCHAR(20) DEFAULT 'text',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_newsletter_questions_topic ON newsletter_topic_questions(topic_id);
CREATE INDEX idx_newsletter_questions_order ON newsletter_topic_questions(topic_id, question_order);

-- ============================================================================
-- INSERT GLOBAL TOPICS (user_id = NULL)
-- ============================================================================

INSERT INTO newsletter_topics (user_id, topic_code, topic_name, emoji, display_order, is_hero_eligible, topic_description) VALUES
(NULL, 'industry_insights', 'Industry Insights', '📊', 1, true, 'Share trends, analysis, and expert perspectives on your industry'),
(NULL, 'customer_stories', 'Customer Stories / Case Studies', '🏆', 2, true, 'Highlight customer success stories and testimonials'),
(NULL, 'education', 'Education / How-To Tips', '📚', 3, true, 'Teach your audience something valuable with actionable tips'),
(NULL, 'curated_resources', 'Curated Resources / Tools', '🔗', 4, false, 'Share useful articles, tools, and resources'),
(NULL, 'promotions', 'Promotions & Offers', '🎁', 5, false, 'Announce special deals, discounts, or limited-time offers'),
(NULL, 'events', 'Events & Announcements', '📅', 6, true, 'Promote upcoming events, webinars, or company news'),
(NULL, 'behind_scenes', 'Behind The Scenes', '🎬', 7, true, 'Share company culture, team stories, and authentic moments');

-- ============================================================================
-- INSERT QUESTIONS FOR EACH TOPIC
-- ============================================================================

-- Questions for: Industry Insights
INSERT INTO newsletter_topic_questions (topic_id, question_text, question_hint, question_order)
SELECT id, q.question_text, q.hint, q.ord
FROM newsletter_topics
CROSS JOIN (VALUES
    ('What industry are you operating in?', 'SaaS, Healthcare, Finance, E-commerce', 1),
    ('Who is the target audience — beginners, professionals, executives, businesses?', 'CTOs, Marketing managers, Small business owners', 2),
    ('What trends or changes are currently happening in your industry?', 'AI adoption, remote work, sustainability', 3),
    ('What perspective or expert opinion do you have on these developments?', NULL, 4),
    ('What takeaway should the reader walk away with?', NULL, 5)
) AS q(question_text, hint, ord)
WHERE topic_code = 'industry_insights' AND user_id IS NULL;

-- Questions for: Customer Stories
INSERT INTO newsletter_topic_questions (topic_id, question_text, question_hint, question_order)
SELECT id, q.question_text, q.hint, q.ord
FROM newsletter_topics
CROSS JOIN (VALUES
    ('Who is the customer or client you want to highlight?', 'Company name or type of customer', 1),
    ('What problem were they facing before using your product/service?', NULL, 2),
    ('How did your solution help them specifically?', NULL, 3),
    ('What measurable results or improvements did they gain?', 'Numbers, percentages, time saved', 4),
    ('Do you have a testimonial or quote from them?', NULL, 5)
) AS q(question_text, hint, ord)
WHERE topic_code = 'customer_stories' AND user_id IS NULL;

-- Questions for: Education / How-To
INSERT INTO newsletter_topic_questions (topic_id, question_text, question_hint, question_order)
SELECT id, q.question_text, q.hint, q.ord
FROM newsletter_topics
CROSS JOIN (VALUES
    ('What problem or pain point does your audience commonly face?', NULL, 1),
    ('What is the specific tip, methodology, or technique you want to teach?', NULL, 2),
    ('Can you provide step-by-step instructions or a quick actionable framework?', NULL, 3),
    ('Do you want to include examples, tools, or templates?', NULL, 4),
    ('What is the benefit for the reader if they apply this tip?', NULL, 5)
) AS q(question_text, hint, ord)
WHERE topic_code = 'education' AND user_id IS NULL;

-- Questions for: Curated Resources
INSERT INTO newsletter_topic_questions (topic_id, question_text, question_hint, question_order)
SELECT id, q.question_text, q.hint, q.ord
FROM newsletter_topics
CROSS JOIN (VALUES
    ('What type of resources do your audience value?', 'Articles, tools, apps, videos, podcasts', 1),
    ('Do you want to curate content only from your brand or also external sources?', NULL, 2),
    ('Should the tone be professional, casual, or fun?', NULL, 3),
    ('How many links or recommendations do you want to include?', '3, 5, or 10', 4),
    ('Do you want short commentary on each resource or just links?', NULL, 5)
) AS q(question_text, hint, ord)
WHERE topic_code = 'curated_resources' AND user_id IS NULL;

-- Questions for: Promotions
INSERT INTO newsletter_topic_questions (topic_id, question_text, question_hint, question_order)
SELECT id, q.question_text, q.hint, q.ord
FROM newsletter_topics
CROSS JOIN (VALUES
    ('What exactly is the offer, discount, or deal you are giving?', NULL, 1),
    ('Who is the offer for — new customers, existing users, referrals, everyone?', NULL, 2),
    ('What is the validity period or expiration date?', NULL, 3),
    ('Is there a special code, link, or signup process?', NULL, 4),
    ('What urgency or final CTA do you want?', 'Limited seats, last 3 days, only 10 left', 5)
) AS q(question_text, hint, ord)
WHERE topic_code = 'promotions' AND user_id IS NULL;

-- Questions for: Events
INSERT INTO newsletter_topic_questions (topic_id, question_text, question_hint, question_order)
SELECT id, q.question_text, q.hint, q.ord
FROM newsletter_topics
CROSS JOIN (VALUES
    ('What is the event / announcement / update you want to share?', NULL, 1),
    ('Who is invited or affected by it?', NULL, 2),
    ('When and where is it happening?', 'Date, time, location or virtual link', 3),
    ('Is registration required? If yes, how?', NULL, 4),
    ('What is the benefit or reason someone should attend?', NULL, 5)
) AS q(question_text, hint, ord)
WHERE topic_code = 'events' AND user_id IS NULL;

-- Questions for: Behind The Scenes
INSERT INTO newsletter_topic_questions (topic_id, question_text, question_hint, question_order)
SELECT id, q.question_text, q.hint, q.ord
FROM newsletter_topics
CROSS JOIN (VALUES
    ('What story do you want to share about your company/team?', NULL, 1),
    ('Is there a milestone, challenge, or journey you want to highlight?', NULL, 2),
    ('Who is speaking — founder, CTO, marketing lead, etc.?', NULL, 3),
    ('Do you want a personal tone or professional tone?', NULL, 4),
    ('What emotion do you want to evoke?', 'Trust, inspiration, transparency, relatability', 5)
) AS q(question_text, hint, ord)
WHERE topic_code = 'behind_scenes' AND user_id IS NULL;

-- ============================================================================
-- View: vw_newsletter_multi_topic_llm
-- COMBINED VIEW - Joins client KB with global topics
-- Single query returns everything N8N needs
-- ============================================================================
CREATE OR REPLACE VIEW vw_newsletter_multi_topic_llm AS
WITH global_topics AS (
    SELECT
        nt.id AS topic_id,
        nt.topic_code,
        nt.topic_name,
        nt.topic_description,
        nt.emoji,
        nt.display_order,
        nt.is_hero_eligible,
        nt.min_words,
        nt.max_words,
        COALESCE(
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'order', ntq.question_order,
                    'question', ntq.question_text,
                    'hint', ntq.question_hint,
                    'required', ntq.is_required
                ) ORDER BY ntq.question_order
            ) FILTER (WHERE ntq.id IS NOT NULL),
            '[]'::JSONB
        ) AS questions,
        COUNT(ntq.id) AS question_count
    FROM newsletter_topics nt
    LEFT JOIN newsletter_topic_questions ntq
        ON ntq.topic_id = nt.id AND ntq.is_active = true
    WHERE nt.is_active = true
      AND nt.user_id IS NULL
    GROUP BY nt.id, nt.topic_code, nt.topic_name, nt.topic_description,
             nt.emoji, nt.display_order, nt.is_hero_eligible,
             nt.min_words, nt.max_words
),
topics_aggregated AS (
    SELECT
        STRING_AGG(
            display_order || '. $$**' || emoji || ' ' || topic_name || ' - ' || COALESCE(topic_description, '') || '**$$',
            CHR(10) ORDER BY display_order
        ) AS available_topics_display,

        STRING_AGG(
            display_order || '. ' || emoji || ' ' || topic_name,
            CHR(10) ORDER BY display_order
        ) AS available_topics_text,

        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'index', display_order,
                'topic_code', topic_code,
                'topic_name', topic_name,
                'description', topic_description,
                'emoji', emoji,
                'is_hero_eligible', is_hero_eligible,
                'min_words', min_words,
                'max_words', max_words,
                'question_count', question_count,
                'questions', questions
            ) ORDER BY display_order
        ) AS topics_with_questions,

        STRING_AGG(
            '### ' || display_order || '. ' || emoji || ' ' || topic_name || ' (code: ' || topic_code || ')' || CHR(10) ||
            (
                SELECT STRING_AGG(
                    '   Q' || (q->>'order')::int || ': ' || (q->>'question') ||
                    CASE WHEN q->>'hint' IS NOT NULL AND q->>'hint' != 'null'
                         THEN ' (e.g., ' || (q->>'hint') || ')'
                         ELSE ''
                    END,
                    CHR(10) ORDER BY (q->>'order')::int
                )
                FROM jsonb_array_elements(questions) AS q
            ),
            CHR(10) || CHR(10) ORDER BY display_order
        ) AS topics_questions_formatted,

        JSONB_OBJECT_AGG(
            topic_code, topic_name ORDER BY display_order
        ) AS topic_code_map,

        COUNT(*) AS total_topics
    FROM global_topics
)
SELECT
    -- From client_agent_knowledge_base_view
    kb.user_id,
    kb.session_id,
    kb.knowledge_base,
    kb.chat_history_id,
    kb.agent_id,
    kb.website_id,
    kb.newsletter_questions,
    kb.website_url,
    kb.screenshot_url,
    kb.favicon_url,
    kb.newsletter_id,
    kb.newsletter_content,
    kb.content_repurposer_questions,
    kb.avatar_style,
    kb.communication_tone,
    kb.is_enabled,

    -- From topics_aggregated (global topics)
    t.available_topics_display,
    t.available_topics_text,
    t.topics_with_questions,
    t.topics_questions_formatted,
    t.topic_code_map,
    t.total_topics

FROM client_agent_knowledge_base_view kb
CROSS JOIN topics_aggregated t;

-- ============================================================================
-- USAGE IN N8N:
-- ============================================================================
-- Single query to get everything:
--
-- SELECT * FROM vw_newsletter_multi_topic_llm
-- WHERE user_id = '{{ $json.body.user_id }}'
-- LIMIT 1;
--
-- Returns:
-- - All KB columns (knowledge_base, website_url, favicon_url, communication_tone, etc.)
-- - All topic columns (available_topics_display, topics_questions_formatted, etc.)
-- ============================================================================
