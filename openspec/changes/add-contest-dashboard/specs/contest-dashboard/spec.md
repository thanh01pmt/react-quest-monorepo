## ADDED Requirements

### Requirement: Admin Authentication

The system SHALL authenticate admins via Supabase Auth before granting access to the dashboard.

#### Scenario: Admin login

- **WHEN** an admin navigates to `/login`
- **AND** enters valid credentials
- **THEN** the system SHALL authenticate via Supabase Auth
- **AND** redirect to the contest list page

### Requirement: Contest CRUD

The system SHALL allow admins to create, read, update, and delete contests.

#### Scenario: Create a new contest

- **WHEN** an admin clicks "Create Contest"
- **AND** fills in title, description, start/end time, and duration
- **THEN** the system SHALL save the contest to Supabase `contests` table
- **AND** display it in the contest list

### Requirement: Challenge Builder

The system SHALL provide a form-based editor for creating algo challenges with test cases.

#### Scenario: Add a challenge with test cases

- **WHEN** an admin opens the challenge builder for a contest
- **AND** provides problem description, sample cases, and hidden cases
- **THEN** the system SHALL store the challenge data in the contest's `quest_data` JSONB field

### Requirement: Account Provisioning

The system SHALL generate Supabase Auth accounts in bulk for contestants.

#### Scenario: Generate 100 accounts

- **WHEN** an admin specifies a username pattern (e.g. "ts" prefix) and count (100)
- **THEN** the system SHALL create 100 accounts (ts001 to ts100) via Supabase Auth API
- **AND** generate random passwords
- **AND** provide a downloadable CSV with credentials

### Requirement: Live Monitoring

The system SHALL display real-time contest progress using Supabase Realtime.

#### Scenario: View live leaderboard

- **WHEN** an admin opens the live monitor page during an active contest
- **THEN** the system SHALL subscribe to the `submissions` table via Supabase Realtime
- **AND** update the leaderboard automatically when new submissions arrive

### Requirement: Admin Actions

The system SHALL allow admins to perform emergency actions during a contest.

#### Scenario: Extend time for a participant

- **WHEN** an admin selects a participant and clicks "Extend Time"
- **AND** specifies additional minutes
- **THEN** the system SHALL update the participant's `deadline` in the database

### Requirement: Results Export

The system SHALL export final contest results.

#### Scenario: Export results to CSV

- **WHEN** an admin clicks "Export Results" on a completed contest
- **THEN** the system SHALL generate a CSV containing display_name, email, scores per challenge, total score, and ranking
