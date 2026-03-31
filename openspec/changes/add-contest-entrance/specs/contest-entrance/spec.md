## ADDED Requirements

### Requirement: Contest Entrance Authentication

The system SHALL allow contestants to authenticate using pre-created username/password credentials to access a specific contest.

#### Scenario: Successful login with valid credentials

- **WHEN** a contestant navigates to `/contest/:contestId`
- **AND** enters a valid username and password
- **AND** provides contact information (display name, email, phone)
- **THEN** the system SHALL authenticate the user via Firebase Auth
- **AND** create a participant record in `contest_participants`
- **AND** redirect the user to `/contest/:contestId/exam`

#### Scenario: Login with invalid credentials

- **WHEN** a contestant enters an invalid username or password
- **THEN** the system SHALL display an error message
- **AND** remain on the entrance page

#### Scenario: Contest not found

- **WHEN** a contestant navigates to `/contest/:contestId` with an invalid `contestId`
- **THEN** the system SHALL display a "Contest not found" error

### Requirement: Contest Time Enforcement

The system SHALL enforce contest start and end times.

#### Scenario: Contest not yet started

- **WHEN** a contestant accesses the entrance page before `startTime`
- **THEN** the system SHALL display a countdown to the start time
- **AND** disable the login form

#### Scenario: Contest has ended

- **WHEN** a contestant accesses the entrance page after `endTime`
- **THEN** the system SHALL display "Cuộc thi đã kết thúc"
- **AND** disable the login form

### Requirement: Exam Room Challenge Navigation

The system SHALL display all challenges in a sidebar and allow contestants to switch between them.

#### Scenario: Enter exam room

- **WHEN** an authenticated contestant accesses `/contest/:contestId/exam`
- **THEN** the system SHALL render a sidebar listing all challenges with their status
- **AND** load the first challenge into the QuestPlayer component

#### Scenario: Switch between challenges

- **WHEN** a contestant clicks a different challenge in the sidebar
- **THEN** the system SHALL load the selected challenge into QuestPlayer
- **AND** preserve any unsaved code for the previous challenge

### Requirement: Challenge Submission

The system SHALL capture and score each challenge submission.

#### Scenario: Submit a challenge solution

- **WHEN** a contestant runs their code and all test cases complete
- **THEN** the system SHALL calculate the score as `(passed / total) * 100`
- **AND** save the submission to `contest_submissions`
- **AND** update the sidebar status icon for that challenge

#### Scenario: Multiple submissions

- **WHEN** a contestant submits the same challenge multiple times
- **AND** `scoringMode` is "highest"
- **THEN** the system SHALL retain the highest score across all attempts

### Requirement: Countdown Timer

The system SHALL display a countdown timer showing remaining exam time.

#### Scenario: Timer reaches zero

- **WHEN** the countdown timer reaches zero
- **THEN** the system SHALL auto-submit all pending work
- **AND** lock the exam room (disable further editing)
- **AND** display the results summary

### Requirement: Final Submission

The system SHALL allow contestants to submit all their work before the timer expires.

#### Scenario: Manual final submission

- **WHEN** a contestant clicks "Nộp bài"
- **THEN** the system SHALL show a confirmation dialog
- **AND** upon confirmation, lock the exam and display results

### Requirement: Exam Room Route Guard

The system SHALL prevent unauthenticated access to the exam room.

#### Scenario: Unauthenticated access to exam room

- **WHEN** an unauthenticated user navigates to `/contest/:contestId/exam`
- **THEN** the system SHALL redirect to `/contest/:contestId`
