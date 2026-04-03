# react-quest-app Specification

## Purpose

TBD - created by archiving change update-scratch-player. Update Purpose after archive.

## Requirements

### Requirement: Scratch File or Link Input

The ScratchUploader SHALL accept either a direct `.sb3` file upload OR a public Scratch project URL.

#### Scenario: User provides a Scratch project URL

- **WHEN** the student pastes a URL like `https://scratch.mit.edu/projects/123456789/` and clicks "Fetch"
- **THEN** the system uses `@turbowarp/sbdl` to download the `.sb3` project bundle and stages it in the UI as a `.sb3` File.

### Requirement: Local Analysis of Scratch File

The system SHALL provide immediate feedback by analyzing the `.sb3` file with public test cases before formal submission.

#### Scenario: Running public tests before submit

- **WHEN** the student successfully stages a `.sb3` file
- **THEN** the system executes an analysis step to test the `.sb3` against the public test cases associated with the Quest, displaying the passed/failed results interactively on the screen.

### Requirement: Final Submission Decoupled from Analysis

The actual recording of scores and final grading MUST ONLY happen upon a definitive "Submit" action by the student.

#### Scenario: Student is ready to submit

- **WHEN** the student is satisfied with the local analysis and clicks "Submit"
- **THEN** the system pushes the `.sb3` blob to the server for authoritative evaluation and score recording in the database.

### Requirement: Scratch Player Render Condition

The system SHALL render the `ScratchUploader` component instead of `QuestPlayer` whenever the current quest is identified as a Scratch assignment.

#### Scenario: Identifying a Scratch Quest

- **WHEN** `(currentQuest as any).gameType === 'scratch'` OR `(currentQuest as any).gameConfig?.type === 'scratch'`
- **THEN** it branches into the Scratch room view containing the `ScratchUploader`, preventing the `QuestPlayer` error.

### Requirement: Asynchronous Updates

The client SHALL pull the submission status until a final `status` (such as `accepted`, `wrong`, `error`) is reached.

#### Scenario: Polling termination

- **WHEN** the server returns `status === 'accepted'`.
- **THEN** the client SHALL stop polling immediately.
