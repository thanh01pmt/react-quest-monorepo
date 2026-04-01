--
-- Admin Auth Utilities for Manual Participant Creation
--

CREATE OR REPLACE FUNCTION public.admin_create_participant_auth(
    p_username TEXT,
    p_email TEXT,
    p_password TEXT,
    p_contest_id TEXT,
    p_display_name TEXT
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_participant_id UUID;
BEGIN
    -- 1. Create the user in auth.users
    -- Note: This requires pgcrypto extension for hashing
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('username', p_username, 'display_name', p_display_name),
        false,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO v_user_id;

    -- 2. Create the identity for the user (required by GoTrue)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', p_email),
        'email',
        now(),
        now(),
        now()
    );

    -- 3. Create the participant record in public schema
    INSERT INTO public.participants (
        contest_id,
        external_uid,
        username,
        display_name,
        email
    )
    VALUES (
        p_contest_id,
        v_user_id::TEXT,
        p_username,
        p_display_name,
        p_email
    )
    RETURNING id INTO v_participant_id;

    RETURN v_participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the function is executable by roles used by the apps
GRANT EXECUTE ON FUNCTION admin_create_participant_auth(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
