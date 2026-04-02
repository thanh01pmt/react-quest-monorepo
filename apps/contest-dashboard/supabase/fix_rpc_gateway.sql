-- ============================================================
-- RPC Gateway + Schema Fix for Public Contest Access
-- Change: fix-rls-public-contest-access
-- ============================================================

-- ── 1. Decouple participants from Supabase Auth ───────────────
-- Drop the FK constraint that forces user_id to reference auth.users.
-- Replace with a plain TEXT column (external_uid) that can store
-- Firebase UIDs, Supabase UIDs, or any string identifier.

-- Step 1a: Add new column (nullable for migration)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS external_uid TEXT;

-- Step 1b: Copy existing user_id values into external_uid
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'user_id') THEN
        EXECUTE 'UPDATE participants SET external_uid = user_id::TEXT WHERE external_uid IS NULL';
    END IF;
END $$;

-- Step 1c: Drop ALL policies that depend on user_id column
--          (must happen before dropping the column)
DROP POLICY IF EXISTS "User Own Participant"            ON participants;
DROP POLICY IF EXISTS "User Own Board Progress"         ON board_participants;
DROP POLICY IF EXISTS "User Own Submissions"            ON submissions;
DROP POLICY IF EXISTS "User Own Drafts"                 ON drafts;
DROP POLICY IF EXISTS "User self-register participant"  ON participants;
DROP POLICY IF EXISTS "User join board"                 ON board_participants;
DROP POLICY IF EXISTS "User update own board status"    ON board_participants;

-- Step 1d: Drop the FK constraint to auth.users, then the column
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    SELECT constraint_name INTO v_constraint
    FROM information_schema.table_constraints
    WHERE table_name = 'participants'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%user_id%';

    IF v_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE participants DROP CONSTRAINT %I', v_constraint);
    END IF;
END $$;

ALTER TABLE participants DROP COLUMN IF EXISTS user_id;

-- Step 1e: Make external_uid NOT NULL now that data is migrated
ALTER TABLE participants ALTER COLUMN external_uid SET NOT NULL;

-- Step 1f: Add uniqueness constraint on (contest_id, external_uid)
--          (mirrors the old UNIQUE(contest_id, user_id))
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'participants'
          AND constraint_type = 'UNIQUE'
          AND constraint_name = 'participants_contest_id_external_uid_key'
    ) THEN
        ALTER TABLE participants ADD CONSTRAINT participants_contest_id_external_uid_key
            UNIQUE (contest_id, external_uid);
    END IF;
END $$;

-- Step 1g: Recreate all policies using external_uid instead of user_id.
-- NOTE: all dependent policies were already dropped in Step 1c above.

-- Admin: Manage all participants
DROP POLICY IF EXISTS "Admin Manage All Participants" ON participants;
CREATE POLICY "Admin Manage All Participants" ON participants FOR ALL USING (
    (auth.role() = 'authenticated'::text) AND 
    (((auth.jwt() -> 'user_metadata'::text) ->> 'username'::text) IS NULL)
);

-- Participants: owner read
CREATE POLICY "User Own Participant" ON participants
    FOR SELECT USING (external_uid = auth.uid()::TEXT);

-- Participants: self-register (authenticated users can insert their own record)
CREATE POLICY "User self-register participant" ON participants
    FOR INSERT WITH CHECK (external_uid = auth.uid()::TEXT);

-- Board participants: owner read
CREATE POLICY "User Own Board Progress" ON board_participants
    FOR SELECT USING (
        participant_id IN (
            SELECT id FROM participants WHERE external_uid = auth.uid()::TEXT
        )
    );

-- Board participants: join (authenticated user can insert their own bp row)
CREATE POLICY "User join board" ON board_participants
    FOR INSERT WITH CHECK (
        participant_id IN (
            SELECT id FROM participants WHERE external_uid = auth.uid()::TEXT
        )
    );

-- Board participants: update own status
CREATE POLICY "User update own board status" ON board_participants
    FOR UPDATE USING (
        participant_id IN (
            SELECT id FROM participants WHERE external_uid = auth.uid()::TEXT
        )
    );

-- Submissions: owner all
CREATE POLICY "User Own Submissions" ON submissions
    FOR ALL USING (
        board_participant_id IN (
            SELECT bp.id FROM board_participants bp
            JOIN participants p ON p.id = bp.participant_id
            WHERE p.external_uid = auth.uid()::TEXT
        )
    );

-- Drafts: owner all
CREATE POLICY "User Own Drafts" ON drafts
    FOR ALL USING (
        board_participant_id IN (
            SELECT bp.id FROM board_participants bp
            JOIN participants p ON p.id = bp.participant_id
            WHERE p.external_uid = auth.uid()::TEXT
        )
    );


-- ── 2. RPC: get_contest_session ───────────────────────────────
-- Returns full session data for a board_participant ID.
-- Callable by anon role without direct table access.

DROP FUNCTION IF EXISTS get_contest_session(UUID);
CREATE OR REPLACE FUNCTION get_contest_session(p_bp_id UUID)
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
        )
    )
    INTO v_result
    FROM board_participants bp
    JOIN exam_boards eb ON bp.board_id = eb.id
    JOIN exams e ON eb.exam_id = e.id
    WHERE bp.id = p_bp_id;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_contest_session(UUID) TO anon;


-- ── 3. RPC: submit_contest_solution ──────────────────────────
-- Inserts a submission row. Validates that the board_participant
-- exists before inserting (prevents orphaned inserts).

DROP FUNCTION IF EXISTS submit_contest_solution(UUID, UUID, TEXT, TEXT, TEXT, JSONB, INT, INT);
CREATE OR REPLACE FUNCTION submit_contest_solution(
    p_board_participant_id UUID,
    p_exam_id              UUID,
    p_quest_id             TEXT,
    p_code                 TEXT,
    p_language             TEXT,
    p_test_results         JSONB,
    p_score                INT,
    p_attempt              INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_id UUID;
BEGIN
    -- Validate that the board_participant exists to prevent orphaned inserts
    IF NOT EXISTS (SELECT 1 FROM board_participants WHERE id = p_board_participant_id) THEN
        RAISE EXCEPTION 'board_participant % not found', p_board_participant_id;
    END IF;

    INSERT INTO submissions (
        board_participant_id,
        exam_id,
        quest_id,
        code,
        language,
        test_results,
        score,
        attempt,
        submitted_at
    ) VALUES (
        p_board_participant_id,
        p_exam_id,
        p_quest_id,
        p_code,
        p_language,
        p_test_results,
        p_score,
        p_attempt,
        NOW()
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_contest_solution(UUID, UUID, TEXT, TEXT, TEXT, JSONB, INT, INT) TO anon;


-- ── 4. RPC: update_participant_status_rpc ────────────────────
-- Updates the status of a specific board_participant.
-- Scoped strictly to the provided UUID.

DROP FUNCTION IF EXISTS update_participant_status_rpc(UUID, TEXT);
CREATE OR REPLACE FUNCTION update_participant_status_rpc(
    p_bp_id   UUID,
    p_status  TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE board_participants
    SET status = p_status::participant_status
    WHERE id = p_bp_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_participant_status_rpc(UUID, TEXT) TO anon;
