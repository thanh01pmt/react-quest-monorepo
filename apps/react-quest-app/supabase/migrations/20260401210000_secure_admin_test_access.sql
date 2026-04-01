-- ============================================================
-- Secure Admin Test Access (Phương án B - Server-side auth)
-- Nguyên tắc:
--   - get_public_contest_info: CHỈ trả về contest KHÔNG phải draft
--     → Học sinh không biết contest draft có tồn tại hay không
--   - resolve_participant_session: kiểm tra auth.uid() server-side
--     → is_test=TRUE session → admin test (bypass draft/timing)
--     → Người lạ có link cũng không vào được vì không có auth session phù hợp
-- ============================================================

-- ── 1. get_public_contest_info ──────────────────────────────
-- CHỈ trả về khi status != 'draft' (học sinh KHÔNG thấy draft)
-- Admin xem được qua resolve_participant_session (có is_test session)
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
        'id',          id::text,
        'title',       title,
        'description', description,
        'status',      status
    )
    INTO v_result
    FROM contests
    -- UUID cast: p_contest_id là TEXT, cột id có thể là UUID
    WHERE id::text = p_contest_id
      AND status != 'draft';   -- Học sinh KHÔNG thấy draft
    
    RETURN v_result;  -- NULL nếu draft → frontend hiện lỗi cho HS
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_contest_info(TEXT) TO anon, authenticated;

-- ── 2. resolve_participant_session ───────────────────────────
-- Tra session qua auth.uid() (server-side) - hoàn toàn bảo mật:
--   - Admin có is_test=TRUE → bypass draft/timing
--   - HS có session hợp lệ → kiểm tra contest/round không phải draft
--   - Bất kỳ ai khác (kể cả có link) → trả về NULL
CREATE OR REPLACE FUNCTION resolve_participant_session(p_contest_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_uid    TEXT;
BEGIN
    -- Lấy uid của user đang đăng nhập (server-side, không thể giả mạo)
    v_uid := auth.uid()::TEXT;
    
    -- Nếu chưa đăng nhập → trả về NULL ngay
    IF v_uid IS NULL THEN
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
            'username',     p.username,
            'display_name', p.display_name
        )
    )
    INTO v_result
    FROM board_participants bp
    JOIN participants      p  ON p.id  = bp.participant_id
    JOIN exam_boards       eb ON eb.id = bp.board_id
    JOIN rounds            r  ON r.id  = eb.round_id
    JOIN exams             e  ON e.id  = eb.exam_id
    JOIN contests          c  ON c.id  = p.contest_id
    WHERE p.contest_id::text = p_contest_id   -- UUID→TEXT cast
      AND p.external_uid    = v_uid            -- Kiểm tra server-side, không thể giả mạo
      AND (
            -- Admin test: is_test=TRUE bypass mọi ràng buộc trạng thái/thời gian
            bp.is_test = TRUE
            OR
            -- Học sinh bình thường: contest và round phải active
            (c.status != 'draft' AND r.status != 'draft')
          )
    -- Ưu tiên: session is_test trước, rồi mới đến session gần nhất
    ORDER BY bp.is_test DESC, bp.started_at DESC NULLS LAST
    LIMIT 1;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION resolve_participant_session(TEXT) TO anon, authenticated;
