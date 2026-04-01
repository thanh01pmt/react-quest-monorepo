-- 
-- Init App Tables Migration
-- Created at: 2026-04-01
--

DROP FUNCTION IF EXISTS public.update_participant_status_rpc(uuid,text);

-- 1. Table: user_progress (Practice Mode)
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_xp BIGINT DEFAULT 0,
    categories JSONB DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress FOR UPDATE 
USING (auth.uid() = user_id);


-- 2. Table: shared_sessions (Practice Mode Sharing)
CREATE TABLE IF NOT EXISTS public.shared_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serialized_session TEXT NOT NULL,
    original_session_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    share_type TEXT CHECK (share_type IN ('clean', 'full')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for shared_sessions
CREATE POLICY "Anyone can view shared sessions" 
ON public.shared_sessions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create shared sessions" 
ON public.shared_sessions FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own shared sessions" 
ON public.shared_sessions FOR DELETE 
USING (auth.uid() = user_id);


-- 3. Function to handle updated_at for shared_sessions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sessions_timestamp
BEFORE UPDATE ON public.shared_sessions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. RPC for Contest Status Update (if not already present)
-- Ensuring update_participant_status_rpc exists for SupabaseContestService
CREATE OR REPLACE FUNCTION public.update_participant_status_rpc(
    p_participant_id UUID,
    p_status TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.board_participants 
    SET status = p_status, 
        submitted_at = CASE WHEN p_status = 'submitted' THEN NOW() ELSE submitted_at END
    WHERE id = p_participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
