-- ============================================================
-- Migration: refactor-judge-schema
-- Description: Add judge metadata and refactor views for performance
-- ============================================================

-- 1. Update Submissions Table
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS worker_log TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS time_ms INT;

-- 2. Add Index for Performance
CREATE INDEX IF NOT EXISTS idx_submissions_bp_id ON public.submissions(board_participant_id);

-- 3. Refactor Leaderboard Views
DROP VIEW IF EXISTS contest_leaderboard;
DROP VIEW IF EXISTS round_leaderboard;
DROP VIEW IF EXISTS board_leaderboard;

-- Board Level (Optimized to use bp.score)
CREATE OR REPLACE VIEW board_leaderboard AS
SELECT
  bp.id AS board_participant_id,
  bp.board_id,
  p.display_name,
  p.username,
  bp.status::TEXT as status,
  COALESCE(bp.score, 0) AS total_score,
  COALESCE(agg.challenges_solved, 0) AS challenges_solved,
  agg.last_submission
FROM board_participants bp
JOIN participants p ON bp.participant_id = p.id
LEFT JOIN (
  -- We still need to count challenges and last submission from the submissions table
  -- but we no longer need the complex MAX(score) sum here
  SELECT
    board_participant_id,
    COUNT(DISTINCT quest_id) FILTER (WHERE score >= 100) AS challenges_solved,
    MAX(submitted_at) AS last_submission
  FROM submissions
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
