-- ============================================
-- Anonymous Game Scores Table
-- Stores game scores for users before they register
-- Can be linked to a user account after registration
-- ============================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.anonymous_game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  duration_seconds INTEGER,
  obstacles_dodged JSONB,
  clusters_completed INTEGER DEFAULT 0,
  cluster_bonuses INTEGER DEFAULT 0,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  linked_user_id UUID NULL,
  linked_at TIMESTAMP WITH TIME ZONE NULL,

  CONSTRAINT fk_linked_user
    FOREIGN KEY (linked_user_id)
    REFERENCES profiles(user_id) ON DELETE SET NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_anon_scores_anonymous_id
  ON anonymous_game_scores(anonymous_id);

CREATE INDEX IF NOT EXISTS idx_anon_scores_linked_user
  ON anonymous_game_scores(linked_user_id);

CREATE INDEX IF NOT EXISTS idx_anon_scores_played_at
  ON anonymous_game_scores(played_at DESC);

CREATE INDEX IF NOT EXISTS idx_anon_scores_score
  ON anonymous_game_scores(score DESC);

-- ============================================
-- Function to link anonymous scores to a user
-- Called when a user registers or logs in
-- ============================================
CREATE OR REPLACE FUNCTION link_anonymous_scores(
  p_anonymous_id VARCHAR,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE anonymous_game_scores
  SET
    linked_user_id = p_user_id,
    linked_at = NOW()
  WHERE
    anonymous_id = p_anonymous_id
    AND linked_user_id IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function to get leaderboard (top scores)
-- ============================================
CREATE OR REPLACE FUNCTION get_game_leaderboard(
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  rank BIGINT,
  anonymous_id VARCHAR,
  user_id UUID,
  user_name TEXT,
  score INTEGER,
  played_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY ags.score DESC) as rank,
    ags.anonymous_id,
    ags.linked_user_id as user_id,
    COALESCE(p.full_name, 'Anonymous Player') as user_name,
    ags.score,
    ags.played_at
  FROM anonymous_game_scores ags
  LEFT JOIN profiles p ON p.user_id = ags.linked_user_id
  ORDER BY ags.score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function to get a player's best score
-- ============================================
CREATE OR REPLACE FUNCTION get_player_best_score(
  p_anonymous_id VARCHAR DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  best_score INTEGER;
BEGIN
  SELECT MAX(score) INTO best_score
  FROM anonymous_game_scores
  WHERE
    (p_anonymous_id IS NOT NULL AND anonymous_id = p_anonymous_id)
    OR (p_user_id IS NOT NULL AND linked_user_id = p_user_id);

  RETURN COALESCE(best_score, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Verify the table was created
-- ============================================
SELECT
  'anonymous_game_scores' as table_name,
  COUNT(*) as row_count
FROM anonymous_game_scores;
