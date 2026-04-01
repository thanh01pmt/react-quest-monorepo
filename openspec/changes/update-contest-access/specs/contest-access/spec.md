## ADDED Requirements
### Requirement: Strict Draft Prevention
The system MUST prevent any non-admin user from accessing or viewing a contest if its status or its active round's status is `draft`.

#### Scenario: Student attempts to access a draft contest
- **WHEN** a student navigates to `/contest/:slug` of a contest in `draft` status
- **THEN** the system returns an error "Cuộc thi không tồn tại hoặc chưa mở" and redirects to the home page.

### Requirement: Timing Resolution by Board
The system MUST determine a student's contest timing based on their assigned Exam Board, falling back to the Round timing if no board override exists.

#### Scenario: Student enters the lobby
- **WHEN** a student logs into a `scheduled` contest
- **THEN** they enter the Lobby and see a countdown timer matching their specific Exam Board's `start_time`.

### Requirement: RPC Session Resolution
The system MUST resolve a student's active session using only the textual contest ID and the JWT `auth.uid()`, preventing direct UUID URL manipulation.

#### Scenario: Resolving session for logged-in user
- **WHEN** the React Client requests the session for contest "tin-hoc-tre-2026"
- **THEN** the backend RPC resolves the `board_participants` record matching the user's `auth.uid()` and returns the session details with Board-specific timing.
