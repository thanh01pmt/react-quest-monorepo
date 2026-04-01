## ADDED Requirements

### Requirement: RPC Gateway for Public Contest Access

The system SHALL expose Postgres RPC functions callable by the `anon` role to allow
the Quest Player app to access and interact with a specific contest session identified
only by UUID, without requiring Supabase authentication.

#### Scenario: Fetch Contest Session

- **WHEN** `get_contest_session(p_bp_id)` is called with a valid board_participant UUID
- **THEN** the function returns a JSON object containing board_participant, exam_board, and exam data
- **AND** the anon role can execute this without a valid Supabase JWT

#### Scenario: Submit Solution

- **WHEN** `submit_contest_solution(...)` is called with required fields
- **THEN** a row is inserted into `submissions` table
- **AND** the operation succeeds for the anon role without direct table INSERT permission

#### Scenario: Update Participant Status

- **WHEN** `update_participant_status_rpc(p_bp_id, p_status)` is called
- **THEN** the `board_participants.status` column is updated for that specific record
- **AND** the operation is scoped strictly to the provided UUID (no bulk update possible)

### Requirement: Decouple participants from Supabase Auth

The `participants` table SHALL NOT enforce a foreign key relationship to `auth.users`,
allowing participants identified by external identity providers (Firebase Auth, etc.)
to be enrolled without a Supabase account.

#### Scenario: Insert participant with Firebase UID

- **WHEN** the contest dashboard inserts a participant with an external Firebase UID
- **THEN** the insert succeeds without a corresponding Supabase auth.users record
- **AND** the `external_uid` column stores the string value of the Firebase UID
