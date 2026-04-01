# Capability: Contest Management

## ADDED Requirements

### Requirement: Supabase-Only Contest Flow
All contest data operations SHALL be performed exclusively via `SupabaseContestService.ts` RPC functions, with no Firebase/Firestore fallback paths.

#### Scenario: Load Contest Session
- **WHEN** user navigates to a contest with a UUID-based contest ID
- **THEN** `getSupabaseContestSession(contestId)` fetches contest config and participant data via `get_contest_session` RPC

#### Scenario: No Firestore Fallback
- **WHEN** any contest operation is triggered (load, submit, lock)
- **THEN** the operation MAY NOT call any function from `ContestService.ts` — all paths use `SupabaseContestService.ts`

### Requirement: Restore Challenge States from Supabase
The application SHALL restore previous submission history from Supabase when a participant rejoins a contest.

#### Scenario: Rejoin Contest
- **WHEN** participant refreshes the page or navigates back to the exam
- **THEN** `getSupabaseSubmissions(boardParticipantId)` is called and challenge states (bestScore, attempts, status) are restored from the returned submissions

## MODIFIED Requirements

### Requirement: Contest Database Unification
The application SHALL exclusively use Supabase for all contest-related data operations, including participant registration and challenge submissions.

#### Scenario: Register Participant
- **WHEN** user provides contact info in `EntrancePage`
- **THEN** participant data is returned from the pre-created `board_participants` record via `get_contest_session` RPC (no direct insert needed for pre-created model)

#### Scenario: Save Submission
- **WHEN** user submits code in `ExamRoom`
- **THEN** a submission record is created in Supabase via `submit_contest_solution` RPC (SECURITY DEFINER)

#### Scenario: Lock Exam on Timeout
- **WHEN** participant's deadline expires
- **THEN** `updateSupabaseParticipantStatus(participantId, 'submitted')` is called via `update_participant_status_rpc` RPC

## REMOVED Requirements

### Requirement: Firestore Support
**Reason**: Consolidating on Supabase for real-time consistency with the Dashboard. Firestore path created confusing dual-branch logic gated on `IS_UUID_REGEX`.
**Migration**: Remove all imports of `ContestService.ts` from `ContestContext.tsx`. Delete `ContestService.ts`. Remove `IS_UUID_REGEX` branching logic.
