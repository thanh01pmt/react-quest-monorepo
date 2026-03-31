## MODIFIED Requirements

### Requirement: Contest CRUD

The system SHALL allow admins to create, read, update, and delete contests with hierarchical structure (Contest → Rounds → Exams + Boards).

#### Scenario: Create a new contest

- **WHEN** an admin clicks "Create Contest"
- **AND** fills in title and global settings (scoring mode, allowed languages)
- **THEN** the system SHALL save the contest to Supabase `contests` table
- **AND** auto-generate a 6-character `short_code`
- **AND** display it in the contest list with round count and board count

#### Scenario: Create a contest via JSON import

- **WHEN** an admin clicks "Import JSON" on the contest list page
- **AND** provides a valid contest JSON (including rounds, exams, and boards)
- **THEN** the system SHALL create the contest and all nested entities
- **AND** resolve exam references by title within each round

### Requirement: Challenge Builder

The system SHALL provide a form-based editor for creating algo challenges with test cases, scoped to individual exams within rounds.

#### Scenario: Add a challenge to an exam

- **WHEN** an admin opens the challenge builder for an exam within a round
- **AND** provides problem description, sample cases, and hidden cases
- **THEN** the system SHALL store the challenge data in the exam's `quest_data` JSONB field

### Requirement: Live Monitoring

The system SHALL display real-time contest progress using Supabase Realtime, filterable by round and board.

#### Scenario: View live leaderboard at board level

- **WHEN** an admin opens the live monitor page and selects a specific round and board
- **THEN** the system SHALL display the leaderboard for that board only
- **AND** subscribe to `submissions` and `contest_progress` tables via Supabase Realtime

#### Scenario: View live leaderboard at round level

- **WHEN** an admin opens the live monitor page and selects a round without filtering by board
- **THEN** the system SHALL display an aggregated leaderboard across all boards in that round

#### Scenario: View live leaderboard at contest level

- **WHEN** an admin opens the live monitor page and selects "All Rounds"
- **THEN** the system SHALL display a cumulative leaderboard across all rounds

### Requirement: Admin Actions

The system SHALL allow admins to perform emergency actions during a contest, scoped to rounds and boards.

#### Scenario: Extend time for a participant in a board

- **WHEN** an admin selects a participant within a board and clicks "Extend Time"
- **AND** specifies additional minutes
- **THEN** the system SHALL update the board_participant's `deadline` in the database

#### Scenario: Start a round

- **WHEN** an admin clicks "Start Round" for a scheduled/lobby round
- **THEN** the system SHALL call the `start_round()` DB function
- **AND** transition the round status to `active`

#### Scenario: End a round

- **WHEN** an admin clicks "End Round" for an active round
- **THEN** the system SHALL call the `end_round()` DB function
- **AND** transition the round status to `ended`
- **AND** auto-submit all active board_participants

### Requirement: Results Export

The system SHALL export results at board, round, and contest levels.

#### Scenario: Export round results to CSV

- **WHEN** an admin clicks "Export Results" on a completed round
- **THEN** the system SHALL generate a CSV with display_name, board, scores per challenge, total score, and ranking

## ADDED Requirements

### Requirement: Round Management

The system SHALL allow admins to create, reorder, configure, and delete rounds within a contest.

#### Scenario: Add a round with timing

- **WHEN** an admin adds a round to a contest
- **AND** configures timing mode (synchronized or per-board) and promotion config
- **THEN** the system SHALL save the round to the `rounds` table with the specified configuration

#### Scenario: Reorder rounds

- **WHEN** an admin drags a round to a new position
- **THEN** the system SHALL update `order_index` for all affected rounds

### Requirement: Exam Management

The system SHALL allow admins to create and manage multiple exam variants per round.

#### Scenario: Create an exam with challenges

- **WHEN** an admin adds an exam to a round
- **AND** provides a title and challenges (via form or JSON import)
- **THEN** the system SHALL save the exam to the `exams` table

### Requirement: Board Management

The system SHALL allow admins to create and manage exam boards (clusters) per round.

#### Scenario: Create a board and assign exam

- **WHEN** an admin adds a board to a round
- **AND** selects an exam from the round's exam list
- **THEN** the system SHALL save the board to `exam_boards` with the selected `exam_id`

#### Scenario: Configure board-specific timing

- **WHEN** timing mode is "per_board" for the round
- **AND** admin configures timing on a specific board
- **THEN** the system SHALL save the timing to `exam_boards.timing_override`

#### Scenario: Share exam across boards

- **WHEN** an admin assigns the same exam to multiple boards
- **THEN** the system SHALL allow multiple `exam_boards` rows to reference the same `exam_id`

### Requirement: Promotion Between Rounds

The system SHALL support automated and manual promotion of participants between consecutive rounds.

#### Scenario: Auto-promote top N participants

- **WHEN** a round ends and promotion_config is `{mode: "auto", autoRule: {type: "top_n", value: 50}}`
- **THEN** the system SHALL select the top 50 participants by score from the round leaderboard
- **AND** create `board_participants` entries in the next round's boards

#### Scenario: Manual promotion review

- **WHEN** a round ends and promotion_config is `{mode: "manual"}`
- **THEN** an admin SHALL see a promotion review page with the round's rankings
- **AND** manually select which participants advance to the next round

### Requirement: Board Participant Assignment

The system SHALL allow admins to assign participants to specific boards within a round.

#### Scenario: Assign participants to board

- **WHEN** an admin selects participants from the contest's participant list
- **AND** assigns them to a specific board
- **THEN** the system SHALL create `board_participants` entries

#### Scenario: Auto-distribute participants across boards

- **WHEN** an admin clicks "Auto-distribute" for a round with multiple boards
- **THEN** the system SHALL evenly distribute unassigned participants across all boards in the round

### Requirement: JSON Import/Export

The system SHALL support JSON import and export at three levels: full contest, single round, and single exam.

#### Scenario: Import full contest JSON

- **WHEN** an admin uploads a valid contest JSON file
- **THEN** the system SHALL create the contest with all nested rounds, exams, and boards

#### Scenario: Export contest to JSON

- **WHEN** an admin clicks "Export JSON" on a contest
- **THEN** the system SHALL generate a JSON file containing the full hierarchy

#### Scenario: Import a single exam

- **WHEN** an admin uploads a JSON containing only quest_data
- **THEN** the system SHALL update the selected exam's `quest_data` field
