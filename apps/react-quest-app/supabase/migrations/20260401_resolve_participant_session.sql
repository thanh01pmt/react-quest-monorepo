-- ============================================================
-- Resolve Participant Session and Get Public Contest Info
-- Change: update-contest-access
-- ============================================================

-- ── 1. RPC: get_public_contest_info ──────────────────────
-- Returns generic metadata for a contest.
-- Returns NULL if the contest is 'draft'.

CREATE OR REPLACE FUNCTION get_public_contest_info(p_contest_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'status', status
    )
    INTO v_result
    FROM contests
    WHERE id = p_contest_id AND status != 'draft';
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_contest_info(TEXT) TO anon, authenticated;

-- ── 2. RPC: resolve_participant_session ──────────────────
-- Translates a contest ID + auth.uid() into the exact Board Participant session,
-- including the board-specific timing configuration.
-- Blocked if contest OR active round is 'draft'.

CREATE OR REPLACE FUNCTION resolve_participant_session(p_contest_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Only allow if the contest is not draft
    IF NOT EXISTS (SELECT 1 FROM contests WHERE id = p_contest_id AND status != 'draft') THEN
        RETURN NULL;
    END IF;

    SELECT json_build_object(
        'id',              bp.id,
        'board_id',        bp.board_id,
        'participant_id',  bp.participant_id,
        'status',          bp.status,
        'deadline',        bp.deadline,
        'started_at',      bp.started_at,
        'submitted_at',    bp.submitted_at,
        'score',           bp.score,
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
    WHERE p.contest_id = p_contest_id
      AND p.external_uid = auth.uid()::TEXT
      AND r.status != 'draft'
    ORDER BY bp.started_at DESC NULLS LAST, r.order_index DESC
    LIMIT 1;

    RETURN v_result;

END;
$$;

GRANT EXECUTE ON FUNCTION resolve_participant_session(TEXT) TO anon, authenticated;
