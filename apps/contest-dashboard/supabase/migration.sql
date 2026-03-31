-- ============================================================
-- Contest Dashboard — Multi-Round Architecture (Phase 2)
-- ============================================================

-- ── Enums ──────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE contest_status AS ENUM ('draft', 'scheduled', 'lobby', 'active', 'ended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE participant_status AS ENUM ('active', 'submitted', 'timed_out', 'disqualified');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE promotion_mode AS ENUM ('manual', 'auto');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE timing_mode AS ENUM ('synchronized', 'per_board');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── 1. Contests (Top Level) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS contests (
  id TEXT PRIMARY KEY,
  short_code TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status contest_status NOT NULL DEFAULT 'draft',
  settings JSONB NOT NULL DEFAULT '{
    "scoringMode": "highest",
    "allowLanguages": ["javascript", "python"],
    "showHiddenTestCases": false
  }',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Rounds (Phases within a contest) ──────────────────────

CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  title TEXT NOT NULL, -- e.g. "Vòng sơ loại", "Bán kết"
  status contest_status NOT NULL DEFAULT 'draft',
  timing JSONB NOT NULL DEFAULT '{
    "timingMode": "synchronized",
    "duration_minutes": 120,
    "start_time": null,
    "end_time": null
  }',
  promotion_config JSONB NOT NULL DEFAULT '{
    "mode": "manual",
    "autoRule": null
  }',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Exams (Question papers for a round) ───────────────────

CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g. "Đề thi A", "Đề thi B"
  quest_data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Exam Boards (Regional clusters / groups) ─────────────

CREATE TABLE IF NOT EXISTS exam_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL, -- Board uses this exam
  name TEXT NOT NULL, -- e.g. "Cụm Hà Nội", "Cụm TP.HCM"
  timing_override JSONB DEFAULT NULL, -- Null if uses round timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Participants (Global enrollment) ──────────────────────

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

-- ── 6. Board Participants (Round/Board specific status) ──────

CREATE TABLE IF NOT EXISTS board_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES exam_boards(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  status participant_status NOT NULL DEFAULT 'active',
  deadline TIMESTAMPTZ, -- Calculated based on start + duration (flexible)
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score INT DEFAULT 0,
  UNIQUE(board_id, participant_id)
);

-- ── 7. Submissions & Drafts ──────────────────────────────────

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_participant_id UUID NOT NULL REFERENCES board_participants(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'javascript',
  test_results JSONB NOT NULL DEFAULT '[]',
  score INT NOT NULL DEFAULT 0,
  attempt INT NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drafts (
  board_participant_id UUID NOT NULL REFERENCES board_participants(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'javascript',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (board_participant_id, quest_id)
);

-- ── 8. Granular Progress ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS contest_progress (
  board_participant_id UUID PRIMARY KEY REFERENCES board_participants(id) ON DELETE CASCADE,
  completed_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────

CREATE INDEX idx_contests_short ON contests(short_code);
CREATE INDEX idx_rounds_contest ON rounds(contest_id);
CREATE INDEX idx_exams_round ON exams(round_id);
CREATE INDEX idx_boards_round ON exam_boards(round_id);
CREATE INDEX idx_sub_bp ON submissions(board_participant_id);
CREATE INDEX idx_bp_board ON board_participants(board_id);
CREATE INDEX idx_bp_participant ON board_participants(participant_id);

-- ── Functions ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_short_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto set short_code
CREATE OR REPLACE FUNCTION set_contest_short_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_code IS NULL THEN
    NEW.short_code := generate_short_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_short_code
  BEFORE INSERT ON contests
  FOR EACH ROW EXECUTE FUNCTION set_contest_short_code();

-- Management Functions
CREATE OR REPLACE FUNCTION start_round(p_round_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE rounds SET status = 'active'
  WHERE id = p_round_id AND status IN ('scheduled', 'lobby');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION end_round(p_round_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE rounds SET status = 'ended'
  WHERE id = p_round_id AND status = 'active';
  
  -- Auto-submit all active participants in this round
  UPDATE board_participants
  SET status = 'submitted'
  WHERE board_id IN (SELECT id FROM exam_boards WHERE round_id = p_round_id)
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Leaderboard VIEWs ────────────────────────────────────────

-- 1. Board Level
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
) agg ON agg.board_participant_id = bp.id;

-- 2. Round Level
CREATE OR REPLACE VIEW round_leaderboard AS
SELECT
  bl.*,
  eb.round_id,
  eb.name AS board_name
FROM board_leaderboard bl
JOIN exam_boards eb ON bl.board_id = eb.id;

-- 3. Contest Level (Cumulative across all rounds)
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

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_progress ENABLE ROW LEVEL SECURITY;

-- Select policies for everyone (visible stuff)
CREATE POLICY "Public Read Contests" ON contests FOR SELECT USING (status != 'draft');
CREATE POLICY "Public Read Rounds" ON rounds FOR SELECT USING (status != 'draft');
CREATE POLICY "Public Read Exams" ON exams FOR SELECT USING (TRUE);
CREATE POLICY "Public Read Boards" ON exam_boards FOR SELECT USING (TRUE);

-- Admin policies (Authenticated users can manage their own contests)
CREATE POLICY "Admin Manage Contests" ON contests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Manage Rounds" ON rounds FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Manage Exams" ON exams FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Manage Boards" ON exam_boards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Manage All Participants" ON participants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Manage Board Participants" ON board_participants FOR ALL USING (auth.role() = 'authenticated');

-- Participant policies
CREATE POLICY "User Own Participant" ON participants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User Own Board Progress" ON board_participants FOR SELECT USING (participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid()));
CREATE POLICY "User Own Submissions" ON submissions FOR ALL USING (board_participant_id IN (SELECT id FROM board_participants WHERE participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())));
CREATE POLICY "User Own Drafts" ON drafts FOR ALL USING (board_participant_id IN (SELECT id FROM board_participants WHERE participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())));

-- ── Realtime ─────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE board_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE contest_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE exam_boards;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
