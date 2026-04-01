-- Fix Admin RLS
-- Prevents participants (who have a username in user_metadata) from masquerading as admins in Contest Dashboard.

-- Contests
DROP POLICY IF EXISTS "Admin Manage Contests" ON contests;
CREATE POLICY "Admin Manage Contests" ON contests FOR ALL 
USING (auth.role() = 'authenticated' AND auth.jwt() -> 'user_metadata' ->> 'username' IS NULL);

-- Rounds
DROP POLICY IF EXISTS "Admin Manage Rounds" ON rounds;
CREATE POLICY "Admin Manage Rounds" ON rounds FOR ALL 
USING (auth.role() = 'authenticated' AND auth.jwt() -> 'user_metadata' ->> 'username' IS NULL);

-- Exams
DROP POLICY IF EXISTS "Admin Manage Exams" ON exams;
CREATE POLICY "Admin Manage Exams" ON exams FOR ALL 
USING (auth.role() = 'authenticated' AND auth.jwt() -> 'user_metadata' ->> 'username' IS NULL);

-- Exam Boards
DROP POLICY IF EXISTS "Admin Manage Boards" ON exam_boards;
CREATE POLICY "Admin Manage Boards" ON exam_boards FOR ALL 
USING (auth.role() = 'authenticated' AND auth.jwt() -> 'user_metadata' ->> 'username' IS NULL);

-- Participants
DROP POLICY IF EXISTS "Admin Manage All Participants" ON participants;
CREATE POLICY "Admin Manage All Participants" ON participants FOR SELECT 
USING (auth.role() = 'authenticated' AND auth.jwt() -> 'user_metadata' ->> 'username' IS NULL);

-- Board Participants
DROP POLICY IF EXISTS "Admin Manage Board Participants" ON board_participants;
CREATE POLICY "Admin Manage Board Participants" ON board_participants FOR ALL 
USING (auth.role() = 'authenticated' AND auth.jwt() -> 'user_metadata' ->> 'username' IS NULL);
