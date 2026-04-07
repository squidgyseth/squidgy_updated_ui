-- =============================================================================
-- Squidgy Feedback Agent — feedback_submissions
-- Single-file Neon Postgres migration. Paste into Neon SQL editor and run.
-- =============================================================================
-- Target:    Neon Postgres 14+ with pgvector
-- Schema:    public
-- Table:     feedback_submissions (1 table only)
-- Owner:     Squidgy / The Ai Team
--
-- Compatibility audit (Neon-ready):
--   ✓ pgcrypto for gen_random_uuid()              — available on Neon
--   ✓ pgvector for vector(1536)                   — available on Neon
--   ✓ jsonb, uuid[], generated columns            — standard Postgres
--   ✓ partial indexes, GIN, ivfflat               — standard Postgres
--   ✗ NO auth.uid() / RLS policies                — Supabase-specific, removed
--   ✗ NO foreign keys to external tables          — profiles lives on Supabase,
--                                                    user_id is plain uuid here
--
-- Application-layer responsibilities (Fiona must handle):
--   • Validate user_id against Supabase profiles before insert
--   • Generate the embedding (call OpenAI / chosen model) before insert
--   • Recalculate priority_score on related rows when similar_count changes
--   • Set admin_notified = true when priority_score >= 8
--
-- Aligned to:
--   • system_prompt.md (Canonical Scoring Rules)
--   • feedback_collection_workflow.md
--   • feedback_classification.md
--   • similarity_detection_and_priority_scoring.md
-- =============================================================================

BEGIN;

-- 1. Extensions ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "vector";     -- pgvector for semantic search


-- 2. Main table ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_submissions (

  -- Identity
  id                        uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                timestamptz   NOT NULL DEFAULT now(),
  updated_at                timestamptz   NOT NULL DEFAULT now(),

  -- Submitter
  -- user_id is a plain uuid (no FK). The profiles table lives on Supabase,
  -- so Fiona must validate user_id against Supabase auth before insert.
  user_id                   uuid          NOT NULL,
  user_email                text,
  contact_preference        text          NOT NULL DEFAULT 'no'
                                          CHECK (contact_preference IN ('yes', 'critical_only', 'no')),

  -- Classification
  type                      text          NOT NULL
                                          CHECK (type IN ('bug_report', 'feature_request', 'suggestion', 'general_feedback')),
  classification_confidence numeric(3,2)  CHECK (classification_confidence BETWEEN 0.00 AND 1.00),
  classification_method     text          CHECK (classification_method IN ('auto_keyword', 'auto_context', 'user_selected', 'user_corrected')),

  -- Content
  content                   text          NOT NULL CHECK (char_length(content) >= 20),
  summary                   text,
  category                  text          CHECK (category IN ('agent_behaviour', 'ui_ux', 'integrations', 'billing', 'onboarding', 'performance', 'other')),
  feature_area              text,         -- granular: missy, social_planner, kb_sync, ghl_integration, etc.

  -- Severity & priority
  severity                  text          CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  base_score                smallint      NOT NULL CHECK (base_score BETWEEN 1 AND 10),
  impact_score              smallint      NOT NULL DEFAULT 0 CHECK (impact_score BETWEEN 0 AND 7),
  priority_score            smallint      NOT NULL CHECK (priority_score BETWEEN 1 AND 10),

  -- Similarity tracking (1536 = OpenAI text-embedding-3-small; change if using a different model)
  embedding                 vector(1536),
  similar_feedback_ids      uuid[]        NOT NULL DEFAULT '{}',
  similar_count             integer       NOT NULL DEFAULT 0 CHECK (similar_count >= 0),
  duplicate_of              uuid          REFERENCES public.feedback_submissions(id) ON DELETE SET NULL,

  -- Attachments (Supabase Storage public bucket URLs)
  -- Format: [{"url": "...", "description": "...", "filename": "...", "mime_type": "image/png", "size_bytes": 12345}, ...]
  attachments               jsonb         NOT NULL DEFAULT '[]'::jsonb
                                          CHECK (jsonb_typeof(attachments) = 'array'),
  attachment_count          smallint      GENERATED ALWAYS AS (jsonb_array_length(attachments)) STORED,

  -- Lifecycle
  status                    text          NOT NULL DEFAULT 'new'
                                          CHECK (status IN ('new', 'triaged', 'in_progress', 'resolved', 'wont_fix', 'duplicate')),
  assigned_to               text,
  linked_issue_url          text,
  resolved_at               timestamptz,
  resolution_notes          text,

  -- Admin notification (n8n webhook routing)
  admin_notified            boolean       NOT NULL DEFAULT false,
  admin_notified_at         timestamptz,
  n8n_workflow_triggered    text,
  n8n_triggered_at          timestamptz,

  -- Catch-all: keywords_detected, user_agent, page_url, search_error, app_version, etc.
  metadata                  jsonb         NOT NULL DEFAULT '{}'::jsonb
);


-- 3. Indexes ------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_feedback_priority_created
  ON public.feedback_submissions (priority_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_status_open
  ON public.feedback_submissions (status)
  WHERE status IN ('new', 'triaged');

CREATE INDEX IF NOT EXISTS idx_feedback_critical
  ON public.feedback_submissions (priority_score)
  WHERE priority_score >= 8;

CREATE INDEX IF NOT EXISTS idx_feedback_type        ON public.feedback_submissions (type);
CREATE INDEX IF NOT EXISTS idx_feedback_user        ON public.feedback_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category    ON public.feedback_submissions (category);
CREATE INDEX IF NOT EXISTS idx_feedback_feature     ON public.feedback_submissions (feature_area);

CREATE INDEX IF NOT EXISTS idx_feedback_embedding
  ON public.feedback_submissions
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_feedback_similar_ids ON public.feedback_submissions USING GIN (similar_feedback_ids);
CREATE INDEX IF NOT EXISTS idx_feedback_metadata    ON public.feedback_submissions USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_feedback_attachments ON public.feedback_submissions USING GIN (attachments);

CREATE INDEX IF NOT EXISTS idx_feedback_has_attachments
  ON public.feedback_submissions (created_at DESC)
  WHERE attachment_count > 0;


-- 4. Triggers -----------------------------------------------------------------

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.feedback_submissions_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_updated_at ON public.feedback_submissions;
CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.feedback_submissions_set_updated_at();

-- Auto-stamp admin_notified_at when admin_notified flips to true
CREATE OR REPLACE FUNCTION public.feedback_submissions_stamp_admin_notified()
RETURNS trigger AS $$
BEGIN
  IF NEW.admin_notified = true AND (OLD.admin_notified IS DISTINCT FROM true) THEN
    NEW.admin_notified_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_admin_notified ON public.feedback_submissions;
CREATE TRIGGER trg_feedback_admin_notified
  BEFORE UPDATE ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.feedback_submissions_stamp_admin_notified();

-- Auto-stamp resolved_at when status flips to 'resolved'
CREATE OR REPLACE FUNCTION public.feedback_submissions_stamp_resolved()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS DISTINCT FROM 'resolved') THEN
    NEW.resolved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_resolved ON public.feedback_submissions;
CREATE TRIGGER trg_feedback_resolved
  BEFORE UPDATE ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.feedback_submissions_stamp_resolved();


-- 5. Vector similarity function -----------------------------------------------
-- Callable from n8n via Postgres function call:
--   SELECT * FROM search_feedback($1::vector, 0.75, 5);
--
-- Output columns are prefixed with `out_` to avoid ambiguity with the
-- underlying table columns (some Postgres versions are strict about this).

CREATE OR REPLACE FUNCTION public.search_feedback(
  query_embedding  vector(1536),
  match_threshold  float DEFAULT 0.75,
  match_count      int   DEFAULT 5
)
RETURNS TABLE (
  out_id                uuid,
  out_content           text,
  out_type              text,
  out_priority_score    smallint,
  out_base_score        smallint,
  out_impact_score      smallint,
  out_similar_count     integer,
  out_similarity_score  float,
  out_created_at        timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT
    f.id,
    f.content,
    f.type,
    f.priority_score,
    f.base_score,
    f.impact_score,
    f.similar_count,
    (1 - (f.embedding <=> query_embedding))::float AS similarity_score,
    f.created_at
  FROM public.feedback_submissions f
  WHERE f.embedding IS NOT NULL
    AND (1 - (f.embedding <=> query_embedding)) >= match_threshold
    AND f.status NOT IN ('duplicate', 'wont_fix')
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
$$;


-- 6. Access control (Neon) ----------------------------------------------------
-- Neon uses standard Postgres role-based access (no Supabase RLS / auth.uid).
-- The database owner has full access by default. If you want least-privilege
-- access for n8n, create a dedicated role:
--
--   CREATE ROLE feedback_writer LOGIN PASSWORD 'change-me';
--   GRANT USAGE ON SCHEMA public TO feedback_writer;
--   GRANT INSERT, SELECT, UPDATE ON public.feedback_submissions TO feedback_writer;
--   GRANT EXECUTE ON FUNCTION public.search_feedback TO feedback_writer;
--
-- For now this script grants nothing extra — the Neon project owner has full access.


-- 7. Column comments ----------------------------------------------------------
COMMENT ON TABLE  public.feedback_submissions IS 'User feedback on the Squidgy platform — collected by Feedback Fiona. Lives on Neon.';

COMMENT ON COLUMN public.feedback_submissions.id                        IS 'Primary key. Auto-generated uuid.';
COMMENT ON COLUMN public.feedback_submissions.user_id                   IS 'Plain uuid, no FK. Maps to profiles.user_id on Supabase. Validation is the application layer responsibility (Fiona must check the session before insert).';
COMMENT ON COLUMN public.feedback_submissions.base_score                IS 'Score from severity (or type fallback) before impact and frequency multipliers. Never recalculated.';
COMMENT ON COLUMN public.feedback_submissions.impact_score              IS 'Sum of impact multipliers (user reach, workflow blocking, security, data risk). Never recalculated.';
COMMENT ON COLUMN public.feedback_submissions.priority_score            IS 'Final priority = min(max(base + impact + frequency, 1), 10). Recalculated when similar_count changes.';
COMMENT ON COLUMN public.feedback_submissions.classification_confidence IS 'Decimal 0.00-1.00. Below 0.75 means Fiona asked the user to confirm the type.';
COMMENT ON COLUMN public.feedback_submissions.embedding                 IS 'pgvector embedding of content for semantic similarity search at threshold 0.75. Generated by Fiona before insert.';
COMMENT ON COLUMN public.feedback_submissions.duplicate_of              IS 'Set when similarity to an existing record is >= 0.90 (near-duplicate). Self-FK to feedback_submissions.id.';
COMMENT ON COLUMN public.feedback_submissions.similar_feedback_ids      IS 'All feedback rows with similarity >= 0.75 to this one. Bidirectionally maintained.';
COMMENT ON COLUMN public.feedback_submissions.attachments               IS 'JSONB array of file attachments. Each item: {url, description, filename, mime_type, size_bytes}. URLs point to the Supabase Storage public bucket (cross-database, stored as plain text).';
COMMENT ON COLUMN public.feedback_submissions.attachment_count          IS 'Auto-computed count of items in attachments array. Useful for filtering feedback that includes screenshots.';
COMMENT ON COLUMN public.feedback_submissions.admin_notified            IS 'True when priority_score >= 8. Triggers n8n alert workflow.';
COMMENT ON COLUMN public.feedback_submissions.metadata                  IS 'JSON catch-all: keywords_detected, user_agent, page_url, search_error, app_version, etc.';

COMMIT;
