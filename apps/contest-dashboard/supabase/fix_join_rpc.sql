-- 1. Fix update_participant_status_rpc parameter name
DROP FUNCTION IF EXISTS update_participant_status_rpc(uuid, text);

CREATE OR REPLACE FUNCTION update_participant_status_rpc(
    p_bp_id uuid,  -- Renamed from p_participant_id
    p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE board_participants
    SET status = p_status::participant_status
    WHERE id = p_bp_id;
END;
$$;

-- 2. Create join_contest_rpc for guest/test participation
DROP FUNCTION IF EXISTS join_contest_rpc(text, text, boolean);

CREATE OR REPLACE FUNCTION join_contest_rpc(
    p_contest_id text,
    p_display_name text,
    p_is_test boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_participant_id uuid;
    v_board_id uuid;
    v_bp_id uuid;
    v_user_id uuid := auth.uid();
BEGIN
    -- 1. Get user_id if logged in, otherwise use a fallback or throw error 
    -- (In test mode we usually expect anon login so auth.uid() is not null)
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Vui lòng đăng nhập ẩn danh trước khi tham gia.';
    END IF;

    -- 2. Find the first active exam board for this contest (via rounds)
    SELECT eb.id INTO v_board_id
    FROM exam_boards eb
    JOIN rounds r ON eb.round_id = r.id
    WHERE r.contest_id = p_contest_id
    LIMIT 1;

    IF v_board_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy cụm thi hợp lệ cho cuộc thi này.';
    END IF;

    -- 3. Check if participant already exists in 'participants' for this user in this contest
    SELECT id INTO v_participant_id
    FROM participants
    WHERE contest_id = p_contest_id AND external_uid = v_user_id::text
    LIMIT 1;

    -- 4. If not, create participant
    IF v_participant_id IS NULL THEN
        INSERT INTO participants (
            contest_id,
            username,
            display_name,
            external_uid,
            joined_at
        )
        VALUES (
            p_contest_id,
            'guest_' || substring(v_user_id::text, 1, 8),
            p_display_name,
            v_user_id::text,
            NOW()
        )
        RETURNING id INTO v_participant_id;
    END IF;

    -- 5. Create board_participant if not exists
    SELECT id INTO v_bp_id
    FROM board_participants
    WHERE board_id = v_board_id AND participant_id = v_participant_id
    LIMIT 1;

    IF v_bp_id IS NULL THEN
        INSERT INTO board_participants (
            board_id,
            participant_id,
            status,
            is_test,
            started_at
        )
        VALUES (
            v_board_id,
            v_participant_id,
            'attending',
            p_is_test,
            NOW()
        )
        RETURNING id INTO v_bp_id;
    END IF;

    RETURN v_bp_id;
END;
$$;
