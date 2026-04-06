## MODIFIED Requirements

### Requirement: Submission Process
The system SHALL support submitting the entire exam as a single batch.

#### Scenario: Submit Full Exam
- **WHEN** the student clicks "Nộp bài"
- **THEN** the system gathers all source codes for all quests in the exam
- **AND** sends them in a single `POST /submission-code` request
- **AND** receives a unified result object containing scores and test results for all quests

### Requirement: Leaderboard Calculation
The leaderboard SHALL be calculated based on the latest and best batch submission score.

#### Scenario: Update Leaderboard
- **WHEN** a batch submission is recorded
- **THEN** the leaderboard view updates to use the `score` field of the submission as the total score for the participant
- **AND** no longer needs to aggregate individual quest scores via `SUM(MAX(score))`
