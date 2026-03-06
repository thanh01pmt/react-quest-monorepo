-- ============================================================
-- Contest Dashboard — Supabase Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 120,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'active', 'ended')),
  quest_data JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'submitted', 'timed_out', 'disqualified')),
  UNIQUE(contest_id, user_id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'javascript',
  test_results JSONB NOT NULL DEFAULT '[]',
  score INT NOT NULL DEFAULT 0,
  attempt INT NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drafts (
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'javascript',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (participant_id, quest_id)
);

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sub_contest ON submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_sub_participant ON submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_sub_quest ON submissions(contest_id, quest_id);
CREATE INDEX IF NOT EXISTS idx_part_contest ON participants(contest_id);

-- ── Leaderboard View ────────────────────────────────────────

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS participant_id,
  p.contest_id,
  p.display_name,
  p.username,
  p.status,
  COALESCE(agg.total_score, 0) AS total_score,
  COALESCE(agg.challenges_solved, 0) AS challenges_solved,
  agg.last_submission
FROM participants p
LEFT JOIN (
  SELECT
    participant_id,
    SUM(best_score)::INT AS total_score,
    COUNT(*) FILTER (WHERE best_score >= 100) AS challenges_solved,
    MAX(last_sub) AS last_submission
  FROM (
    SELECT
      participant_id,
      quest_id,
      MAX(score) AS best_score,
      MAX(submitted_at) AS last_sub
    FROM submissions
    GROUP BY participant_id, quest_id
  ) per_quest
  GROUP BY participant_id
) agg ON agg.participant_id = p.id;

-- ── RLS (Row Level Security) ────────────────────────────────

ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- Contests: anyone can read active/scheduled contests
CREATE POLICY "read_active_contests" ON contests
  FOR SELECT USING (status IN ('active', 'scheduled'));

-- Contests: authenticated users can manage (admin via service_role bypasses)
CREATE POLICY "admin_manage_contests" ON contests
  FOR ALL USING (auth.role() = 'authenticated');

-- Participants: users manage own records
CREATE POLICY "users_own_participation" ON participants
  FOR ALL USING (user_id = auth.uid());

-- Participants: admins can read all (for dashboard)
CREATE POLICY "admin_read_participants" ON participants
  FOR SELECT USING (auth.role() = 'authenticated');

-- Submissions: users insert own
CREATE POLICY "users_insert_submissions" ON submissions
  FOR INSERT WITH CHECK (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- Submissions: users read own
CREATE POLICY "users_read_own_submissions" ON submissions
  FOR SELECT USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- Submissions: admins read all
CREATE POLICY "admin_read_submissions" ON submissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Drafts: users manage own
CREATE POLICY "users_manage_drafts" ON drafts
  FOR ALL USING (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- ── Enable Realtime for submissions (admin dashboard) ───────

ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
