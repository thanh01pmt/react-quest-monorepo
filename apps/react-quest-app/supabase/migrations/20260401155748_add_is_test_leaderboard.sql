-- ============================================================
-- Add is_test flag to filter testing submissions out of Leaderboard
-- Change: filter-test-submissions
-- ============================================================

-- ── 1. Update Schema ───────────────────────────────────────
ALTER TABLE board_participants ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- ── 2. Re-create Leaderboard Views ──────────────────────────
-- Drop existing views first if they don't match exactly
DROP VIEW IF EXISTS contest_leaderboard;
DROP VIEW IF EXISTS round_leaderboard;
DROP VIEW IF EXISTS board_leaderboard;

-- Board Level
CREATE OR REPLACE VIEW board_leaderboard AS
SELECT
  bp.id AS board_participant_id,
  bp.board_id,
  p.display_name,
  p.username,
  bp.status::TEXT as status,
  COALESCE(agg.total_score, 0) AS total_score,
  COALESCE(agg.challenges_solved, 0) AS challenges_solved,
  agg.last_submission
FROM board_participants bp
JOIN participants p ON bp.participant_id = p.id
LEFT JOIN (
  SELECT
    board_participant_id,
    SUM(best_score)::INT AS total_score,
    COUNT(*) FILTER (WHERE best_score >= 100) AS challenges_solved,
    MAX(submitted_at) AS last_submission
  FROM (
    SELECT
      board_participant_id,
      quest_id,
      MAX(score) AS best_score,
      MAX(submitted_at) AS submitted_at
    FROM submissions
    GROUP BY board_participant_id, quest_id
  ) per_quest
  GROUP BY board_participant_id
) agg ON agg.board_participant_id = bp.id
WHERE bp.is_test IS NOT TRUE;

-- Round Level
CREATE OR REPLACE VIEW round_leaderboard AS
SELECT
  bl.*,
  eb.round_id,
  eb.name AS board_name
FROM board_leaderboard bl
JOIN exam_boards eb ON bl.board_id = eb.id;

-- Contest Level (Cumulative across all rounds)
CREATE OR REPLACE VIEW contest_leaderboard AS
SELECT
  p.id AS participant_id,
  p.contest_id,
  p.display_name,
  p.username,
  SUM(bl.total_score)::INT AS total_score,
  SUM(bl.challenges_solved)::INT AS challenges_solved,
  MAX(bl.last_submission) AS last_submission
FROM participants p
JOIN board_participants bp ON bp.participant_id = p.id
JOIN board_leaderboard bl ON bl.board_participant_id = bp.id
GROUP BY p.id, p.contest_id;

-- ── 3. Update resolve_participant_session RPC ─────────────
CREATE OR REPLACE FUNCTION resolve_participant_session(p_contest_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'id',              bp.id,
        'board_id',        bp.board_id,
        'participant_id',  bp.participant_id,
        'status',          bp.status,
        'deadline',        bp.deadline,
        'started_at',      bp.started_at,
        'submitted_at',    bp.submitted_at,
        'score',           bp.score,
        'is_test',         bp.is_test,
        'board_start_time', COALESCE(
                                (eb.timing_override->>'start_time')::TIMESTAMPTZ, 
                                (r.timing->>'start_time')::TIMESTAMPTZ
                            ),
        'board_end_time',   COALESCE(
                                (eb.timing_override->>'end_time')::TIMESTAMPTZ, 
                                (r.timing->>'end_time')::TIMESTAMPTZ
                            ),
        'duration_minutes', COALESCE(
                                (eb.timing_override->>'duration_minutes')::INT, 
                                (r.timing->>'duration_minutes')::INT
                            ),
        'exam_boards',     json_build_object(
            'id',              eb.id,
            'name',            eb.name,
            'round_id',        eb.round_id,
            'exam_id',         eb.exam_id,
            'timing_override', eb.timing_override,
            'exams',           json_build_object(
                'id',         e.id,
                'title',      e.title,
                'round_id',   e.round_id,
                'quest_data', e.quest_data
            )
        ),
        'participant',     json_build_object(
            'username',    p.username,
            'display_name', p.display_name
        )
    )
    INTO v_result
    FROM board_participants bp
    JOIN participants p ON p.id = bp.participant_id
    JOIN exam_boards eb ON bp.board_id = eb.id
    JOIN rounds r ON eb.round_id = r.id
    JOIN exams e ON eb.exam_id = e.id
    -- Link the contest table to check draft status
    JOIN contests c ON p.contest_id = c.id
    WHERE p.contest_id = p_contest_id
      AND p.external_uid = auth.uid()::TEXT
      -- Bypass 'draft' restrictions if is_test = TRUE
      AND (bp.is_test = TRUE OR (c.status != 'draft' AND r.status != 'draft'))
    ORDER BY bp.started_at DESC NULLS LAST, r.order_index DESC
    LIMIT 1;

    RETURN v_result;

END;
$$;

GRANT EXECUTE ON FUNCTION resolve_participant_session(TEXT) TO anon, authenticated;
