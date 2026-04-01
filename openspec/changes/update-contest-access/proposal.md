# Change: Update Contest Access and Timing Resolution

## Why
Currently, students can theoretically access contests in `draft` mode if they know the URL, because the current RPC bypasses RLS without explicit status checks. Additionally, the countdown timer in the Lobby needs to accurately reflect the actual Vòng thi (Round) or Cụm thi (Exam Board) time, rather than a generic Contest time, to support multi-round configurations properly.

## What Changes
- Enforce strict state-based access controls for participants entering a contest.
- Deny access to `draft` contests entirely, redirecting users to the home page with an error message.
- Extract `start_time` and `end_time` from the specific `exam_boards` (via `timing_override`) or `rounds` for the authenticated user's session.
- Add `resolve_participant_session(contest_id)` RPC to translate a string contest ID and JWT `auth.uid()` into the correct Board Participant session without exposing UUIDs on the client URL.
- Update the React Entrance Page logic to show a Lobby and Countdown uniquely tied to the student's assigned Exam Board.

## Impact
- Specs: `contest-access`
- Code: 
  - `apps/react-quest-app/supabase/migrations/20260401_resolve_participant_session.sql`
  - `apps/react-quest-app/src/services/SupabaseContestService.ts`
  - `apps/react-quest-app/src/contexts/ContestContext.tsx`
  - `apps/react-quest-app/src/pages/EntrancePage/index.tsx`
